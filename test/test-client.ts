import * as https from 'https';
import * as nock from 'nock';
import * as mocha from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const assert = chai.assert;

import * as imdb from '../lib/imdb.js';

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
        const scope = nock('https://www.omdbapi.com')
            .get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger')
            .replyWithFile(200, __dirname + '/data/toxic-avenger.json');

        return assert.eventually.propertyVal(cli.get({
            name: 'The Toxic Avenger'
        }), 'title', 'The Toxic Avenger', 'ensuring that we got a movie');
    });

    it('makes a search request', () => {
        const cli = new imdb.Client({apiKey: 'foo'});
        const scope = nock("https://www.omdbapi.com")
            .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
            .replyWithFile(200, __dirname + "/data/toxic-avenger-search.json");

        return assert.eventually.nestedPropertyVal(cli.search({
            name: 'Toxic Avenger'
        }), 'results[0].title', 'The Toxic Avenger', 'ensuring that we got a movie');
    });

    it('merges options from client args', () => {
        const cli = new imdb.Client({apiKey: 'foo'});
        const scope = nock('https://www.omdbapi.com')
            .get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger')
            .delay(2000)
            .replyWithFile(200, __dirname + '/data/toxic-avenger.json');

        return assert.isRejected(cli.get({
            name: 'The Toxic Avenger',
        }, {
            timeout: 1000
        }), /Request timed out/);
    });

    it('merges options from client args when performing a search', () => {
        const cli = new imdb.Client({apiKey: 'foo'});
        const scope = nock("https://www.omdbapi.com")
            .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
            .delay(2000)
            .replyWithFile(200, __dirname + "/data/toxic-avenger-search.json");

        return assert.isRejected(cli.search({
            name: 'Toxic Avenger'
        }, 1, {
            timeout: 1000
        }), /Request timed out/);
    });
});
