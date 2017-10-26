"use strict";

import {
    Inverter,
} from "./util";

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

import es6promise = require("es6-promise");
import rp = require("request-promise");

const Promise = es6promise.Promise;

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
 * Movie we're requesting
 */
export interface MovieRequest {
    name?: string;
    id?: string;
    year?: number;
    opts: MovieOpts;
}

/**
 * Type of media we're searching for
 */
export type RequestType = "movie"
    | "series"
    | "episode"
    | "game";

/**
 * Search we're making
 */
export interface SearchRequest {
    title: string;
    reqtype?: RequestType;
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

const trans_table = new Inverter({
    genres: "Genre",
    languages: "Language",
    rating: "imdbRating",
    votes: "imdbVotes",
});

export class Episode {
    public season: number;
    public name: string;
    public episode: number;
    public released: Date;
    public imdbid: string;
    public rating: number;

    constructor(obj: OmdbEpisode, season: number) {
        this.season = season;
        for (const attr in obj) {
            if (attr === "Released") {
                const [year, month, day] = obj[attr].split("-");
                this.released = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
            } else if (attr === "Rating") {
                this[attr.toLowerCase()] = parseFloat(obj[attr]);
            } else if (attr === "Episode" || attr === "Season") {
                this[attr.toLowerCase()] = parseInt(obj[attr], 10);
            } else if (attr === "Title") {
                this.name = obj[attr];
            } else if (trans_table.get(attr) !== undefined) {
                this[trans_table.get(attr)] = obj[attr];
            } else {
                this[attr.toLowerCase()] = obj[attr];
            }
        }
    }
}

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

    protected _year_data: string;

    constructor(obj: OmdbMovie) {
        for (const attr in obj) {
            if (attr === "year" || attr.toLowerCase() === "year") {
                this._year_data = obj[attr];
                if (!obj[attr].match(/\d{4}[\-–]\d{4}/)) {
                    this[attr.toLowerCase()] = parseInt(obj[attr], 10);
                }
            } else if (attr === "Released") {
                this.released = new Date(obj[attr]);
            } else if (attr === "Rating") {
                this[attr.toLowerCase()] = parseFloat(obj[attr]);
            } else if (trans_table.get(attr) !== undefined) {
                this[trans_table.get(attr)] = obj[attr];
            } else {
                this[attr.toLowerCase()] = obj[attr];
            }
        }

        this.series = this.type === "movie" ? false : true;
        this.imdburl = "https://www.imdb.com/title/" + this.imdbid;
    }
}

export class TVShow extends Movie {
    public start_year;
    public end_year;
    public totalseasons;

    private _episodes: Episode[] = [];
    private opts: MovieOpts;

    constructor(object: OmdbTvshow, opts: MovieOpts) {
        super(object);
        const years = this._year_data.split("-");
        this.start_year = parseInt(years[0], 10) ? parseInt(years[0], 10) : null;
        this.end_year = parseInt(years[1], 10) ? parseInt(years[1], 10) : null;
        this.totalseasons = parseInt(this.totalseasons, 10);
        this.opts = opts;
    }

    /**
     * Fetches episodes of a TV show
     *
     * @param cb optional callback that gets any errors or episodes
     *
     * @return Promise yielding list of episodes
     */
    public episodes(cb?: (err: Error, data: Episode[]) => any): Promise<Episode[]> {
        if (this._episodes.length !== 0) {
            return cb(undefined, this._episodes);
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
            };

            if ("timeout" in this.opts) {
                reqopts.timeout = this.opts.timeout;
            }

            funcs.push(rp(reqopts));
        }

        const prom = Promise.all(funcs)
            .then((ep_data: OmdbSeason[] | OmdbError[]) => {
                const eps: Episode[] = [];
                for (const key in ep_data) {
                    if (ep_data.hasOwnProperty(key)) {
                        const datum = ep_data[key];
                        if (isError(datum)) {
                            const err = new ImdbError(datum.Error);
                            if (cb) {
                                return cb(err, undefined);
                            }

                            return Promise.reject(err);
                        } else {
                            const season = parseInt(datum.Season, 10);
                            for (const ep in datum.Episodes) {
                                if (datum.Episodes.hasOwnProperty(ep)) {
                                    eps.push(new Episode(datum.Episodes[ep], season));
                                }
                            }
                        }
                    }
                }

                tvShow._episodes = eps;
                if (cb) {
                    return cb(undefined, eps);
                }

                return Promise.resolve(eps);
            });

        if (cb) {
            prom.catch((err) => {
                return cb(err, undefined);
            });
        } else {
            return prom;
        }
    }
}

export class SearchResult {
    public title: string;
    public year: number;
    public imdbid: string;
    public type: RequestType;
    public poster: string;

    constructor(obj: OmdbSearchResult) {
        for (const attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                if (attr === "Year") {
                    this.year = parseInt(obj[attr], 10);
                } else {
                    this[attr.toLowerCase()] = obj[attr];
                }
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

        for (const attr in obj) {
            if (attr === "Search") {
                for (const result of obj.Search) {
                    this.results.push(new SearchResult(result));
                }
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
 * @param cb optional callback to execute after fetching data
 *
 * @return a promise yielding a movie
 */
export function getReq(req: MovieRequest, cb?: (err: Error, data: Movie | Episode) => any): Promise<Movie> {

    if (req.opts === undefined || !req.opts.hasOwnProperty("apiKey")) {
        const err = new ImdbError("Missing api key in opts");
        if (cb) {
            return cb(err, undefined);
        } else {
            return Promise.reject(err);
        }
    }

    const qs = {
        apikey: req.opts.apiKey,
        i: undefined,
        plot: "full",
        r: "json",
        t: undefined,
        y: req.year,
    };

    if (req.name) {
        qs.t = req.name;
    } else if (req.id) {
        qs.i = req.id;
    }

    const reqopts = {
        json: true,
        qs,
        timeout: undefined,
        url: omdbapi,
    };

    if ("timeout" in req.opts) {
        reqopts.timeout = req.opts.timeout;
    }

    const prom = rp(reqopts).then((data: OmdbMovie | OmdbError) => {
        let ret: Movie | Episode;
        if (isError(data)) {
            const err = new ImdbError(data.Error + ": " + (req.name ? req.name : req.id));
            if (cb) {
                return cb(err, undefined);
            } else {
                return Promise.reject(err);
            }
        } else {
            if (isMovie(data)) {
                ret = new Movie(data);
            } else if (isTvshow(data)) {
                ret = new TVShow(data, req.opts);
            } else if (isEpisode(data)) {
                ret = new Episode(data, 30);
            } else {
                const err = new ImdbError("type: " + data.Type + " not valid");
                if (cb) {
                    return cb(err, undefined);
                } else {
                    return Promise.reject(err);
                }
            }

            if (cb) {
                return cb(undefined, ret);
            }

            return Promise.resolve(ret);
        }
    });

    if (cb) {
        prom.catch((err) => {
            cb(err, undefined);
        });
    } else {
        return prom;
    }
}

/**
 * @deprecated use getReq instead
 *
 * Gets a movie by name
 *
 * @param name name of movie to search for
 * @param opts options that modify a search
 * @param cb optional callback to execute after finding results
 *
 * @return a promise yielding a movie
 */
export function get(name: string, opts: MovieOpts, cb?: (err: Error, data: Movie) => any): Promise<Movie> {
    return getReq({ id: undefined, opts, name }, cb);
}

/**
 * @deprecated use getReq instead
 *
 * Gets a movie by id
 *
 * @param imdbid id to search for
 * @param opts options that modify a search
 * @param cb optional callback to execute after finding results
 *
 * @return a promise yielding a movie
 */
export function getById(imdbid: string, opts: MovieOpts, cb?: (err: Error, data: Movie) => any): Promise<Movie> {
    return getReq({ id: imdbid, opts, name: undefined }, cb);
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
    if (page === undefined) {
        page = 1;
    }

    const qs = reqtoqueryobj(req, opts.apiKey, page);
    const reqopts = { qs, url: omdbapi, json: true, timeout: undefined };
    if ("timeout" in opts) {
        reqopts.timeout = opts.timeout;
    }

    const prom = rp(reqopts).then((data: OmdbSearch | OmdbError) => {
        if (isError(data)) {
            const err = new ImdbError(`${data.Error}: ${req.title}`);
            return Promise.reject(err);
        } else {
            return Promise.resolve(new SearchResults(data, page, opts, req));
        }
    });

    return prom;
}
