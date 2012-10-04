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

var deanclatworthy = new ApiHost("www.deanclatworthy.com", "/imdb/");
var poromenos = new ApiHost("imdbapi.poromenos.org", "/js/");

function episodes(cb: (Error, object) => void ) {
	if (typeof(cb) !== "function")
		throw new TypeError("cb must be a function");

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

		eps = JSON.parse(eps)[tvShow.title].episodes;

		return cb(null, eps);
	}

	function onError(err: Error) {
		return cb(err, null);
	}
}

export function get(name: string, cb: Function) {
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
			return cb(e);
		}

		if (responseObject.hasOwnProperty("code") && responseObject.hasOwnProperty("error")) {
			return cb(responseObject.error);
		}
		
		if (responseObject.stv === 1 || responseObject.series === 1) {
			responseObject.episodes = episodes;
		} else {
			responseObject.episodes = null;
		}

		return cb(null, responseObject);
	}

	function onError(err: Error) {
		return cb(err);
	}
};

export function getById(id: string, cb: Function) {
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
			return cb(e);
		}

		if (responseObject.hasOwnProperty("code") && responseObject.hasOwnProperty("error")) {
			return cb(responseObject.error);
		}

		if (responseObject.stv === 1 || responseObject.series === 1) {
			responseObject.episodes = episodes;
		} else {
			responseObject.episodes = null;
		}

		return cb(null, responseObject);
	}

	function onError(err: any) {
		return cb(err);
	}
};

