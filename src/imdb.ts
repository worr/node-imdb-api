/// <reference path='../defs/node.d.ts'/>
"use strict";

import events = require('events');
import http = require('http');
import querystring = require('querystring');

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

export class Movie {
	public imdbid: string;
	public imdburl: string;
	public genres: string;
	public languages: string;
	public country: string;
	public votes: string;
	public stv: boolean;
	public series: boolean;
	public rating: string;
	public runtime: string;
	public title: string;
	public usascreens: boolean;
	public ukscreens: boolean;
	public year: number;

	// Should really be protected
	private _year_data: string;

	constructor (obj: Object) { 
		for (var attr in obj) {
			if (attr === "year") {
				this["_year_data"] = obj[attr];
				if (obj["year"].match(/\d{4}\-(?:\d{4})/)) {
					this[attr] = parseInt(obj[attr]);
				}
			} else if (obj.hasOwnProperty(attr)) {
				this[attr] = obj[attr];
			}
		}
	}
}

export class TVShow extends Movie {
	private _episodes: Episode[] = [];
	public start_year;
	public end_year;

	constructor (object: Object) {
		super(object);
		var years = this["_year_data"].split("-");
		this.start_year = parseInt(years[0]) ? parseInt(years[0]) : null;
		this.end_year = parseInt(years[1]) ? parseInt(years[1]) : null;
	}

	public episodes(cb: (Error, object) => any) {
		if (typeof(cb) !== "function")
			throw new TypeError("cb must be a function");

		if (this._episodes.length !== 0) {
			return cb(null, this._episodes);
		}

		var tvShow = this;
		var episodeList = "";

		var myPoromenos = new ApiHost(poromenos);
		myPoromenos.path += "?" + querystring.stringify({ name: tvShow.title });
		myPoromenos.path += "&" + querystring.stringify({ year: tvShow.start_year });

		return http.get(myPoromenos, onResponse).on('error', onError);

		function onResponse(res: any) {
			return res.on('data', onData).on('error', onError).on('end', onEnd);
		}

		function onData(data: any) {
			return (episodeList += data.toString('utf8'));
		}

		function onEnd() {
			if (episodeList === "" || episodeList === "null")
				return cb(new Error("could not get episodes"), null);

			var eps: {season: number; name: string; number: number;}[] = [];
			eps = JSON.parse(episodeList)[tvShow.title].episodes;

			var episodes = [];
			for (var i = 0; i < eps.length; i++) {
				episodes[i] = new Episode(eps[i].season, eps[i].name, eps[i].number);
			}

			tvShow._episodes = episodes;
			return cb(null, episodes);
		}

		function onError(err: Error) {
			return cb(err, null);
		}
	}

}

export class ImdbError {
	public name: string = "imdb api error";

	constructor(public message: string, public movie: MovieRequest) {
	}
}

var deanclatworthy = new ApiHost("deanclatworthy.com", "/imdb/");
var poromenos = new ApiHost("imdbapi.poromenos.org", "/js/");

export function getReq(req: MovieRequest, cb: (Error, any) => any) {
	var responseData = "";

	if (typeof(cb) !== "function")
		throw new TypeError("cb must be a function");

	var myDeanclatworthy = new ApiHost(deanclatworthy);

	if (req.name) {
		myDeanclatworthy.path += "?" + querystring.stringify({ q: req.name, yg: 0 });
	} else if (req.id) {
		myDeanclatworthy.path += "?" + querystring.stringify({ id: req.id });
	}

	return http.get(myDeanclatworthy, onResponse).on('error', onError);

	function onResponse(res: any) {
		return res.on('data', onData).on('error', onError).on('end', onEnd);
	}

	function onData(data: any) {
		responseData += data;
	}

	function onEnd() {
		var responseObject;
		
		try {
			responseObject = JSON.parse(responseData);
		} catch (e) {
			return cb(e, null);
		}

		if (responseObject.hasOwnProperty("code") && responseObject.hasOwnProperty("error")) {
			return cb(new ImdbError(responseObject.error + ": " + (req.name ? req.name : req.id), req), null);
		}

		if (responseObject.series === 0)
			responseObject = new Movie(responseObject);
		else
			responseObject = new TVShow(responseObject);

		return cb(null, responseObject);
	}

	function onError(err: Error) {
		return cb(err, null);
	}

}

export function get(name: string, cb: (Error, any) => any) {
	return getReq({id: undefined, name: name }, cb);
};

export function getById(id: string, cb: (Error, any) => any) {
	var intRegex = /^\d+$/;
	if(intRegex.test(id)) {
		// user give us a raw id we need to prepend it with tt
		id = 'tt'+id;
	}

	var imdbRegex = /^tt\d+$/;
	if(! imdbRegex.test(id)) {
		throw new TypeError("id must be a an imdb id (tt12345 or 12345)");
	}

	return getReq({ id: id, name: undefined }, cb);
};

