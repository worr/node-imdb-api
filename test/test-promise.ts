import https = require("https");
import nock = require("nock");
import mocha = require("mocha");
const assert = require("chai").assert;

import imdb = require("../lib/imdb.js");

describe("get promises", () => {
    it("tests a fulfilled promise", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger").reply(200, require("./data/toxic-avenger.json"));

        return imdb.get("The Toxic Avenger", {
            apiKey: "foo"
        }).then((data) => {
            assert.isOk(data);
            assert.deepEqual(data.imdbid, "tt0090191", "testing returned data");
            assert.deepEqual(data.series, false, "testing series bool");
            assert.deepEqual(data.hasOwnProperty("episodes"), false, "should not have episodes");
        }).catch((err) => {
            assert.ifError(err);
        });
    });

    it("tests a rejected promise", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger").reply(404);

        return imdb.get("The Toxic Avenger", {
            apiKey: "foo"
        }).then((data) => {
            assert.ifError(data);
        }).catch((err) => {
            assert.isOk(err);
        });
    });

    it("tests a fulfilled episode promise", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother").reply(200, require("./data/how-I-met-your-mother.json"));

        return imdb.get("How I Met Your Mother", {
            apiKey: "foo"
        }).then((data) => {
            let scope = nock("https://www.omdbapi.com").get("/?Season=1&apikey=foo&i=tt0460649&r=json").reply(200, require("./data/how-I-met-your-mother-episodes.json"));

            assert.isOk(data);
            assert.instanceOf(data, imdb.TVShow);
            if (data instanceof imdb.TVShow) {
                return data.episodes();
            } else {
                throw new Error("failure");
            }
        }).then((eps) => {
            assert.isOk(eps, "has episodes");
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it("tests a rejected episode promise", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother").reply(200, require("./data/how-I-met-your-mother.json"));

        return imdb.get("How I Met Your Mother", {
            apiKey: "foo"
        }).then((data) => {
            let scope = nock("https://www.omdbapi.com").get("/?Season=1&apikey=foo&i=tt0460649&r=json").reply(404);

            assert.isOk(data);

            if (data instanceof imdb.TVShow) {
                return data.episodes();
            } else {
                throw new Error("failure");
            }
        }).then((eps) => {
            assert.isNotOk(eps, "we should not have data here");
        }).catch((err) => {
            assert.isOk(err, "ensure we got an error");
        });
    });
});


describe("getReq promises", () => {
    it("doesn\"t submit an api key with a request", () => {
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

    it("gets an episode twice", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother").reply(200, require("./data/how-I-met-your-mother.json"));

        return imdb.get("How I Met Your Mother", {
            apiKey: "foo"
        }).then((data) => {
            let scope = nock("https://www.omdbapi.com").get("/?Season=1&apikey=foo&i=tt0460649&r=json").reply(200, require("./data/how-I-met-your-mother-episodes.json"));

            assert.isOk(data);
            assert.instanceOf(data, imdb.TVShow);
            if (data instanceof imdb.TVShow) {
                return data.episodes().then((eps) => { return data.episodes(); });
            } else {
                throw new Error("failure");
            }
        }).then((eps) => {
            assert.isOk(eps, "has episodes");
        }).catch((err) => {
            assert.notExists(err, "unreachable");
        });
    });

    it("gets a movie with no requirements", () => {
        return imdb.getReq({
            opts: {apiKey: "foo"}
        }).then((data) => {
            assert.isNotOk(data, "ensure data is not defined");
        }).catch((err) => {
            assert.isOk(err, "ensure error is defined");
            assert.deepEqual(err.message, "Missing one of req.id or req.name");
        });
    });

    it("gets an error fetching a movie", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=asdfasdfasdf").reply(200, {
            Response: "False",
            Error: "Movie not found!"
        });

        return imdb.getReq({
            name: "asdfasdfasdf",
            opts: {
                apiKey: "foo"
            }
        }).catch((err) => {
            assert.deepEqual(err, new imdb.ImdbError("Movie not found!: asdfasdfasdf"), "testing film not found error");
        });
    });

    it("gets an unknown type of data", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=asdfasdfasdf").reply(200, {});

        return imdb.getReq({
            name: "asdfasdfasdf",
            opts: {
                apiKey: "foo"
            }
        }).catch((err) => {
            assert.deepEqual(err, new imdb.ImdbError("type: 'undefined' is not valid"), "testing film error");
        });
    });

    it("gets an error fetching an epside", () => {
        let scope = nock("https://www.omdbapi.com").get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother").reply(200, require("./data/how-I-met-your-mother.json"));

        return imdb.getReq({
            name: "How I Met Your Mother",
            opts: {
                apiKey: "foo"
            }
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
        });
    });
});
