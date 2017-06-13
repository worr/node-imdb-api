"use strict";

import {
    Inverter
} from "./util";

import {
    isEpisode,
    isError,
    isMovie,
    isTvshow,
    OmdbError,
    OmdbEpisode,
    OmdbMovie,
    OmdbSeason,
    OmdbSearch,
    OmdbSearchResult,
    OmdbTvshow
} from "./interfaces";

import es6promise = require("es6-promise");
import rp = require("request-promise");

const Promise = es6promise.Promise;

const omdbapi = "https://www.omdbapi.com/";

export interface MovieOpts {
    apiKey: string;
    timeout?: number;
}

export type RequestType = "movie"
    | "series"
    | "episode"
    | "game";

export interface MovieRequest {
    name?: string;
    id?: string;
    year?: number;
    opts: MovieOpts;
}

export interface SearchRequest {
    title: string;
    reqtype?: RequestType;
    year?: number;
}

function reqtoqueryobj(req: SearchRequest, apikey: string, page: number): object {
    const ret = {
        "s": req.title,
        "r": "json",
        "apikey": apikey,
        "page": page,
    };

    if (req.reqtype !== undefined) {
        ret["type"] = req.reqtype;
    }

    if (req.year !== undefined) {
        req["y"] = req.year;
    }

    return ret;
}

const trans_table = new Inverter({
    "genres": "Genre",
    "languages": "Language",
    "votes": "imdbVotes",
    "rating": "imdbRating",
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
                this.released = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else if (attr === "Rating") {
                this[attr.toLowerCase()] = parseFloat(obj[attr]);
            } else if (attr === "Episode" || attr === "Season") {
                this[attr.toLowerCase()] = parseInt(obj[attr]);
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

    // Should really be protected
    private _year_data: string;

    constructor(obj: OmdbMovie) {
        for (const attr in obj) {
            if (attr === "year" || attr.toLowerCase() === "year") {
                this["_year_data"] = obj[attr];
                if (!obj[attr].match(/\d{4}[\-–]\d{4}/)) {
                    this[attr.toLowerCase()] = parseInt(obj[attr]);
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
    private _episodes: Episode[] = [];
    private opts: MovieOpts;
    public start_year;
    public end_year;
    public totalseasons;

    constructor(object: OmdbTvshow, opts: MovieOpts) {
        super(object);
        const years = this["_year_data"].split("-");
        this.start_year = parseInt(years[0]) ? parseInt(years[0]) : null;
        this.end_year = parseInt(years[1]) ? parseInt(years[1]) : null;
        this.totalseasons = parseInt(this["totalseasons"]);
        this.opts = opts;
    }

    public episodes(cb?: (err: Error, data: Episode[]) => any) {
        if (this._episodes.length !== 0) {
            return cb(undefined, this._episodes);
        }

        const tvShow = this;

        const funcs = [];
        for (let i = 1; i <= tvShow.totalseasons; i++) {
            const reqopts = { "qs": { "apikey": tvShow.opts.apiKey, "i": tvShow.imdbid, "r": "json", "Season": i }, "json": true, "url": omdbapi };
            if ("timeout" in this.opts) {
                reqopts["timeout"] = this.opts.timeout;
            }

            funcs.push(rp(reqopts));
        }

        const prom = Promise.all(funcs)
            .then(function(ep_data: OmdbSeason[] | OmdbError[]) {
                const eps: Episode[] = [];
                for (const key in ep_data) {
                    const datum = ep_data[key];
                    if (isError(datum)) {
                        const err = new ImdbError(datum.Error);
                        if (cb) {
                            return cb(err, undefined);
                        }

                        return Promise.reject(err);
                    } else {
                        const season = parseInt(datum.Season);
                        for (const ep in datum.Episodes) {
                            eps.push(new Episode(datum.Episodes[ep], season));
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
            prom.catch(function(err) {
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
            if (attr === "Year") {
                this.year = parseInt(obj[attr]);
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

    public next(): Promise<SearchResults> {
        return search(this.req, this.opts, this.page + 1);
    }
}

export class ImdbError {
    public name: string = "imdb api error";

    constructor(public message: string) { }
}

export function getReq(req: MovieRequest, cb?: (err: Error, data: Movie | Episode) => any) {

    if (req.opts === undefined || !req.opts.hasOwnProperty("apiKey")) {
        const err = new ImdbError("Missing api key in opts");
        if (cb) {
            return cb(err, undefined);
        } else {
            return Promise.reject(err);
        }
    }

    const qs = { apikey: req.opts.apiKey, plot: "full", r: "json", y: req.year };

    if (req.name) {
        qs["t"] = req.name;
    } else if (req.id) {
        qs["i"] = req.id;
    }

    const reqopts = { "qs": qs, url: omdbapi, json: true };

    if ("timeout" in req.opts) {
        reqopts["timeout"] = req.opts.timeout;
    }

    const prom = rp(reqopts).then(function(data: OmdbMovie | OmdbError) {
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
        prom.catch(function(err) {
            cb(err, undefined);
        });
    } else {
        return prom;
    }
}

export function get(name: string, opts: MovieOpts, cb?: (err: Error, data: Movie) => any): Promise<Movie> {
    return getReq({ id: undefined, opts: opts, name: name }, cb);
}

export function getById(imdbid: string, opts: MovieOpts, cb?: (err: Error, data: Movie) => any): Promise<Movie> {
    return getReq({ id: imdbid, opts: opts, name: undefined }, cb);
}

export function search(req: SearchRequest, opts: MovieOpts, page?: number): Promise<SearchResults> {
    if (page === undefined) {
        page = 1;
    }

    const qs = reqtoqueryobj(req, opts.apiKey, page);
    const reqopts = { "qs": qs, url: omdbapi, json: true };
    if ("timeout" in opts) {
        reqopts["timeout"] = opts.timeout;
    }

    const prom = rp(reqopts).then(function(data: OmdbSearch | OmdbError) {
        if (isError(data)) {
            const err = new ImdbError(`${data.Error}: ${req.title}`);
            return Promise.reject(err);
        } else {
            return Promise.resolve(new SearchResults(data, page, opts, req));
        }
    });

    return prom;
}
