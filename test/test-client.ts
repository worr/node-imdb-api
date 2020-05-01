import https = require('https');
import nock = require('nock');
import mocha = require('mocha');
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

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

    it('makes a get request', () => {
        const cli = new imdb.Client({apiKey: 'foo'});
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        return assert.eventually.propertyVal(cli.get({
            name: 'The Toxic Avenger'
        }), 'title', 'The Toxic Avenger', 'ensuring that we got a movie');
    });

    it('makes a search request', () => {
        const cli = new imdb.Client({apiKey: 'foo'});
        const scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").reply(200, require("./data/toxic-avenger-search.json"));

        return assert.eventually.nestedPropertyVal(cli.search({
            name: 'Toxic Avenger'
        }), 'results[0].title', 'The Toxic Avenger', 'ensuring that we got a movie');
    });

    it('merges options from client args', () => {
        const cli = new imdb.Client({apiKey: 'foo'});
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').socketDelay(2000).reply(200, require('./data/toxic-avenger.json'));

        return assert.isRejected(cli.get({
            name: 'The Toxic Avenger',
        }, {
            timeout: 1000
        }), /Error: ESOCKETTIMEDOUT/);
    });

    it('merges options from client args when performing a search', () => {
        const cli = new imdb.Client({apiKey: 'foo'});
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").socketDelay(2000).reply(200, require("./data/toxic-avenger-search.json"));

        return assert.isRejected(cli.search({
            name: 'Toxic Avenger'
        }, 1, {
            timeout: 1000
        }), /Error: ESOCKETTIMEDOUT/);
    });
});
