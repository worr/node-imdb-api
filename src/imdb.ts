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

const omdbapi = "https://www.omdbapi.com/";

/**
 * Options to manipulate movie fetching
 */
export interface MovieOpts {
    /**
     * API key for omdbapi. Needed to make any API calls.
     *
     * Get one [here](https://www.patreon.com/posts/api-is-going-10743518)
     */
    apiKey: string;

    /**
     * timeout in milliseconds to wait before giving up on a request
     */
    timeout?: number;
}

/**
 * An explicit request for a movie. Does not do searching, this is meant
 * to specify *one specific* movie.
 */
export interface MovieRequest {
    /**
     * Name of the movie
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
     * Title of the media that we're looking for
     */
    title: string;

    /**
     * Type of media we're looking for
     */
    reqtype?: RequestType;

    /**
     * Year that the piece of media was released
     */
    year?: number;
}

function reqtoqueryobj(req: SearchRequest, apikey: string, page: number): object {
    return {
        apikey,
        page,
        r: "json",
        s: req.title,
        type: req.reqtype,
        y: req.year,
    };
}

const trans_table = {
    Genre: "genres",
    Language: "languages",
    imdbRating: "rating",
    imdbVotes: "votes",
};

export class Movie {
    public imdbid: string;
    public imdburl: string;
    public genres: string;
    public languages: string;
    public country: string;
    public votes: string;
    public series: boolean;
    public rating: number;
    public runtime: string;
    public title: string;
    public year: number;

    public type: string;
    public poster: string;
    public metascore: string;
    public plot: string;
    public rated: string;
    public director: string;
    public writer: string;
    public actors: string;
    public released: Date;
    public name: string;

    protected _year_data: string;

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
                    throw new TypeError("invalid release date");
                }
                this.released = val;
            } else if (attr === "imdbRating") {
                const val = parseFloat(obj[attr]);
                if (isNaN(val)) {
                    throw new TypeError("invalid rating");
                }
                this[trans_table[attr]] = parseFloat(obj[attr]);
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

export class Episode extends Movie {
    public season: number;
    public episode: number;

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

export class TVShow extends Movie {
    public start_year;
    public end_year;
    public totalseasons;

    private _episodes: Episode[] = [];
    private opts: MovieOpts;

    constructor(obj: OmdbTvshow, opts: MovieOpts) {
        super(obj);
        const years = this._year_data.split("-");
        this.start_year = parseInt(years[0], 10);
        this.end_year = parseInt(years[1], 10) ? parseInt(years[1], 10) : null;
        this.totalseasons = parseInt(this.totalseasons, 10);
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
                        const err = new ImdbError(datum.Error);

                        throw err;
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

export class SearchResult {
    public title: string;
    public year: number;
    public imdbid: string;
    public type: RequestType;
    public poster: string;

    constructor(obj: OmdbSearchResult) {
        for (const attr of Object.getOwnPropertyNames(obj)) {
            if (attr === "Year") {
                this[attr.toLowerCase()] = parseInt(obj[attr], 10);
            } else {
                this[attr.toLowerCase()] = obj[attr];
            }
        }
    }
}

export class SearchResults {
    public results: SearchResult[] = [];
    public totalresults: number;
    private page: number;
    private opts: MovieOpts;
    private req: SearchRequest;

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
 * Fetches a movie by arbitrary criteria
 *
 * @param req set of requirements to search for
 * @param opts options that modify a search
 *
 * @return a promise yielding a movie
 */
export function get(req: MovieRequest, opts: MovieOpts): Promise<Movie> {
    try {
        return new Client(opts).get(req);
    } catch (err) {
        return Promise.reject(err);
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
    try {
        return new Client(opts).search(req, page);
    } catch (err) {
        return Promise.reject(err);
    }
}

export class Client {
    private opts: MovieOpts;

    constructor(opts: MovieOpts) {
        if (! opts.hasOwnProperty("apiKey")) {
            throw new ImdbError("Missing api key in opts");
        }
        this.opts = opts;
    }

    private merge_opts(opts?: MovieOpts): MovieOpts {
        if (opts !== undefined) {
            return Object.assign(Object.create(this.opts), opts);
        } else {
            return Object.create(this.opts);
        }
    }

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
                return Promise.reject(new ImdbError(data.Error + ": " + (req.name ? req.name : req.id)));
            } else {
                if (isMovie(data)) {
                    ret = new Movie(data);
                } else if (isTvshow(data)) {
                    ret = new TVShow(data, opts);
                } else if (isEpisode(data)) {
                    ret = new Episode(data, 30);
                } else {
                    return Promise.reject(new ImdbError(`type: '${data.Type}' is not valid`));
                }

                return Promise.resolve(ret);
            }
        });

        return prom;
    }

    public search(req: SearchRequest, page?: number, opts?: MovieOpts): Promise<SearchResults> {
        opts = this.merge_opts(opts);
        if (page === undefined) {
            page = 1;
        }

        const qs = reqtoqueryobj(req, this.opts.apiKey, page);
        const reqopts = { qs, url: omdbapi, json: true, timeout: undefined, withCredentials: false };
        if ("timeout" in this.opts) {
            reqopts.timeout = this.opts.timeout;
        }

        const prom = rp(reqopts).then((data: OmdbSearch | OmdbError) => {
            if (isError(data)) {
                const err = new ImdbError(`${data.Error}: ${req.title}`);
                return Promise.reject(err);
            } else {
                return Promise.resolve(new SearchResults(data, page, this.opts, req));
            }
        });

        return prom;
    }
}
