import https = require('https');
import nock = require('nock');
import mocha = require('mocha');
let assert = require('chai').assert;

import imdb = require('../lib/imdb.js');

describe('get', () => {
    it('makes a successful request by name', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        imdb.get({
            name: 'The Toxic Avenger'
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.imdbid, 'tt0090191', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            assert.deepEqual(data.rating, 6.2, "testing rating conversion");
            done();
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('makes a successful request by id', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0090191&plot=full&r=json').reply(200, require('./data/toxic-avenger.json'));

        imdb.get({
            id: 'tt0090191',
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.title, 'The Toxic Avenger', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            assert.deepEqual(data.rating, 6.2, "testing rating conversion");
            done();
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('makes a successful request with a year', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=James%20Bond&y=2015').reply(200, require('./data/james-bond.json'));

        imdb.get({
            name: 'James Bond',
            year: 2015,
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.title, 'James Bond', "testing returned data");
            assert.deepEqual(data.year, 2015, "testing correct year");
            done();
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('makes a successful request for an episode', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&i=tt0869673&plot=full&r=json').reply(200, require('./data/mother-ep.json'));

        imdb.get({
            id: 'tt0869673',
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.name, 'The Scorpion and the Toad', "testing returned title");
            assert.deepEqual(data.year, 2006, "testing correct year");
            done();
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('makes a successful request with a short plot', (done: MochaDone) => {
        var scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=short&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

        imdb.get({
            name: 'The Toxic Avenger',
            short_plot: true,
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.imdbid, 'tt0090191', "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
            done();
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it('times out making a request', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger').socketDelay(2000).reply(200, require('./data/toxic-avenger.json'));

        imdb.get({
            name: 'The Toxic Avenger',
        }, {
            apiKey: "foo",
            timeout: 1000
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.isOk(err, "ensuring error is defined");
            assert.deepEqual(err.message, "Error: ESOCKETTIMEDOUT");
            done();
        });
    });

    it('times out fetching episodes', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        imdb.get({
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
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.isOk(err, "ensuring error is defined");
            assert.deepEqual(err.message, "Error: ESOCKETTIMEDOUT");
            done();
        });
    });

    it('fails to make a request without an api key', (done: MochaDone) => {
        imdb.get({name: "foo"}, {} as imdb.MovieOpts).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.isOk(err, "ensure error is defined");
            assert.deepEqual(err.message, "Missing api key in opts");
            done();
        });
    });

    it('makes two calls to episodes', (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

        imdb.get({
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
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        }).then((data) => {
            assert.isOk(data, "ensure data is defined");
            done();
        });
    });

    it('gets a movie with no reqs', (done: MochaDone) => {
        imdb.get({} as imdb.MovieRequest, {
            apiKey: "foo"
        }).then((data) => {
            assert.notExists(data);
        }).catch((err) => {
            assert.isOk(err);
            done();
        });
    });

    it("gets an unknown type of data", (done: MochaDone) => {
        let scope = nock('https://www.omdbapi.com').get('/?apikey=foo&plot=full&r=json&t=asdfasdfasdf').reply(200, {});

        imdb.get({
            name: 'asdfasdfasdf',
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.deepEqual(err, new imdb.ImdbError("type: 'undefined' is not valid"), "testing film error");
            done();
        });
    });

    it("gets an error fetching an epside", (done: MochaDone) => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother").reply(200, require("./data/how-I-met-your-mother.json"));

        imdb.get({
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
        }).catch((err) => {
            assert.isOk(err, "got an error");
            assert.deepEqual(err, new imdb.ImdbError("bad"));
            done();
        });
    });

    it("gets an error from omdb by name", (done: MochaDone) => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=blah").reply(200, {Error: "bad", Response: "False"});

        imdb.get({
            name: "blah"
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.isOk(err, "got an error");
            done();
        });
    });

    it("gets an error from omdb by id", (done: MochaDone) => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&i=tt01").reply(200, {Error: "bad", Response: "False"});

        imdb.get({
            id: "tt01"
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.notExists(data, "unreachable");
        }).catch((err) => {
            assert.isOk(err, "got an error");
            done();
        });
    });
});
