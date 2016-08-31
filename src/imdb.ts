/// <reference path="../typings/index.d.ts"/>
"use strict";

import es6promise = require("es6-promise");
import rp = require("request-promise");

let Promise = es6promise.Promise;

const omdbapi = "https://www.omdbapi.com/";

export interface MovieRequest {
    name: string;
    id: string;
}

// A good case for generics, but javascript has strict
// requirements on what consists of a hashable type.
// It's not even worth it tbh
interface StringHashMap {
    [index: string]: string;
}

class Inverter {
    private obj: StringHashMap;
    private rev_obj: StringHashMap;

    constructor (obj: Object) {
        this.obj = obj as StringHashMap;
        this.rev_obj = {} as StringHashMap;

        for (let attr in obj) {
            this.rev_obj[obj[attr]] = attr;
        }
    }

    public get(key: string): string {
        if (this.obj[key] !== undefined) {
            return this.obj[key];
        } else if (this.rev_obj[key] !== undefined) {
            return this.rev_obj[key];
        }

        return undefined;
    }
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

    constructor (obj: Object, season: number) {
        this.season = season;
        for (let attr in obj) {
            if (attr === "Released") {
                let [year, month, day] = obj[attr].split("-");
                this.released = new Date(parseInt(year), parseInt(month), parseInt(day));
            } else if (attr === "Rating") {
                this[attr.toLowerCase()] = parseFloat(obj[attr]);
            } else if (attr === "Episode" || attr === "Season") {
                this[attr.toLowerCase()] = parseInt(obj[attr]);
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

    constructor (obj: Object) {
        for (let attr in obj) {
            if (attr === "year" || attr.toLowerCase() === "year") {
                this["_year_data"] = obj[attr];
                if (obj[attr].match(/\d{4}[\-–](?:\d{4})/)) {
                    this[attr] = parseInt(obj[attr]);
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

    constructor (object: Object) {
        super(object);
        let years = this["_year_data"].split("-");
        this.start_year = parseInt(years[0]) ? parseInt(years[0]) : null;
        this.end_year = parseInt(years[1]) ? parseInt(years[1]) : null;
        this.totalseasons = parseInt(this["totalseasons"]);
    }

    public episodes(cb: (err: Error, data: Object) => any) {
        if (typeof(cb) !== "function")
            throw new TypeError("cb must be a function");

        if (this._episodes.length !== 0) {
            return cb(undefined, this._episodes);
        }

        let tvShow = this;

        let funcs = [];
        for (let i = 1; i <= tvShow.totalseasons; i++) {
            funcs.push(rp({"qs": {"i": tvShow.imdbid, "r": "json", "Season": i}, "json": true, "url": omdbapi}));
        }

        Promise.all(funcs)
            .then(function(ep_data) {
                let eps = [];
                for (let key in ep_data) {
                    let datum = ep_data[key];
                    if (datum.Response === "False") {
                        return cb(new ImdbError(datum.Error, undefined), undefined);
                    }

                    let season = parseInt(datum.Season);
                    for (let ep in datum.Episodes) {
                        eps.push(new Episode(datum.Episodes[ep], season));
                    }
                }

                tvShow._episodes = eps;
                return cb(undefined, eps);
            })
            .catch(function(err) {
                return cb(err, undefined);
            });
    }
}

export class ImdbError {
    public name: string = "imdb api error";

    constructor(public message: string, public movie: MovieRequest) {
    }
}

export function getReq(req: MovieRequest, cb: (err: Error, data: any) => any) {
    let responseData = "";

    if (typeof(cb) !== "function")
        throw new TypeError("cb must be a function");

    let qs = {plot: "full", r: "json"};

    if (req.name) {
        qs["t"] = req.name;
    } else if (req.id) {
        qs["i"] = req.id;
    }


    rp({"qs": qs, url: omdbapi, json: true}).then(function(data) {
        let ret: Movie;
        if (data.Response === "False") {
            return cb(new ImdbError(data.Error + ": " + (req.name ? req.name : req.id), req), undefined);
        }

        if (data.Type === "movie")
            ret = new Movie(data);
        else if (data.Type === "series")
            ret = new TVShow(data);
        else
            return cb(new ImdbError("type: " + data.Type + " not valid", req), undefined);

        return cb(undefined, ret);
    })
    .catch(function(err) {
        cb(err, undefined);
    });
}

export function get(name: string, cb: (err: Error, data: any) => any) {
    return getReq({id: undefined, name: name }, cb);
};
