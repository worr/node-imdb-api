"use strict";

var http = require('http');
var nock = require('nock');
var nodeunit = require('nodeunit');

var imdb = require('../lib/imdb.js');

module.exports.testGetByIdSuccessful = function(test) {
	var scope = nock('http://www.deanclatworthy.com').get('/imdb/?id=tt0090191').reply(200, require('./data/toxic-avenger.json'));

	return imdb.getById('tt0090191', testResults);

	function testResults(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data.title, 'The Toxic Avenger', "testing returned data");
		test.equal(typeof(data.episodes), "undefined", "testing for null episodes");

		test.done();
	}
}

module.exports.testGetByIdRateLimited = function(test) {
	var scope = nock('http://www.deanclatworthy.com').get('/imdb/?id=tt0090190').reply(200, { code: 2, error: "rate limited" });

	return imdb.getById('tt0090190', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.deepEqual(err, new imdb.ImdbError('rate limited: tt0090190', 'tt0090190'), "testing error code");

		test.done();
	}
}

module.exports.testGetByIdUnsuccessful = function(test) {
	var scope = nock('http://www.deanclatworthy.com').get('/imdb/?id=tt0090190').reply(404);

	return imdb.getById('tt0090190', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.done();
	}
}

module.exports.testGetMadeupMovie = function(test) {
	var scope = nock('http://www.deanclatworthy.com').get('/imdb/?id=tt0090190').reply(200, { code: 1, error: "Film not found" });

	return imdb.getById('tt0090190', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.deepEqual(err, new imdb.ImdbError('Film not found: tt0090190', 'tt0090190'), "testing film not found error");

		test.done();
	}
}


