var https = require('https');
var nock = require('nock');
var nodeunit = require('nodeunit');

var imdb = require('../lib/imdb.js');

module.exports.testGetReqSuccessful = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

	return imdb.getReq({name: 'The Toxic Avenger'}, testResults);

	function testResults(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data.imdbid, 'tt0090191', "testing returned data");
		test.equal(data.series, false, "testing series bool");
		test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

		test.done();
	}
}

module.exports.testGetByReqIdSuccessful = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&i=tt0090191').reply(200, require('./data/toxic-avenger.json'));

	return imdb.getReq({id: 'tt0090191'}, testResults);

	function testResults(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data.title, 'The Toxic Avenger', "testing returned data");
		test.equal(data.series, false, "testing series bool");
		test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

		test.done();
	}
}

module.exports.testGetByReqYear = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&y=2015&t=James%20Bond').reply(200, require('./data/james-bond.json'));

	return imdb.getReq({name: 'James Bond', year: 2015}, testResults);

	function testResults(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data.title, 'James Bond', "testing returned data");
		test.equal(data.year, 2015, "testing correct year");

		test.done();
	}
}
