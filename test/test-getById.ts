import http = require('http');
import nock = require('nock');
import mocha = require('mocha');
const assert = require('chai').assert;

import imdb = require('../lib/imdb.js');

describe('getById', () => {
    it('gets a movie by id successfully', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090191&plot=full&r=json').reply(200, require('./data/toxic-avenger.json'));

        return imdb.getById('tt0090191', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.deepEqual(data.title, 'The Toxic Avenger', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
        }
    });

    it('fails to get a movie by id', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&i=tt0090190').reply(404);

        return imdb.getById('tt0090190', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);
        }
    });

    it('fails to get a fake movie', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090190&plot=full&r=json').reply(200, {
            Response: "False",
            Error: "Movie not found!"
        });

        return imdb.getById('tt0090190', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);

            assert.deepEqual(err, new imdb.ImdbError('Movie not found!: tt0090190'), "testing film not found error");
        }
    });
});
