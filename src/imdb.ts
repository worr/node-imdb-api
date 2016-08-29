/// <reference path="../defs/node.d.ts"/>
"use strict";

import events = require("events");
import https = require("https");
import querystring = require("querystring");

export interface MovieRequest {
    name: string;
    id: string;
}

class ApiHost {
    host: string;
    path: string;

    constructor ();
    constructor (host: string, path: string);
    constructor (copy: ApiHost);
    constructor (hc?: any, path?: string) {
        if (hc) {
            if (typeof(hc) === "object") {
                this.host = hc.host;
                this.path = hc.path;
            } else {
                this.host = hc;
                this.path = path;
            }
        } else {
            this.host = "";
            this.path = "";
        }
    }
}

export class Episode {
    constructor (public season: number, public name: string, public number: number) { }
}

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

export class Movie {
    public imdbid: string;
    public imdburl: string;
    public genres: string;
    public languages: string;
    public country: string;
    public votes: string;
    public series: boolean;
    public rating: string;
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

    // Should really be protected
    private _year_data: string;

    constructor (obj: Object) {
        for (let attr in obj) {
            if (attr === "year" || trans_table.get(attr) === "year") {
                this["_year_data"] = obj[attr];
                if (obj[attr].match(/\d{4}\-(?:\d{4})/)) {
                    this[attr] = parseInt(obj[attr]);
                }
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

    constructor (object: Object) {
        super(object);
        let years = this["_year_data"].split("-");
        this.start_year = parseInt(years[0]) ? parseInt(years[0]) : null;
        this.end_year = parseInt(years[1]) ? parseInt(years[1]) : null;
    }

    public episodes(cb: (Error, object) => any) {
        if (typeof(cb) !== "function")
            throw new TypeError("cb must be a function");

        if (this._episodes.length !== 0) {
            return cb(undefined, this._episodes);
        }

        let tvShow = this;
        let episodeList = "";

        let myOmdbapi = new ApiHost(omdbapi);
        myOmdbapi.path += "?" + querystring.stringify({ name: tvShow.title });
        myOmdbapi.path += "&" + querystring.stringify({ year: tvShow.start_year });

        return https.get(myOmdbapi, onResponse).on("error", onError);

        function onResponse(res: any) {
            return res.on("data", onData).on("error", onError).on("end", onEnd);
        }

        function onData(data: any) {
            return (episodeList += data.toString("utf8"));
        }

        function onEnd() {
            if (episodeList === "" || episodeList === "null")
                return cb(new Error("could not get episodes"), undefined);

            let eps: { season: number; name: string; number: number; }[] = [];
            eps = JSON.parse(episodeList)[tvShow.title].episodes;

            let episodes = [];
            for (let i = 0; i < eps.length; i++) {
                episodes[i] = new Episode(eps[i].season, eps[i].name, eps[i].number);
            }

            tvShow._episodes = episodes;
            return cb(undefined, episodes);
        }

        function onError(err: Error) {
            return cb(err, undefined);
        }
    }

}

export class ImdbError {
    public name: string = "imdb api error";

    constructor(public message: string, public movie: MovieRequest) {
    }
}

let omdbapi = new ApiHost("www.omdbapi.com", "/");

export function getReq(req: MovieRequest, cb: (err: Error, data: any) => any) {
    let responseData = "";

    if (typeof(cb) !== "function")
        throw new TypeError("cb must be a function");

    let myOmdbapi = new ApiHost(omdbapi);

    if (req.name) {
        myOmdbapi.path += "?" + querystring.stringify({ t: req.name });
    } else if (req.id) {
        myOmdbapi.path += "?" + querystring.stringify({ i: req.id });
    }

    myOmdbapi.path += "&" + querystring.stringify({ plot: "full", r: "json" });

    return https.get(myOmdbapi, onResponse).on("error", onError);

    function onResponse(res: any) {
        return res.on("data", onData).on("error", onError).on("end", onEnd);
    }

    function onData(data: any) {
        responseData += data;
    }

    function onEnd() {
        let responseObject;

        try {
            responseObject = JSON.parse(responseData);
        } catch (e) {
            return cb(e, undefined);
        }

        if (responseObject.Response === "False") {
            return cb(new ImdbError(responseObject.Error + ": " + (req.name ? req.name : req.id), req), undefined);
        }

        if (responseObject.Type === "movie")
            responseObject = new Movie(responseObject);
        else if (responseObject.Type === "series")
            responseObject = new TVShow(responseObject);

        return cb(undefined, responseObject);
    }

    function onError(err: Error) {
        return cb(err, undefined);
    }
}

export function get(name: string, cb: (err: Error, data: any) => any) {
    return getReq({id: undefined, name: name }, cb);
};
