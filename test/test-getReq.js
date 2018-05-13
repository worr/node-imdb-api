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

module.exports.testGetReqShortPlot = function(test) {
    var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=short&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

    return imdb.getReq({
        name: 'The Toxic Avenger',
        short_plot: true,
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

module.exports.testGetReqTimeout = function(test) {
    var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').socketDelay(2000).reply(200, require('./data/toxic-avenger.json'));

    return imdb.getReq({
        name: 'The Toxic Avenger',
        opts: {
            apiKey: "foo",
            timeout: 1000
        }
    }, testResults);

    function testResults(err, data) {
        test.ifError(data);
        test.ok(err, "ensuring error is defined");
        test.equal(err.message, "Error: ESOCKETTIMEDOUT");

        test.done();
    }
};

module.exports.testGetEpisodesTimeout = function(test) {
    var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

    return imdb.getReq({
        name: 'How I Met Your Mother',
        opts: {
            apiKey: "foo",
            timeout: 1000
        }
    }, testResults);

    function testResults(err, data) {
        var scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').socketDelay(2000).reply(200, require('./data/how-I-met-your-mother-episodes.json'));

        test.ifError(err);

        return data.episodes(testEpisodes);
    }

    function testEpisodes(err, data) {
        test.ifError(data);
        test.ok(err, "ensuring error is defined");
        test.equal(err.message, "Error: ESOCKETTIMEDOUT");

        test.done();
    }
};
