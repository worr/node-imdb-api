import https = require('https');
import nock = require('nock');
import mocha = require('mocha');
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

import imdb = require('../lib/imdb.js');

describe('get', () => {
    it('makes a successful request by name', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        return assert.isFulfilled(imdb.get({
            name: 'The Toxic Avenger'
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.imdbid, 'tt0090191', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            assert.deepEqual(data.rating, 6.2, "testing rating conversion");
        }));
    });

    it('makes a successful request by id', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090191&plot=full&r=json').reply(200, require('./data/toxic-avenger.json'));

        return assert.isFulfilled(imdb.get({
            id: 'tt0090191',
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.title, 'The Toxic Avenger', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            assert.deepEqual(data.rating, 6.2, "testing rating conversion");
        }));
    });

    it('makes a successful request with a year', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=James%20Bond&y=2015').reply(200, require('./data/james-bond.json'));

        return assert.isFulfilled(imdb.get({
            name: 'James Bond',
            year: 2015,
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.title, 'James Bond', "testing returned data");
            assert.deepEqual(data.year, 2015, "testing correct year");
        }));
    });

    it('makes a successful request for an episode', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0869673&plot=full&r=json').reply(200, require('./data/mother-ep.json'));

        return assert.isFulfilled(imdb.get({
            id: 'tt0869673',
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.name, 'The Scorpion and the Toad', "testing returned title");
            assert.deepEqual(data.year, 2006, "testing correct year");
        }));
    });

    it('makes a successful request with a short plot', () => {
        var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=short&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        return assert.isFulfilled(imdb.get({
            name: 'The Toxic Avenger',
            short_plot: true,
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.imdbid, 'tt0090191', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
        }));
    });

    it('times out making a request', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').socketDelay(2000).reply(200, require('./data/toxic-avenger.json'));

        return assert.isRejected(imdb.get({
            name: 'The Toxic Avenger',
        }, {
            apiKey: "foo",
            timeout: 1000
        }), /Error: ESOCKETTIMEDOUT/);
    });

    it('times out fetching episodes', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        return assert.isRejected(imdb.get({
            name: 'How I Met Your Mother',
        }, {
            apiKey: "foo",
            timeout: 1000
        }).then((data) => {
            let scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').socketDelay(2000).reply(200, require('./data/how-I-met-your-mother-episodes.json'));
            if (data instanceof imdb.TVShow) {
                return data.episodes();
            } else {
                throw new Error("failure");
            }
        }), /Error: ESOCKETTIMEDOUT/);
    });

    it('fails to make a request without an api key', () => {
        return assert.isRejected(imdb.get({name: "foo"}, {} as imdb.MovieOpts), /Missing api key/);
    });

    it('makes two calls to episodes', () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        return assert.isFulfilled(imdb.get({
            name: 'How I Met Your Mother',
        },  {
            apiKey: "foo",
            timeout: 1000
        }).then((data) => {
            let scope = nock('https://www.omdbapi.com').get('/?Season=1&apikey=foo&i=tt0460649&r=json').reply(200, require('./data/how-I-met-your-mother-episodes.json'));

            if (data instanceof imdb.TVShow) {
                return data.episodes().then((eps) => { return data.episodes(); });
            } else {
                throw new Error("failure");
            }
        }).then((data) => {
            assert.isOk(data, "ensure data is defined");
        }));
    });

    it('gets a movie with no reqs', () => {
        return assert.isRejected(imdb.get({} as imdb.MovieRequest, {
            apiKey: "foo"
        }), /Missing one of req.id or req.name/);
    });

    it("gets an unknown type of data", () => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=asdfasdfasdf').reply(200, {});

        return assert.isRejected(imdb.get({
            name: 'asdfasdfasdf',
        }, {
            apiKey: "foo"
        }), /type: \'undefined\' is not valid/);
    });

    it("gets an error fetching an epside", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother").reply(200, require("./data/how-I-met-your-mother.json"));

        return assert.isRejected(imdb.get({
            name: "How I Met Your Mother",
        }, {
            apiKey: "foo"
        }).then((data) => {
            let scope = nock("https://www.omdbapi.com").get("/?Season=1&apikey=foo&i=tt0460649&r=json").reply(200, {Error: "bad", Response: "False"});

            assert.isOk(data);
            assert.instanceOf(data, imdb.TVShow);
            if (data instanceof imdb.TVShow) {
                return data.episodes();
            } else {
                throw new Error("failure");
            }
        }), /bad/);
    });

    it("gets an error from omdb by name", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=blah").reply(200, {Error: "bad", Response: "False"});

        return assert.isRejected(imdb.get({
            name: "blah"
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }), /bad/);
    });

    it("gets an error from omdb by id", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&i=tt01").reply(200, {Error: "bad", Response: "False"});

        return assert.isRejected(imdb.get({
            id: "tt01"
        }, {
            apiKey: "foo"
        }), /bad/);
    });
});
