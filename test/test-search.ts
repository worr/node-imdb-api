import https = require("https");
import nock = require("nock");
import mocha = require("mocha");
const assert = require("chai").assert;

import imdb = require("../lib/imdb.js");

describe("searching", () => {
    it("searches successfully", () => {
        const scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").reply(200, require("./data/toxic-avenger-search.json"));

        return imdb.search({
            name: "Toxic Avenger"
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

    it("searches unsuccessfully", () => {
        const scope = nock("https://www.omdbapi.com").get("/?s=Toxic%20Avenger&r=json&apikey=foo&page=1").reply(404);

        return imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo"
        }).then((data) => {
            assert.ifError(data);
        }).catch((err) => {
            assert.isOk(err);
        });
    });

    it("times out during a search", () => {
        const scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").socketDelay(3000).reply(200, require("./data/toxic-avenger-search.json"));

        return imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo",
            timeout: 10
        }).then((data) => {
            assert.ifError(data);
        }).catch((err) => {
            assert.isOk(err);
        });
    });

    it("gets the next page in a search", () => {
        const scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").reply(200, require("./data/toxic-avenger-search.json"));

        return imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo",
        }).then((data) => {
            assert.isOk(data);
            const scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=2&r=json&s=Toxic%20Avenger").reply(200, require("./data/toxic-avenger-search.json"));
            return data.next();
        }).then((data) => {
            assert.isOk(data);
        }).catch((err) => {
            assert.ifError(err);
        });
    });

    it("gets an error from searching", () => {
        const scope = nock("https://www.omdbapi.com").get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger").reply(200, {Error: "bad", Response: "False"});

        return imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo",
        }).catch((err) => {
            assert.isOk(err);
            assert.deepEqual(err, new imdb.ImdbError("bad: Toxic Avenger"));
        });
    });
});
