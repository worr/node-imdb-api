import http = require('http');
import nock = require('nock');
import mocha = require('mocha');
const assert = require('chai').assert;

import imdb = require('../lib/imdb.js');

describe('getById', () => {
    it('gets a movie by id successfully', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090191&plot=full&r=json').reply(200, require('./data/toxic-avenger.json'));

        imdb.getById('tt0090191', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(err);

            assert.isOk(data);
            assert.deepEqual(data.title, 'The Toxic Avenger', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            done();
        }
    });

    it('fails to get a movie by id', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&i=tt0090190').reply(404);

        imdb.getById('tt0090190', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);
            done();
        }
    });

    it('fails to get a fake movie', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090190&plot=full&r=json').reply(200, {
            Response: "False",
            Error: "Movie not found!"
        });

        imdb.getById('tt0090190', {
            apiKey: "foo"
        }, testResults);

        function testResults(err, data) {
            assert.ifError(data);

            assert.deepEqual(err, new imdb.ImdbError('Movie not found!: tt0090190'), "testing film not found error");
            done();
        }
    });
});
