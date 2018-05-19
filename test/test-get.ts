import https = require('https');
import nock = require('nock');
import mocha = require('mocha');
let assert = require('chai').assert;

import imdb = require('../lib/imdb.js');

describe('get', () => {
    it('makes a successful request', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        return imdb.get('The Toxic Avenger', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.equal(data.imdbid, 'tt0090191', "testing returned data");
            assert.equal(data.series, false, "testing series bool");
            assert.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");
        }
    });
    it('makes an unsuccessful request', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Green%20Mile').reply(404);

        return imdb.get('The Green Mile', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);
        }
    });

    it('makes an request for a made up movie', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=asdfasdfasdf').reply(200, {
            Response: "False",
            Error: "Movie not found!"
        });

        return imdb.get('asdfasdfasdf', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);

            assert.deepEqual(err, new imdb.ImdbError('Movie not found!: asdfasdfasdf'), "testing film not found error");
        }
    });

    it('gets episodes', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        return imdb.get('How I Met Your Mother', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, tvshow) {
            var scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').reply(200, require('./data/how-I-met-your-mother-episodes.json'));
            assert.ifError(err);

            assert.isOk(tvshow);
            assert.equal(tvshow.start_year, 2005, "testing start_year");
            assert.equal(tvshow.end_year, null, "testing end_year");
            assert.equal(tvshow.year, null, "testing year is null");
            assert.isFunction(tvshow.episodes, "testing for episodes function");
            assert.equal(tvshow.series, true, "testing series bool");

            return tvshow.episodes((err, data) => {
                testEpisodes(err, data, tvshow);
            });
        }

        function testEpisodes(err, data, tvshow) {
            assert.ifError(err);

            assert.isOk(data);
            assert.equal(data[0].season, 1, "testing a random value");
            assert.equal(data[0].episode, 1, "testing another value");
            assert.equal(data[0].name, "Pilot", "testing episode title");
            assert.deepEqual(data[0].released, new Date("19 Sep 2005"), "testing release date");

            assert.equal(typeof(tvshow._episodes), "object", "testing type of _episodes");
            assert.equal(tvshow._episodes[0].season, 1, "testing cached value");
            assert.equal(tvshow._episodes[0].episode, 1, "testing another cached value");

        }
    });

    it('unsuccessfully gets epsidode', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        return imdb.get('How I Met Your Mother', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0460649&r=json&Season=1').reply(404);

            assert.ifError(err);
            assert.isOk(data);

            return data.episodes(testEpisodes);
        }

        function testEpisodes(err, data) {
            assert.ifError(data);

        }
    });
});
