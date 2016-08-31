"use strict";

var http = require('http');
var nock = require('nock');
var nodeunit = require('nodeunit');

var imdb = require('../lib/imdb.js');

module.exports.testGetByIdSuccessful = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&i=tt0090191').reply(200, require('./data/toxic-avenger.json'));

	return imdb.getById('tt0090191', testResults);

	function testResults(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data.title, 'The Toxic Avenger', "testing returned data");
		test.equal(data.series, false, "testing series bool");
		test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

		test.done();
	}
}

module.exports.testGetByIdUnsuccessful = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&i=tt0090190').reply(404);

	return imdb.getById('tt0090190', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.done();
	}
}

module.exports.testGetMadeupMovie = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&i=tt0090190').reply(200, { Response: "False", Error: "Movie not found!" });

	return imdb.getById('tt0090190', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.deepEqual(err, new imdb.ImdbError('Movie not found!: tt0090190', { id: 'tt0090190', name: undefined }), "testing film not found error");

		test.done();
	}
}

