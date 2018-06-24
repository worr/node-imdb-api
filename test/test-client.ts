import https = require('https');
import nock = require('nock');
import mocha = require('mocha');
let assert = require('chai').assert;

import imdb = require('../lib/imdb.js');

describe('tests client creation and use', () => {
    it('creates a new client with one options', (done: MochaDone) => {
        const cli = new imdb.Client({apiKey: 'foo'});

        assert.isOk(cli, 'ensure client is created');
        done();
    });

    it('creates a new client without an apikey', (done: MochaDone) => {
        assert.throws(() => { new imdb.Client({} as imdb.MovieOpts); }, /Missing api key/);
        done();
    });

    it('makes a get request', (done: MochaDone) => {
        const cli = new imdb.Client({apiKey: 'foo'});
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        cli.get({
            name: 'The Toxic Avenger'
        }).then((data) => {
            assert.isOk(data);
            assert.equal(data.name, "The Toxic Avenger", "ensuring we got a movie");
            done();
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('makes a search request', (done: MochaDone) => {
        const cli = new imdb.Client({apiKey: 'foo'});
        const scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").reply(200, require("./data/toxic-avenger-search.json"));

        cli.search({
            name: 'Toxic Avenger'
        }).then((data) => {
            assert.isOk(data);
            assert.equal(data.results[0].title, "The Toxic Avenger", "ensuring we got a movie");
            done();
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('merges options from client args', (done: MochaDone) => {
        const cli = new imdb.Client({apiKey: 'foo'});
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').socketDelay(2000).reply(200, require('./data/toxic-avenger.json'));

        cli.get({
            name: 'The Toxic Avenger',
        }, {
            timeout: 1000
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.isOk(err, "ensuring error is defined");
            assert.deepEqual(err.message, "Error: ESOCKETTIMEDOUT");
            done();
        });
    });

    it('merges options from client args when performing a search', (done: MochaDone) => {
        const cli = new imdb.Client({apiKey: 'foo'});
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").socketDelay(2000).reply(200, require("./data/toxic-avenger-search.json"));

        cli.search({
            name: 'Toxic Avenger'
        }, 1, {
            timeout: 1000
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.isOk(err, "ensuring error is defined");
            assert.deepEqual(err.message, "Error: ESOCKETTIMEDOUT");
            done();
        });
    });
});
