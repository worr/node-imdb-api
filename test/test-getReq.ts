import "https";
import * as path from "path";
import * as nock from "nock";
import { describe, it } from "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";

import * as imdb from "../lib/imdb";

chai.use(chaiAsPromised);
const { assert } = chai;

describe("get", () => {
  it("makes a successful request by name", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger")
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.isFulfilled(
      imdb
        .get(
          {
            name: "The Toxic Avenger",
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          assert.deepEqual(data.imdbid, "tt0090191", "testing returned data");
          assert.deepEqual(data.series, false, "testing series bool");
          assert.deepEqual(
            Object.prototype.hasOwnProperty.call(data, "episodes"),
            false,
            "should not have episodes"
          );
          assert.deepEqual(data.rating, 6.2, "testing rating conversion");
          assert.deepEqual(data.website, "N/A", "testing fetching website");
          assert.deepEqual(data.ratings[0].value, "6.2/10");
          assert.deepEqual(data.ratings[1].value, "70%");
          assert.deepEqual(data.boxoffice, "N/A");
          assert.deepEqual(data.dvd, new Date(1997, 10, 10));
          assert.deepEqual(data.production, "Troma");
        })
    );
  });

  it("makes a successful request by id", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&i=tt0090191&plot=full&r=json")
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.isFulfilled(
      imdb
        .get(
          {
            id: "tt0090191",
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          assert.deepEqual(
            data.title,
            "The Toxic Avenger",
            "testing returned data"
          );
          assert.deepEqual(data.series, false, "testing series bool");
          assert.deepEqual(
            Object.prototype.hasOwnProperty.call(data, "episodes"),
            false,
            "should not have episodes"
          );
          assert.deepEqual(data.rating, 6.2, "testing rating conversion");
        })
    );
  });

  it("makes a successful request with a year", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=James%20Bond&y=2015")
      .replyWithFile(200, path.join(__dirname, "/data/james-bond.json"));

    return assert.isFulfilled(
      imdb
        .get(
          {
            name: "James Bond",
            year: 2015,
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          assert.deepEqual(data.title, "James Bond", "testing returned data");
          assert.deepEqual(data.year, 2015, "testing correct year");
        })
    );
  });

  it("makes a successful request for an episode", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&i=tt0869673&plot=full&r=json")
      .replyWithFile(200, path.join(__dirname, "/data/mother-ep.json"));

    return assert.isFulfilled(
      imdb
        .get(
          {
            id: "tt0869673",
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          assert.deepEqual(
            data.name,
            "The Scorpion and the Toad",
            "testing returned title"
          );
          if (!(data instanceof imdb.Episode)) {
            assert.fail("not an episode");
          } else {
            assert.equal(data.seriesid, "tt0460649", "testing seriesid");
            assert.deepEqual(data.year, 2006, "testing correct year");
            assert.deepEqual(data.website, undefined);
          }
        })
    );
  });

  it("makes a successful request with a short plot", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=short&r=json&t=The%20Toxic%20Avenger")
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.isFulfilled(
      imdb
        .get(
          {
            name: "The Toxic Avenger",
            short_plot: true,
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          assert.deepEqual(data.imdbid, "tt0090191", "testing returned data");
          assert.deepEqual(data.series, false, "testing series bool");
          assert.deepEqual(
            Object.prototype.hasOwnProperty.call(data, "episodes"),
            false,
            "should not have episodes"
          );
        })
    );
  });

  it("times out making a request", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger")
      .delay(2000)
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.isRejected(
      imdb.get(
        {
          name: "The Toxic Avenger",
        },
        {
          apiKey: "foo",
          timeout: 1000,
        }
      ),
      /Request timed out/
    );
  });

  it("times out fetching episodes", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/how-I-met-your-mother.json")
      )
      .get("/?Season=1&apikey=foo&i=tt0460649&r=json")
      .delay(2000)
      .replyWithFile(
        200,
        path.join(__dirname, "/data/how-I-met-your-mother-episodes.json")
      );

    return assert.isRejected(
      imdb
        .get(
          {
            name: "How I Met Your Mother",
          },
          {
            apiKey: "foo",
            timeout: 1000,
          }
        )
        .then((data) => {
          if (data instanceof imdb.TVShow) {
            return data.episodes();
          }
          throw new Error("failure");
        }),
      /Request timed out/
    );
  });

  it("fails to make a request without an api key", () =>
    assert.isRejected(
      imdb.get({ name: "foo" }, {} as imdb.MovieOpts),
      /Missing api key/
    ));

  it("makes two calls to episodes", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/how-I-met-your-mother.json")
      )
      .get("/?Season=1&apikey=foo&i=tt0460649&r=json")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/how-I-met-your-mother-episodes.json")
      );

    return assert.isFulfilled(
      imdb
        .get(
          {
            name: "How I Met Your Mother",
          },
          {
            apiKey: "foo",
            timeout: 1000,
          }
        )
        .then((data) => {
          if (data instanceof imdb.TVShow) {
            return data.episodes().then((eps) => data.episodes());
          }

          throw new Error("failure");
        })
        .then((data) => {
          assert.isOk(data, "ensure data is defined");
        })
    );
  });

  it("gets a movie with no reqs", () =>
    assert.isRejected(
      imdb.get({} as imdb.MovieRequest, {
        apiKey: "foo",
      }),
      /Missing one of req.id or req.name/
    ));

  it("gets an unknown type of data", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=asdfasdfasdf")
      .reply(200, {});

    return assert.isRejected(
      imdb.get(
        {
          name: "asdfasdfasdf",
        },
        {
          apiKey: "foo",
        }
      ),
      /type: 'undefined' is not valid/
    );
  });

  it("gets an error fetching an episode", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=How%20I%20Met%20Your%20Mother")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/how-I-met-your-mother.json")
      )
      .get("/?Season=1&apikey=foo&i=tt0460649&r=json")
      .reply(200, { Error: "bad", Response: "False" });

    return assert.isRejected(
      imdb
        .get(
          {
            name: "How I Met Your Mother",
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.isOk(data);
          assert.instanceOf(data, imdb.TVShow);

          if (data instanceof imdb.TVShow) {
            return data.episodes();
          }
          throw new Error("failure");
        }),
      /bad/
    );
  });

  it("gets an error from omdb by name", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=blah")
      .reply(200, { Error: "bad", Response: "False" });

    return assert.isRejected(
      imdb
        .get(
          {
            name: "blah",
          },
          {
            apiKey: "foo",
          }
        )
        .then((data) => {
          assert.notExists(data, "unreachable");
        }),
      /bad/
    );
  });

  it("gets an error from omdb by id", () => {
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&i=tt01")
      .reply(200, { Error: "bad", Response: "False" });

    return assert.isRejected(
      imdb.get(
        {
          id: "tt01",
        },
        {
          apiKey: "foo",
        }
      ),
      /bad/
    );
  });
});
