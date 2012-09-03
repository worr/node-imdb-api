var http = require('http');
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
	tvShow = this;

	var episodeList = "";
	var myPoromenos = poromenos;
	myPoromenos.path += "?" + querystring.stringify({ name: tvShow.title });

	return http.get(myPoromenos, onResponse).on('error', onError);

	function onResponse(res) {
		return res.on('data', onData).on('error', onError).on('end', onEnd);
	}

	function onData(data) {
		return (episodeList += data.toString('utf8'));
	}

	function onEnd() {
		return cb(null, JSON.parse(episodeList)[tvShow.title].episodes);
	}

	function onError(err) {
		return cb(err);
	}
}

module.exports.get = function(name, cb) {
	var responseData = "";

	var myDeanclatworthy = deanclatworthy;
	myDeanclatworthy.path += "?" + querystring.stringify({ q: name, yg: 0 });
	return http.get(myDeanclatworthy, onResponse).on('error', onError);

	function onResponse(res) {
		return res.on('data', onData).on('error', onError).on('end', onEnd);
	}

	function onData(data) {
		responseData += data;
	}

	function onEnd() {
		var responseObject
		
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
}
