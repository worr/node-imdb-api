"use strict";

import {
    isEpisode,
    isError,
    isMovie,
    isTvshow,
    OmdbEpisode,
    OmdbError,
    OmdbMovie,
    OmdbSearch,
    OmdbSearchResult,
    OmdbSeason,
    OmdbTvshow,
} from "./interfaces";

import rp = require("request-promise-native");

/**
 * @hidden
 */
const omdbapi = "https://www.omdbapi.com/";

/**
 * Options to manipulate movie fetching. These can be passed to {@link get}, {@link search}
 * or the constructor for {@link Client}.
 */
export interface MovieOpts {
    /**
     * API key for omdbapi. Needed to make any API calls.
     *
     * Get one [here](https://www.patreon.com/posts/api-is-going-10743518)
     */
    apiKey?: string;

    /**
     * Timeout in milliseconds to wait before giving up on a request
     */
    timeout?: number;
}

/**
 * An explicit request for a movie. Does not do searching, this is meant
 * to specify *one* movie.
 *
 * One of {@link name} or {@link id} *MUST* be requested. {@link year} can be used to ensure
 * that the movie you're looking for is selected in the case that there exists
 * more than one movie with the same name.
 *
 * {@link short_plot} can be used to specify whether or not a short or a long plot
 * description is returned with your movie. Default is to return a full plot.
 */
export interface MovieRequest {
    /**
     * Name of the movie
     *
     * Unfortunately, only English names are supported
     * by omdb at the moment.
     */
    name?: string;

    /**
     * imdb id of the movie
     */
    id?: string;

    /**
     * Year that the movie was released
     */
    year?: number;

    /**
     * Whether or not to request a short plot. Default is full plot.
     */
    short_plot?: boolean;
}

/**
 * Type of media we're searching for
 */
export type RequestType = "movie"
    | "series"
    | "episode"
    | "game";

/**
 * A search for a movie. This will fetch multiple results based on fuzzy matches
 * for a particular piece of media.
 */
export interface SearchRequest {
    /**
     * Title of the media that we're looking for. Unfortunately, only English
     * names are supported by omdb at the moment.
     */
    name: string;

    /**
     * Type of media we're looking for
     */
    reqtype?: RequestType;

    /**
     * Year that the media was released
     */
    year?: number;
}

/**
 * @hidden
 */
function reqtoqueryobj(req: SearchRequest, apikey: string, page: number): object {
    return {
        apikey,
        page,
        r: "json",
        s: req.name,
        type: req.reqtype,
        y: req.year,
    };
}

/**
 * @hidden
 */
const trans_table = {
    Genre: "genres",
    Language: "languages",
    imdbRating: "rating",
    imdbVotes: "votes",
};

/**
 * A movie as returned by {@link get}, {@link search}, or any of the methods
 * from {@link Client}. This is not meant to be created directly by consumers of
 * this lib, but instead through querying omdb.
 */
export class Movie {
    /** id of the movie on imdb */
    public imdbid: string;
    /** direct URL to the movie on imdb */
    public imdburl: string;
    /** the genres that this movie belongs to */
    public genres: string;
    /** languages this movie was released in */
    public languages: string;
    /** countries this movie was released in */
    public country: string;
    /** votes received on imdb */
    public votes: string;
    /** whether or not this is a TV series */
    public series: boolean;
    /** the rating as it appears on imdb */
    public rating: number;
    /** the runtime of the movie */
    public runtime: string;
    /** the title of the movie in English */
    public title: string;
    /** year the movie was released */
    public year: number;

    /** type of media (see {@link RequestType}) */
    public type: string;
    /** link to the poster for this movie */
    public poster: string;
    /** score from a bunch of different review sites */
    public metascore: string;
    /** the plot (can either be long or short as specified in {@link MovieRequest}) */
    public plot: string;
    /** what the movie was rated in its country of release */
    public rated: string;
    /** the directors of the movie */
    public director: string;
    /** writers of the movie */
    public writer: string;
    /** leading actors that starred in the movie */
    public actors: string;
    /** date that the movie was originally released */
    public released?: Date;
    /** title of the movie */
    public name: string;

    /**
     * @hidden
     */
    protected _year_data: string;

    /**
     * This takes a result from omdb, and transforms it into an
     * object consumable by customers of imdb-api.
     *
     * This isn't meant for direct consumption by API consumers,
     * and consumers should look at {@link get}, {@link search} or
     * any of the methods on {@link Client} to get a movie instead.
     *
     * @param obj Results from omdb
     */
    constructor(obj: OmdbMovie) {
        for (const attr of Object.getOwnPropertyNames(obj)) {
            if (attr === "Year") {
                this._year_data = obj[attr];
                // check for emdash as well
                if (!obj[attr].match(/\d{4}[\-–](?:\d{4})?/)) {
                    const val = parseInt(obj[attr], 10);
                    if (isNaN(val)) {
                        throw new TypeError("invalid year");
                    }
                    this[attr.toLowerCase()] = val;
                }
            } else if (attr === "Released") {
                const val = new Date(obj[attr]);
                if (isNaN(val.getTime())) {
                    this.released = undefined;
                } else {
                    this.released = val;
                }
            } else if (attr === "imdbRating") {
                const key = trans_table[attr];
                const val = parseFloat(obj[attr]);
                this[key] = isNaN(val) ? 0 : val;
            } else if (trans_table[attr] !== undefined) {
                this[trans_table[attr]] = obj[attr];
            } else {
                this[attr.toLowerCase()] = obj[attr];
            }
        }

        this.name = this.title;
        this.series = this.type === "movie" ? false : true;
        this.imdburl = "https://www.imdb.com/title/" + this.imdbid;
    }
}

/**
 * An episode as returned by {@link TVShow.episodes}. This is not intended to be
 * instantiated by an API consumer, but instead from results from omdb.
 */
export class Episode extends Movie {
    /** what season this episode is a part of */
    public season: number;
    /** what number episode in the season this episode is */
    public episode: number;

    /**
     * Creates an epsiode from results from omdb. This is not intended for consumer use.
     * Please prefer {@link TVShow.epsiodes}.
     *
     * @param obj Episodes fetched from omdb
     * @param season Which season this episode belongs to
     *
     * @throws TypeError when the episode number is invalid
     */
    constructor(obj: OmdbEpisode, season: number) {
        super(obj);
        this.season = season;
        if (obj.hasOwnProperty("Episode")) {
            this.episode = parseInt(obj.Episode, 10);
            if (isNaN(this.episode)) {
                throw new TypeError("invalid episode");
            }
        }
    }
}

/**
 * A TVShow as returned from {@link get}, {@link search} or any of the methods from
 * {@link Client}. This is not intended to be directly created by consumers of this
 * library
 */
export class TVShow extends Movie {
    /** year this show started */
    public start_year: number;
    /** year this show ended if it's ended */
    public end_year?: number;
    /** how many seasons this show ran */
    public totalseasons: number;

    /**
     * @hidden
     */
    private _episodes: Episode[] = [];

    /**
     * @hidden
     */
    private opts: MovieOpts;

    /**
     * Creates a new {@link TVShow} from omdb results. This isn't intended to be
     * used by consumers of this library, instead see {@link get}, {@link search}
     * or any methods from {@link Client}.
     *
     * @param obj The tv show info we got from omdb
     * @param opts Options that we used to fetch this TVShow, so we can use
     * them to fetch episodes
     */
    constructor(obj: OmdbTvshow, opts: MovieOpts) {
        super(obj);
        const years = this._year_data.split("-");
        this.start_year = parseInt(years[0], 10);
        this.end_year = parseInt(years[1], 10) ? parseInt(years[1], 10) : undefined;
        this.totalseasons = parseInt(obj.totalSeasons, 10);
        this.opts = opts;
    }

    /**
     * Fetches episodes of a TV show
     *
     * @return Promise yielding list of episodes
     */
    public episodes(): Promise<Episode[]> {
        if (this._episodes.length !== 0) {
            return Promise.resolve(this._episodes);
        }

        const tvShow = this;

        const funcs = [];
        for (let i = 1; i <= tvShow.totalseasons; i++) {
            const reqopts = {
                json: true,
                qs: {
                    Season: i,
                    apikey: tvShow.opts.apiKey,
                    i: tvShow.imdbid,
                    r: "json",
                },
                timeout: undefined,
                url: omdbapi,
                withCredentials: false,
            };

            if ("timeout" in this.opts) {
                reqopts.timeout = this.opts.timeout;
            }

            funcs.push(rp(reqopts));
        }

        const prom = Promise.all(funcs)
            .then((ep_data: OmdbSeason[] | OmdbError[]) => {
                const eps: Episode[] = [];

                for (const datum of ep_data) {
                    if (isError(datum)) {
                        throw new ImdbError(datum.Error);
                    }

                    const season = parseInt(datum.Season, 10);
                    for (const ep of Object.getOwnPropertyNames(datum.Episodes)) {
                        eps.push(new Episode(datum.Episodes[ep], season));
                    }
                }

                tvShow._episodes = eps;

                return Promise.resolve(eps);
            });

        return prom;
    }
}

/**
 * A single search result from either {@link search} or {@link Client.search}.
 * This is not intended to be directly created by api consumers.
 */
export class SearchResult {
    /** name of the movie */
    public title: string;
    /** name of the movie */
    public name: string;
    /** year the movie was released */
    public year: number;
    /** imdb id of the movie */
    public imdbid: string;
    /** type of media we found */
    public type: RequestType;
    /** link to the poster for this movie */
    public poster: string;

    constructor(obj: OmdbSearchResult) {
        for (const attr of Object.getOwnPropertyNames(obj)) {
            if (attr === "Year") {
                this[attr.toLowerCase()] = parseInt(obj[attr], 10);
            } else {
                this[attr.toLowerCase()] = obj[attr];
            }
        }

        this.name = this.title;
    }
}

/**
 * A single page of {@link SearchResult}s. You can call {@link SearchResults.next} to fetch
 * the next page of results. This is not intended to be created by an API consumer, but instead
 * to be returned by {@link search} or {@link Client.search}.
 */
export class SearchResults {
    public results: SearchResult[] = [];
    public totalresults: number;

    /**
     * @hidden
     */
    private page: number;

    /**
     * @hidden
     */
    private opts: MovieOpts;

    /**
     * @hidden
     */
    private req: SearchRequest;

    /**
     * Builds a new {@link SearchResults}. Not intended to be called directly by
     * API consumers, as it only creates the object from omdb results.
     *
     * @param obj Search results from omdb
     * @param page Page number we're fetching
     * @param opts Stored options from our initial request
     * @param req A reference to the original request
     */
    constructor(obj: OmdbSearch, page: number, opts: MovieOpts, req: SearchRequest) {
        this.page = page;
        this.req = req;
        this.opts = opts;

        for (const attr of Object.getOwnPropertyNames(obj)) {
            if (attr === "Search") {
                for (const result of obj.Search) {
                    this.results.push(new SearchResult(result));
                }
            } else if (attr === "totalResults") {
                this[attr.toLowerCase()] = parseInt(obj[attr], 10);
            } else {
                this[attr.toLowerCase()] = obj[attr];
            }
        }
    }

    /**
     * Returns the next page of search results
     *
     * @return next page of search results
     */
    public next(): Promise<SearchResults> {
        return search(this.req, this.opts, this.page + 1);
    }
}

export class ImdbError {
    public name: string = "imdb api error";

    constructor(public message: string) { }
}

/**
 * Fetches a single movie by arbitrary criteria
 *
 * @param req set of requirements to search for
 * @param opts options that modify a search
 *
 * @return a promise yielding a movie
 */
export function get(req: MovieRequest, opts: MovieOpts): Promise<Movie> {
    try {
        return new Client(opts).get(req);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * Searches for a movie by arbitrary criteria
 *
 * @param req set of requirements to search for
 * @param opts options that modify a search
 * @param page page number to return
 *
 * @return a promise yielding search results
 */
export function search(req: SearchRequest, opts: MovieOpts, page?: number): Promise<SearchResults> {
    return new Client(opts).search(req, page);
}

/**
 * A client for fetching imdb information.
 *
 * This is primarly useful for making many requests without having
 * to pass a {@link MovieOpts} object to the same function over and
 * over again.
 *
 * All methods still accept an optional {@link MovieOpts} object in
 * the case that you want to override one or more of the options.
 * These per-method options are merged with the options that are
 * attached to the object, and override the object-local options.
 *
 * ```javascript
 * const cli = new imdb.Client({apiKey: 'xxxxxx', timeout: 30000});
 * cli.get({name: "The Toxic Avenger"}).then((movie) => {
 *   console.log(movie.title);
 * });
 *
 * cli.search({name: "The Toxic Avenger"}).then((search) => {
 *   for (let result of search.results) {
 *     console.log(result.title);
 *   }
 * });
 * ```
 */
export class Client {
    /**
     * @hidden
     */
    private opts: MovieOpts;

    /**
     * Creates a new {@link Client} object.
     *
     * @param opts A set of {@link MovieOpts} that will be applied to all
     * requests made by this object unless overridden.
     *
     * @throws {@link ImdbError} if an invalid {@link MovieOpts} is passed
     */
    constructor(opts: MovieOpts) {
        if (!opts.hasOwnProperty("apiKey")) {
            throw new ImdbError("Missing api key in opts");
        }
        this.opts = opts;
    }

    /**
     * Fetches a single movie by arbitrary criteria
     *
     * @param req set of requirements to search for
     * @param opts options that override the {@link Client}'s options
     *
     * @return a promise yielding a movie
     */
    public get(req: MovieRequest, opts?: MovieOpts): Promise<Movie> {
        opts = this.merge_opts(opts);

        const qs = {
            apikey: opts.apiKey,
            i: undefined,
            plot: req.short_plot ? "short" : "full",
            r: "json",
            t: undefined,
            y: req.year,
        };

        if (req.name) {
            qs.t = req.name;
        } else if (req.id) {
            qs.i = req.id;
        } else {
            return Promise.reject(new ImdbError("Missing one of req.id or req.name"));
        }

        const reqopts = {
            json: true,
            qs,
            timeout: undefined,
            url: omdbapi,
            withCredentials: false,
        };

        if ("timeout" in opts) {
            reqopts.timeout = opts.timeout;
        }

        const prom = rp(reqopts).then((data: OmdbMovie | OmdbError) => {
            let ret: Movie | Episode;
            if (isError(data)) {
                throw new ImdbError(`${data.Error}: ${(req.name ? req.name : req.id)}`);
            }

            if (isMovie(data)) {
                ret = new Movie(data);
            } else if (isTvshow(data)) {
                ret = new TVShow(data, opts);
            } else if (isEpisode(data)) {
                ret = new Episode(data, 30);
            } else {
                throw new ImdbError(`type: '${data.Type}' is not valid`);
            }

            return Promise.resolve(ret);
        });

        return prom;
    }

    /**
     * Searches for a movie by arbitrary criteria
     *
     * @param req set of requirements to search for
     * @param opts options that override the {@link Client}'s options
     * @param page page number to return
     *
     * @return a promise yielding search results
     */
    public search(req: SearchRequest, page?: number, opts?: MovieOpts): Promise<SearchResults> {
        opts = this.merge_opts(opts);
        if (page === undefined) {
            page = 1;
        }

        const qs = reqtoqueryobj(req, opts.apiKey, page);
        const reqopts = { qs, url: omdbapi, json: true, timeout: undefined, withCredentials: false };
        if ("timeout" in opts) {
            reqopts.timeout = opts.timeout;
        }

        const prom = rp(reqopts).then((data: OmdbSearch | OmdbError) => {
            if (isError(data)) {
                throw new ImdbError(`${data.Error}: ${req.name}`);
            }

            return Promise.resolve(new SearchResults(data, page, opts, req));
        });

        return prom;
    }

    /**
     * @hidden
     */
    private merge_opts(opts?: MovieOpts): MovieOpts {
        if (opts !== undefined) {
            return Object.assign({ ...this.opts }, opts);
        }

        return { ...this.opts };
    }
}
