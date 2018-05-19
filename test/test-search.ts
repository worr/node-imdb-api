import https = require("https");
import nock = require("nock");
import mocha = require("mocha");
const assert = require('chai').assert;

import imdb = require("../lib/imdb.js");

describe('search', () => {
    it('searches successfully', () => {
        const scope = nock('https://www.omdbapi.com').get('/?apikey=foo&page=1&r=json&s=Toxic%20Avenger').reply(200, require('./data/toxic-avenger-search.json'));

        return imdb.search({
            title: 'Toxic Avenger'
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.results.length, 10, "testing length of results");
            assert.deepEqual(data.totalresults, 98, "testing total length");
            for (const result of data.results) {
                assert.isOk(result);
            }
        }).catch((err) => {
            assert.ifError(err);
        });
    });

    it('searches unsuccessfully', () => {
        const scope = nock('https://www.omdbapi.com').get('/?s=Toxic%20Avenger&r=json&apikey=foo&page=1').reply(404);

        return imdb.search({
            title: 'Toxic Avenger'
        }, {
            apiKey: "foo"
        }).then(function(data) {
            assert.ifError(data);
        }).catch(function(err) {
            assert.isOk(err);
        });
    });
});
