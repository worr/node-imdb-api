import https = require('https');
import nock = require('nock');
import mocha = require('mocha');
const assert = require('chai').assert;

import imdb = require('../lib/imdb.js');

describe('get promises', () => {
    it('tests a fulfilled promise', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        return imdb.get('The Toxic Avenger', {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.imdbid, 'tt0090191', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
        }).catch((err) => {
            assert.ifError(err);
        });
    });

    it('tests a rejected promise', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(404);

        return imdb.get('The Toxic Avenger', {
            apiKey: "foo"
        }).then((data) => {
            assert.ifError(data);
        }).catch((err) => {
            assert.isOk(err);
        });
    });

    it('tests a fulfilled episode promise', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        return imdb.get('How I Met Your Mother', {
            apiKey: "foo"
        }).then((data) => {
            let scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').reply(200, require('./data/how-I-met-your-mother-episodes.json'));

            assert.isOk(data);
            assert.instanceOf(data, imdb.TVShow);
            if (data instanceof imdb.TVShow) {
                return data.episodes();
            } else {
                throw new Error('failure');
            }
        }).then((eps) => {
            assert.isOk(eps, "has episodes");
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('tests a rejected episode promise', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        return imdb.get('How I Met Your Mother', {
            apiKey: "foo"
        }).then((data) => {
            let scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').reply(404);

            assert.isOk(data);

            if (data instanceof imdb.TVShow) {
                return data.episodes();
            } else {
                throw new Error('failure');
            }
        }).then((eps) => {
            assert.isNotOk(eps, "we should not have data here");
        }).catch((err) => {
            assert.isOk(err, "ensure we got an error");
        });
    });
});


describe('getReq promises', () => {
    it('doesn\'t submit an api key with a request', () => {
        return imdb.getReq({
            name: "foo",
            opts: {} as imdb.MovieOpts
        }).then((data) => {
            assert.isNotOk(data, "ensure data is not defined");
        }).catch((err) => {
            assert.isOk(err, "ensure error is defined");
            assert.deepEqual(err.message, "Missing api key in opts");
        });
    });

    it('gets an episode twice', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        return imdb.get('How I Met Your Mother', {
            apiKey: "foo"
        }).then((data) => {
            let scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').reply(200, require('./data/how-I-met-your-mother-episodes.json'));

            assert.isOk(data);
            assert.instanceOf(data, imdb.TVShow);
            if (data instanceof imdb.TVShow) {
                return data.episodes().then((eps) => { return data.episodes(); });
            } else {
                throw new Error('failure');
            }
        }).then((eps) => {
            assert.isOk(eps, "has episodes");
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });
});
