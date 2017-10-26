var https = require('https');
var nock = require('nock');
var nodeunit = require('nodeunit');

var imdb = require('../lib/imdb.js');

module.exports.testGetReqSuccessful = function(test) {
    var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

    return imdb.getReq({
        name: 'The Toxic Avenger',
        opts: {
            apiKey: "foo"
        }
    }, testResults);

    function testResults(err, data) {
        test.ifError(err);

        test.ok(data);
        test.equal(data.imdbid, 'tt0090191', "testing returned data");
        test.equal(data.series, false, "testing series bool");
        test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

        test.done();
    }
};

module.exports.testGetByReqIdSuccessful = function(test) {
    var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090191&plot=full&r=json').reply(200, require('./data/toxic-avenger.json'));

    return imdb.getReq({
        id: 'tt0090191',
        opts: {
            apiKey: "foo"
        }
    }, testResults);

    function testResults(err, data) {
        test.ifError(err);

        test.ok(data);
        test.equal(data.title, 'The Toxic Avenger', "testing returned data");
        test.equal(data.series, false, "testing series bool");
        test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

        test.done();
    }
};

module.exports.testGetByReqYear = function(test) {
    var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=James%20Bond&y=2015').reply(200, require('./data/james-bond.json'));

    return imdb.getReq({
        name: 'James Bond',
        year: 2015,
        opts: {
            apiKey: "foo"
        }
    }, testResults);

    function testResults(err, data) {
        test.ifError(err);

        test.ok(data);
        test.equal(data.title, 'James Bond', "testing returned data");
        test.equal(data.year, 2015, "testing correct year");

        test.done();
    }
};

module.exports.testGetEpisode = function(test) {
    var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0869673&plot=full&r=json').reply(200, require('./data/mother-ep.json'));

    return imdb.getReq({
        id: 'tt0869673',
        opts: {
            apiKey: "foo"
        }
    }, testResults);

    function testResults(err, data) {
        test.ifError(err);

        test.ok(data);
        test.equal(data.name, 'The Scorpion and the Toad', "testing returned title");
        test.equal(data.year, 2006, "testing correct year");

        test.done();
    }
};
