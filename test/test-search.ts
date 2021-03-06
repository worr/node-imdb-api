import "https";
import path from "path";
import nock from "nock";
import { describe, it } from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

import * as imdb from "../lib/imdb";

chai.use(chaiAsPromised);
const { assert } = chai;

describe("searching", () => {
  it("searches successfully", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      );

    return assert.isFulfilled(
      imdb
        .search(
          {
            name: "Toxic Avenger",
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          assert.deepEqual(
            data.results.length,
            10,
            "testing length of results"
          );
          assert.deepEqual(data.totalresults, 98, "testing total length");
          for (const result of data.results) {
            assert.isOk(result);
          }
        })
    );
  });

  it("searches unsuccessfully", () => {
    nock("https://www.omdbapi.com")
      .get("/?s=Toxic%20Avenger&r=json&apikey=foo&page=1")
      .reply(404);

    return assert.isRejected(
      imdb.search(
        {
          name: "Toxic Avenger",
        },
        {
          apiKey: "foo",
        }
      )
    );
  });

  it("times out during a search", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .delay(3000)
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      );

    return assert.isRejected(
      imdb.search(
        {
          name: "Toxic Avenger",
        },
        {
          apiKey: "foo",
          timeout: 10,
        }
      )
    );
  });

  it("gets the next page in a search", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      )
      .get("/?apikey=foo&page=2&r=json&s=Toxic%20Avenger")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      );

    return assert.isFulfilled(
      imdb
        .search(
          {
            name: "Toxic Avenger",
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          return data.next();
        })
        .then((data) => {
          assert.isOk(data);
        })
    );
  });

  it("gets an error from searching", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .reply(200, { Error: "bad", Response: "False" });

    return assert.isRejected(
      imdb.search(
        {
          name: "Toxic Avenger",
        },
        {
          apiKey: "foo",
        }
      ),
      /bad/
    );
  });
});
