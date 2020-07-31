import * as https from "https";
import * as nock from "nock";
import * as mocha from "mocha";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const assert = chai.assert;

import * as imdb from "../lib/imdb.js";

describe("searching", () => {
    it("searches successfully", () => {
        const scope = nock("https://www.omdbapi.com")
            .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
            .replyWithFile(200, __dirname + "/data/toxic-avenger-search.json");

        return assert.isFulfilled(imdb.search({
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
        }));
    });

    it("searches unsuccessfully", () => {
        const scope = nock("https://www.omdbapi.com")
            .get("/?s=Toxic%20Avenger&r=json&apikey=foo&page=1")
            .reply(404);

        return assert.isRejected(imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo"
        }));
    });

    it("times out during a search", () => {
        const scope = nock("https://www.omdbapi.com")
            .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
            .delay(3000)
            .replyWithFile(200, __dirname + "/data/toxic-avenger-search.json");

        return assert.isRejected(imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo",
            timeout: 10,
        }));
    });

    it("gets the next page in a search", () => {
        const scope = nock("https://www.omdbapi.com")
            .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
            .replyWithFile(200, __dirname + "/data/toxic-avenger-search.json")
            .get("/?apikey=foo&page=2&r=json&s=Toxic%20Avenger")
            .replyWithFile(200, __dirname + "/data/toxic-avenger-search.json");

        return assert.isFulfilled(imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo",
        }).then((data) => {
            assert.isOk(data);
            return data.next();
        }).then((data) => {
            assert.isOk(data);
        }));
    });

    it("gets an error from searching", () => {
        const scope = nock("https://www.omdbapi.com")
            .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
            .reply(200, {Error: "bad", Response: "False"});

        return assert.isRejected(imdb.search({
            name: "Toxic Avenger"
        }, {
            apiKey: "foo",
        }), /bad/);
    });
});
