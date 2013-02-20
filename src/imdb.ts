"use strict";
///<reference path='../defs/node.d.ts'/>

import http = module('http');
import querystring = module('querystring');

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

class Episode {
	constructor (public season: number, public name: string, public number: number) { }
}

class Movie {
	private _episodes: Episode[] = [];
	public imdbid: string;
	public imdburl: string;
	public genres: string;
	public languages: string;
	public country: string;
	public votes: string;
	public stv: bool;
	public series: bool;
	public rating: string;
	public runtime: string;
	public title: string;
	public usascreens: bool;
	public ukscreens: bool;

	constructor (obj: Object) { 
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr))
				this[attr] = obj[attr];
		}
	}
	
	public episodes(cb: (Error, object) => Array) {
		if (typeof(cb) !== "function")
			throw new TypeError("cb must be a function");

		if (this._episodes.length !== 0) {
			return this._episodes;
		}

		var tvShow = this;

		var episodeList = "";
		var myPoromenos;

		myPoromenos = new ApiHost(poromenos);
		myPoromenos.path += "?" + querystring.stringify({ name: tvShow.title });

		return http.get(myPoromenos, onResponse).on('error', onError);

		function onResponse(res: any) {
			return res.on('data', onData).on('error', onError).on('end', onEnd);
		}

		function onData(data: any) {
			return (episodeList += data.toString('utf8'));
		}

		function onEnd() {
			var eps = episodeList;

			if (eps === "")
				return cb(new Error("could not get episodes"), null);

			var episodes = [];
			eps = JSON.parse(eps)[tvShow.title].episodes;
			for (var i = 0; i < eps.length; i++) {
				episodes[i] = new Episode(eps[i].season, eps[i].name, eps[i].number);
			}

			return cb(null, episodes);
		}

		function onError(err: Error) {
			return cb(err, null);
		}
	}
}

export class ImdbError {
	public name: string = "imdb api error";

	constructor(public message: string, public movie: string) {
	}
}

var deanclatworthy = new ApiHost("deanclatworthy.com", "/imdb/");
var poromenos = new ApiHost("imdbapi.poromenos.org", "/js/");

export function get(name: string, cb: (Error, any) => any) {
	var responseData = "";

	if (typeof(cb) !== "function")
		throw new TypeError("cb must be a function");

	var myDeanclatworthy;

	myDeanclatworthy = new ApiHost(deanclatworthy);
	myDeanclatworthy.path += "?" + querystring.stringify({ q: name, yg: 0 });

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
			return cb(new ImdbError(responseObject.error + ": " + name, name), null);
		}

		responseObject = new Movie(responseObject);
		return cb(null, responseObject);
	}

	function onError(err: Error) {
		return cb(err, null);
	}
};

export function getById(id: string, cb: (Error, any) => any) {
	var responseData = "";

	if (typeof(cb) !== "function")
		throw new TypeError("cb must be a function");

	var intRegex = /^\d+$/;
	if(intRegex.test(id)) {
		// user give us a raw id we need to prepend it with tt
		id = 'tt'+id;
	}

	var imdbRegex = /^tt\d+$/;
	if(! imdbRegex.test(id)) {
		throw new TypeError("id must be a an imdb id (tt12345 or 12345)");
	}

	var myDeanclatworthy;

	myDeanclatworthy = new ApiHost(deanclatworthy);
	myDeanclatworthy.path += "?" + querystring.stringify({ id: id});

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
			return cb(new ImdbError(responseObject.error + ": " + id, id), null);
		}

		return cb(null, responseObject);
	}

	function onError(err: any) {
		return cb(err, null);
	}
};

