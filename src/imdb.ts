/// <reference path="../typings/index.d.ts"/>
"use strict";

import {
    Inverter
} from "./util";

import {
    isError,
    isMovie,
    isTvshow,
    OmdbError,
    OmdbEpisode,
    OmdbMovie,
    OmdbSeason,
    OmdbTvshow
} from "./interfaces";

import es6promise = require("es6-promise");
import rp = require("request-promise");

let Promise = es6promise.Promise;

const omdbapi = "https://www.omdbapi.com/";

export interface MovieRequest {
    name?: string;
    id?: string;
    year?: number;
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

    constructor (obj: OmdbEpisode, season: number) {
        this.season = season;
        for (let attr in obj) {
            if (attr === "Released") {
                let [year, month, day] = obj[attr].split("-");
                this.released = new Date(parseInt(year), parseInt(month), parseInt(day));
            } else if (attr === "Rating") {
                this[attr.toLowerCase()] = parseFloat(obj[attr]);
            } else if (attr === "Episode" || attr === "Season") {
                this[attr.toLowerCase()] = parseInt(obj[attr]);
            } else if (attr === "Title") {
                this.name = obj[attr];
            } else if (obj.hasOwnProperty(attr) && trans_table.get(attr) !== undefined) {
                this[trans_table.get(attr)] = obj[attr];
            } else if (obj.hasOwnProperty(attr)) {
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

    constructor (obj: OmdbMovie) {
        for (let attr in obj) {
            if (attr === "year" || attr.toLowerCase() === "year") {
                this["_year_data"] = obj[attr];
                if (! obj[attr].match(/\d{4}[\-–]\d{4}/)) {
                    this[attr.toLowerCase()] = parseInt(obj[attr]);
                }
            } else if (attr === "Released") {
                this.released = new Date(obj[attr]);
            } else if (attr === "Rating") {
                this[attr.toLowerCase()] = parseFloat(obj[attr]);
            } else if (obj.hasOwnProperty(attr) && trans_table.get(attr) !== undefined) {
                this[trans_table.get(attr)] = obj[attr];
            } else if (obj.hasOwnProperty(attr)) {
                this[attr.toLowerCase()] = obj[attr];
            }
        }

        this.series = this.type === "movie" ? false : true;
        this.imdburl = "https://www.imdb.com/title/" + this.imdbid;
    }
}

export class TVShow extends Movie {
    private _episodes: Episode[] = [];
    public start_year;
    public end_year;
    public totalseasons;

    constructor (object: OmdbTvshow) {
        super(object);
        let years = this["_year_data"].split("-");
        this.start_year = parseInt(years[0]) ? parseInt(years[0]) : null;
        this.end_year = parseInt(years[1]) ? parseInt(years[1]) : null;
        this.totalseasons = parseInt(this["totalseasons"]);
    }

    public episodes(cb?: (err: Error, data: Episode[]) => any) {
        if (this._episodes.length !== 0) {
            return cb(undefined, this._episodes);
        }

        let tvShow = this;

        let funcs = [];
        for (let i = 1; i <= tvShow.totalseasons; i++) {
            funcs.push(rp({"qs": {"i": tvShow.imdbid, "r": "json", "Season": i}, "json": true, "url": omdbapi}));
        }

        let prom = Promise.all(funcs)
            .then(function(ep_data: OmdbSeason[] | OmdbError[]) {
                let eps: Episode[] = [];
                for (let key in ep_data) {
                    let datum = ep_data[key];
                    if (isError(datum)) {
                        let err = new ImdbError(datum.Error, undefined);
                        if (cb) {
                            return cb(err, undefined);
                        }

                        return Promise.reject(err);
                    } else {
                        let season = parseInt(datum.Season);
                        for (let ep in datum.Episodes) {
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

export class ImdbError {
    public name: string = "imdb api error";

    constructor(public message: string, public movie: MovieRequest) {
    }
}

export function getReq(req: MovieRequest, cb?: (err: Error, data: Movie) => any) {
    let responseData = "";
    let qs = {plot: "full", r: "json", y: req.year};

    if (req.name) {
        qs["t"] = req.name;
    } else if (req.id) {
        qs["i"] = req.id;
    }

    let prom = rp({"qs": qs, url: omdbapi, json: true}).then(function(data: OmdbMovie | OmdbError) {
        let ret: Movie;
        if (isError(data)) {
            return cb(new ImdbError(data.Error + ": " + (req.name ? req.name : req.id), req), undefined);
        } else {
            if (isMovie(data)) {
                ret = new Movie(data);
            } else if (isTvshow(data)) {
                ret = new TVShow(data);
            } else {
                let err = new ImdbError("type: " + data.Type + " not valid", req);
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

export function get(name: string, cb?: (err: Error, data: Movie) => any): Promise<Movie> {
    return getReq({id: undefined, name: name }, cb);
};

export function getById(imdbid: string, cb?: (err: Error, data: Movie) => any): Promise<Movie> {
    return getReq({id: imdbid, name: undefined}, cb);
}
