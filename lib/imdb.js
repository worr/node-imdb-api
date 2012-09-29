var http = require('http');
var extend = require('node.extend');
var querystring = require('querystring');

var deanclatworthy = {
	host: "www.deanclatworthy.com",
	path: "/imdb/"
};

var poromenos = {
	host: "imdbapi.poromenos.org",
	path: "/js/"
};

function episodes(cb) {
	if (typeof(cb) !== "function")
		throw new TypeError("cb must be a function");

	tvShow = this;

	var episodeList = "";
	var myPoromenos;

	myPoromenos = extend(myPoromenos, poromenos);
	myPoromenos.path += "?" + querystring.stringify({ name: tvShow.title });

	return http.get(myPoromenos, onResponse).on('error', onError);

	function onResponse(res) {
		return res.on('data', onData).on('error', onError).on('end', onEnd);
	}

	function onData(data) {
		return (episodeList += data.toString('utf8'));
	}

	function onEnd() {
		var eps = episodeList;

		if (eps === "")
			return cb(new Error("could not get episodes"));

		eps = JSON.parse(eps)[tvShow.title].episodes;

		return cb(null, eps);
	}

	function onError(err) {
		return cb(err);
	}
}

module.exports.get = function(name, cb) {
	var responseData = "";

	if (typeof(cb) !== "function")
		throw new TypeError("cb must be a function");

	var myDeanclatworthy;

	myDeanclatworthy = extend(myDeanclatworthy, deanclatworthy);
	myDeanclatworthy.path += "?" + querystring.stringify({ q: name, yg: 0 });

	return http.get(myDeanclatworthy, onResponse).on('error', onError);

	function onResponse(res) {
		return res.on('data', onData).on('error', onError).on('end', onEnd);
	}

	function onData(data) {
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

	function onError(err) {
		return cb(err);
	}
};

module.exports.getById = function(id, cb) {
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

	myDeanclatworthy = extend(myDeanclatworthy, deanclatworthy);
	myDeanclatworthy.path += "?" + querystring.stringify({ id: id});

	return http.get(myDeanclatworthy, onResponse).on('error', onError);

	function onResponse(res) {
		return res.on('data', onData).on('error', onError).on('end', onEnd);
	}

	function onData(data) {
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

	function onError(err) {
		return cb(err);
	}
};

