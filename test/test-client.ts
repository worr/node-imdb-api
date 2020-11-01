import "https";
import path from "path";
import nock from "nock";
import { Done, it, describe } from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

// Node just like, has this. ts-node requires this import
import { URL } from "url";

import * as imdb from "../lib/imdb";

chai.use(chaiAsPromised);
const { assert } = chai;

describe("tests client creation and use", () => {
  it("creates a new client with one options", (done: Done) => {
    const cli = new imdb.Client({ apiKey: "foo" });

    assert.isOk(cli, "ensure client is created");
    done();
  });

  it("creates a new client without an apikey", (done: Done) => {
    assert.throws(() => {
      new imdb.Client({} as imdb.MovieOpts); // eslint-disable-line no-new
    }, /Missing api key/);
    done();
  });

  it("makes a get request", () => {
    const cli = new imdb.Client({ apiKey: "foo" });
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger")
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.eventually.propertyVal(
      cli.get({
        name: "The Toxic Avenger",
      }),
      "title",
      "The Toxic Avenger",
      "ensuring that we got a movie"
    );
  });

  it("makes a search request", () => {
    const cli = new imdb.Client({ apiKey: "foo" });
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      );

    return assert.eventually.nestedPropertyVal(
      cli.search({
        name: "Toxic Avenger",
      }),
      "results[0].title",
      "The Toxic Avenger",
      "ensuring that we got a movie"
    );
  });

  it("merges options from client args", () => {
    const cli = new imdb.Client({ apiKey: "foo" });
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger")
      .delay(2000)
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.isRejected(
      cli.get(
        {
          name: "The Toxic Avenger",
        },
        {
          timeout: 1000,
        }
      ),
      /Request timed out/
    );
  });

  it("merges options from client args when performing a search", () => {
    const cli = new imdb.Client({ apiKey: "foo" });
    nock("https://www.omdbapi.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .delay(2000)
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      );

    return assert.isRejected(
      cli.search(
        {
          name: "Toxic Avenger",
        },
        1,
        {
          timeout: 1000,
        }
      ),
      /Request timed out/
    );
  });

  it("uses a new baseURL when configured from a string", () => {
    const cli = new imdb.Client({ apiKey: "foo", baseURL: "https://bar.com" });
    nock("https://bar.com")
      .get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger")
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.eventually.propertyVal(
      cli.get({
        name: "The Toxic Avenger",
      }),
      "title",
      "The Toxic Avenger",
      "ensuring that we got a movie from bar.com"
    );
  });

  it("uses a new baseURL when configured for search from a string", () => {
    const cli = new imdb.Client({ apiKey: "foo", baseURL: "https://bar.com" });
    nock("https://bar.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      );

    return assert.eventually.nestedPropertyVal(
      cli.search({
        name: "Toxic Avenger",
      }),
      "results[0].title",
      "The Toxic Avenger",
      "ensuring that we got a movie from bar.com"
    );
  });

  it("uses a new baseURL when configured from a URL", () => {
    const cli = new imdb.Client({
      apiKey: "foo",
      baseURL: new URL("https://bar.com"),
    });
    nock("https://bar.com")
      .get("/?apikey=foo&plot=full&r=json&t=The%20Toxic%20Avenger")
      .replyWithFile(200, path.join(__dirname, "/data/toxic-avenger.json"));

    return assert.eventually.propertyVal(
      cli.get({
        name: "The Toxic Avenger",
      }),
      "title",
      "The Toxic Avenger",
      "ensuring that we got a movie from bar.com"
    );
  });

  it("uses a new baseURL when configured for search", () => {
    const cli = new imdb.Client({
      apiKey: "foo",
      baseURL: new URL("https://bar.com"),
    });
    nock("https://bar.com")
      .get("/?apikey=foo&page=1&r=json&s=Toxic%20Avenger")
      .replyWithFile(
        200,
        path.join(__dirname, "/data/toxic-avenger-search.json")
      );

    return assert.eventually.nestedPropertyVal(
      cli.search({
        name: "Toxic Avenger",
      }),
      "results[0].title",
      "The Toxic Avenger",
      "ensuring that we got a movie from bar.com"
    );
  });
});
