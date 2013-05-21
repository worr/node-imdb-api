var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
"use strict";
var http = require('http')
var querystring = require('querystring')
var ApiHost = (function () {
    function ApiHost(hc, path) {
        if(hc) {
            if(typeof (hc) === "object") {
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
    return ApiHost;
})();
var Episode = (function () {
    function Episode(season, name, number) {
        this.season = season;
        this.name = name;
        this.number = number;
    }
    return Episode;
})();
var Movie = (function () {
    function Movie(obj) {
        for(var attr in obj) {
            if(obj.hasOwnProperty(attr)) {
                this[attr] = obj[attr];
            }
        }
    }
    return Movie;
})();
var TVShow = (function (_super) {
    __extends(TVShow, _super);
    function TVShow(object) {
        _super.call(this, object);
        this._episodes = [];
    }
    TVShow.prototype.episodes = function (cb) {
        if(typeof (cb) !== "function") {
            throw new TypeError("cb must be a function");
        }
        if(this._episodes.length !== 0) {
            return this._episodes;
        }
        var tvShow = this;
        var episodeList = "";
        var myPoromenos;
        myPoromenos = new ApiHost(poromenos);
        myPoromenos.path += "?" + querystring.stringify({
            name: tvShow.title
        });
        return http.get(myPoromenos, onResponse).on('error', onError);
        function onResponse(res) {
            return res.on('data', onData).on('error', onError).on('end', onEnd);
        }
        function onData(data) {
            return (episodeList += data.toString('utf8'));
        }
        function onEnd() {
            var eps = episodeList;
            if(eps === "") {
                return cb(new Error("could not get episodes"), null);
            }
            var episodes = [];
            eps = JSON.parse(eps)[tvShow.title].episodes;
            for(var i = 0; i < eps.length; i++) {
                episodes[i] = new Episode(eps[i].season, eps[i].name, eps[i].number);
            }
            return cb(null, episodes);
        }
        function onError(err) {
            return cb(err, null);
        }
    };
    return TVShow;
})(Movie);
var ImdbError = (function () {
    function ImdbError(message, movie) {
        this.message = message;
        this.movie = movie;
        this.name = "imdb api error";
    }
    return ImdbError;
})();
exports.ImdbError = ImdbError;
var deanclatworthy = new ApiHost("deanclatworthy.com", "/imdb/");
var poromenos = new ApiHost("imdbapi.poromenos.org", "/js/");
function get(name, cb) {
    var responseData = "";
    if(typeof (cb) !== "function") {
        throw new TypeError("cb must be a function");
    }
    var myDeanclatworthy;
    myDeanclatworthy = new ApiHost(deanclatworthy);
    myDeanclatworthy.path += "?" + querystring.stringify({
        q: name,
        yg: 0
    });
    return http.get(myDeanclatworthy, onResponse).on('error', onError);
    function onResponse(res) {
        return res.on('data', onData).on('error', onError).on('end', onEnd);
    }
    function onData(data) {
        responseData += data;
    }
    function onEnd() {
        var responseObject;
        try  {
            responseObject = JSON.parse(responseData);
        } catch (e) {
            return cb(e, null);
        }
        if(responseObject.hasOwnProperty("code") && responseObject.hasOwnProperty("error")) {
            return cb(new ImdbError(responseObject.error + ": " + name, name), null);
        }
        if(responseObject.series === 0) {
            responseObject = new Movie(responseObject);
        } else {
            responseObject = new TVShow(responseObject);
        }
        return cb(null, responseObject);
    }
    function onError(err) {
        return cb(err, null);
    }
}
exports.get = get;
;
function getById(id, cb) {
    var responseData = "";
    if(typeof (cb) !== "function") {
        throw new TypeError("cb must be a function");
    }
    var intRegex = /^\d+$/;
    if(intRegex.test(id)) {
        id = 'tt' + id;
    }
    var imdbRegex = /^tt\d+$/;
    if(!imdbRegex.test(id)) {
        throw new TypeError("id must be a an imdb id (tt12345 or 12345)");
    }
    var myDeanclatworthy;
    myDeanclatworthy = new ApiHost(deanclatworthy);
    myDeanclatworthy.path += "?" + querystring.stringify({
        id: id
    });
    return http.get(myDeanclatworthy, onResponse).on('error', onError);
    function onResponse(res) {
        return res.on('data', onData).on('error', onError).on('end', onEnd);
    }
    function onData(data) {
        responseData += data;
    }
    function onEnd() {
        var responseObject;
        try  {
            responseObject = JSON.parse(responseData);
        } catch (e) {
            return cb(e, null);
        }
        if(responseObject.hasOwnProperty("code") && responseObject.hasOwnProperty("error")) {
            return cb(new ImdbError(responseObject.error + ": " + id, id), null);
        }
        return cb(null, responseObject);
    }
    function onError(err) {
        return cb(err, null);
    }
}
exports.getById = getById;
;
