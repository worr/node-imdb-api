import https = require('https');
import nock = require('nock');
import mocha = require('mocha');
let assert = require('chai').assert;

import imdb = require('../lib/imdb.js');

describe('getReq', () => {
    it('makes a successful request by name', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        imdb.getReq({
            name: 'The Toxic Avenger',
            opts: {
                apiKey: "foo"
            }
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.deepEqual(data.imdbid, 'tt0090191', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            assert.deepEqual(data.rating, 6.2, "testing rating conversion");
            done();
        }
    });

    it('makes a successful request by id', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090191&plot=full&r=json').reply(200, require('./data/toxic-avenger.json'));

        imdb.getReq({
            id: 'tt0090191',
            opts: {
                apiKey: "foo"
            }
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.deepEqual(data.title, 'The Toxic Avenger', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            assert.deepEqual(data.rating, 6.2, "testing rating conversion");
            done();
        }
    });

    it('makes a successful request with a year', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=James%20Bond&y=2015').reply(200, require('./data/james-bond.json'));

        imdb.getReq({
            name: 'James Bond',
            year: 2015,
            opts: {
                apiKey: "foo"
            }
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.deepEqual(data.title, 'James Bond', "testing returned data");
            assert.deepEqual(data.year, 2015, "testing correct year");
            done();
        }
    });

    it('makes a successful request for an episode', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0869673&plot=full&r=json').reply(200, require('./data/mother-ep.json'));

        imdb.getReq({
            id: 'tt0869673',
            opts: {
                apiKey: "foo"
            }
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.deepEqual(data.name, 'The Scorpion and the Toad', "testing returned title");
            assert.deepEqual(data.year, 2006, "testing correct year");
            done();
        }
    });

    it('makes a successful request with a short plot', (done: MochaDone) => {
        var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=short&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        imdb.getReq({
            name: 'The Toxic Avenger',
            short_plot: true,
            opts: {
                apiKey: "foo"
            }
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.deepEqual(data.imdbid, 'tt0090191', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            done();
        }
    });

    it('times out making a request', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').socketDelay(2000).reply(200, require('./data/toxic-avenger.json'));

        imdb.getReq({
            name: 'The Toxic Avenger',
            opts: {
                apiKey: "foo",
                timeout: 1000
            }
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);
            assert.isOk(err, "ensuring error is defined");
            assert.deepEqual(err.message, "Error: ESOCKETTIMEDOUT");
            done();
        }
    });

    it('times out fetching episodes', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        imdb.getReq({
            name: 'How I Met Your Mother',
            opts: {
                apiKey: "foo",
                timeout: 1000
            }
        }, testResults);

        function testResults(err, data) {
            let scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').socketDelay(2000).reply(200, require('./data/how-I-met-your-mother-episodes.json'));

            assert.ifError(err);

            return data.episodes(testEpisodes);
        }

        function testEpisodes(err, data) {
            assert.ifError(data);
            assert.isOk(err, "ensuring error is defined");
            assert.deepEqual(err.message, "Error: ESOCKETTIMEDOUT");
            done();
        }
    });

    it('fails to make a request without an api key', (done: MochaDone) => {
        imdb.getReq({name: "foo", opts: {} as imdb.MovieOpts}, testResults);

        function testResults(err, data) {
            assert.ifError(data);
            assert.isOk(err, "ensure error is defined");
            assert.deepEqual(err.message, "Missing api key in opts");
            done();
        }
    });

    it('makes two calls to episodes', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        imdb.getReq({
            name: 'How I Met Your Mother',
            opts: {
                apiKey: "foo",
                timeout: 1000
            }
        }, testResults);

        function testResults(err, data) {
            let scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').reply(200, require('./data/how-I-met-your-mother-episodes.json'));

            assert.ifError(err);

            data.episodes().then((_) => { data.episodes(testEpisodes)});
        }

        function testEpisodes(err, data) {
            assert.ifError(err);
            assert.isOk(data, "ensuring data is defined after two calls");
            done();
        }
    });

    it('gets a movie with no reqs', (done: MochaDone) => {
        imdb.getReq({
            opts: {
                apiKey: "foo"
            }
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);

            assert.isOk(err);
            done();
        }
    });
});
