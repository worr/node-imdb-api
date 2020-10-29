import { describe, it } from "mocha";
import * as chai from "chai";
import * as imdb from "../lib/imdb";

const { assert } = chai;

const origMovie = {
  Title: "Foo",
  Year: "1996",
  Rated: "R",
  Released: "1 May 2001",
  Runtime: "5 min",
  Genre: "rom com",
  Director: "Tilde Swinton",
  Writer: "Tilde Swinton",
  Actors: "John, Larry, Curly",
  Plot: "It good",
  Language: "Spanish",
  Country: "USA",
  Awards: "Lots",
  Poster: "www.google.com",
  Metascore: "5.6",
  imdbRating: "6.7",
  imdbVotes: "5",
  imdbID: "tt653921",
  Type: "movie",
  Response: "ok",
};

const origTv = {
  Title: "Foo",
  Year: "1996-1998",
  Rated: "R",
  Released: "1 May 2001",
  Runtime: "5 min",
  Genre: "rom com",
  Director: "Tilde Swinton",
  Writer: "Tilde Swinton",
  Actors: "John, Larry, Curly",
  Plot: "It good",
  Language: "Spanish",
  Country: "USA",
  Awards: "Lots",
  Poster: "www.google.com",
  Metascore: "5.6",
  imdbRating: "6.7",
  imdbVotes: "5",
  imdbID: "tt653921",
  Type: "series",
  totalSeasons: "5",
  Response: "ok",
};

const origEpisode = {
  Title: "ep 1",
  Rated: "R",
  Released: "6 May 2001",
  Runtime: "5 min",
  Genre: "rom com",
  Director: "Tilde Swinton",
  Writer: "Tilde Swinton",
  Actors: "John, Larry, Curly",
  Plot: "It good",
  Language: "Spanish",
  Country: "USA",
  Awards: "Lots",
  Poster: "www.google.com",
  Metascore: "5.6",
  Episode: "1",
  Type: "episode",
  imdbRating: "5.6",
  imdbID: "tt6539212",
  imdbVotes: "17",
  Year: "2006",
  Season: "5",
  Response: "ok",
  seriesID: "tt1480055",
};

const origGame = {
  Title: "The Legend of Heroes: Trails of Cold Steel",
  Year: "2015",
  Rated: "N/A",
  Released: "22 Dec 2015",
  Runtime: "N/A",
  Genre: "Adventure",
  Director: "Valerie Arem",
  Writer: "N/A",
  Actors: "Edward Bosco, Ben Diskin, Lucien Dodge, D.C. Douglas",
  Plot: "N/A",
  Language: "English",
  Country: "USA",
  Awards: "N/A",
  Poster: "N/A",
  Ratings: [],
  Metascore: "N/A",
  imdbRating: "N/A",
  imdbVotes: "N/A",
  imdbID: "tt5591880",
  Type: "game",
  DVD: "N/A",
  BoxOffice: "N/A",
  Production: "N/A",
  Website: "N/A",
  Response: "True",
};

describe("Movie", () => {
  it("creates a normal movie", () => {
    const mov = new imdb.Movie(origMovie);

    assert.isOk(mov, "movie exists");
    assert.deepEqual(mov.title, "Foo", "name is set correctly");
    assert.deepEqual(
      mov.released,
      new Date(2001, 4, 1),
      "Date created correctly"
    );
    assert.deepEqual(mov.rating, 6.7);
    assert.deepEqual(mov.genres, origMovie.Genre, "Genres set correctly");
    assert.deepEqual(
      mov.languages,
      origMovie.Language,
      "Language set correctly"
    );
    assert.deepEqual(mov.votes, "5", "votes set correctly");
    assert.deepEqual(mov.series, false, "not a series");
    assert.deepEqual(
      mov.imdburl,
      "https://www.imdb.com/title/tt653921",
      "url formulated correctly"
    );
  });
  it("creates a movie with invalid rating", () => {
    const mov = Object.assign(Object.create(origMovie), {
      imdbRating: "N/A",
    });
    assert.equal(new imdb.Movie(mov).rating, 0);
  });
  it("creates a movie with bad release date", () => {
    const mov = Object.assign(Object.create(origMovie), {
      Released: "N/A",
    });
    assert.isUndefined(new imdb.Movie(mov).released);
  });
  it("creates a movie with no year", () => {
    const mov = Object.assign(Object.create(origMovie), {
      Year: undefined,
    });
    assert.isNotOk(new imdb.Movie(mov).year);
  });
  it("creates a movie with invalid year", () => {
    const mov = Object.assign(Object.create(origMovie), { Year: "foo" });
    assert.throws(() => new imdb.Movie(mov), TypeError);
  });
  it("creates a movie with matching year", () => {
    for (const year of ["2005-2006", "2005-", "2005–2006", "2005–"]) {
      const mov = Object.assign(Object.create(origMovie), {
        Year: year,
      });
      assert.isNotOk(new imdb.Movie(mov).year);
    }
  });
});

describe("Series", () => {
  it("creates a series", () => {
    const mov = new imdb.TVShow(origTv, { apiKey: "foo" });

    assert.isOk(mov, "movie exists");
    assert.deepEqual(mov.title, "Foo", "name is set correctly");
    assert.deepEqual(
      mov.released,
      new Date(2001, 4, 1),
      "Date created correctly"
    );
    assert.deepEqual(mov.rating, 6.7);
    assert.deepEqual(mov.genres, origTv.Genre, "Genres set correctly");
    assert.deepEqual(mov.languages, origTv.Language, "Language set correctly");
    assert.deepEqual(mov.votes, "5", "votes set correctly");
    assert.deepEqual(mov.series, true, "deffo a series");
    assert.deepEqual(
      mov.imdburl,
      "https://www.imdb.com/title/tt653921",
      "url formulated correctly"
    );
    assert.deepEqual(mov.start_year, 1996, "test start year");
    assert.deepEqual(mov.end_year, 1998, "end year set correctly");
    assert.deepEqual(mov.totalseasons, 5, "total seasons set correctly");
  });
  it("creates a series with invalid year", () => {
    const mov = Object.assign(Object.create(origTv), { Year: "foo-" });
    assert.throws(() => new imdb.TVShow(mov, { apiKey: "foo" }), TypeError);
  });
});

describe("Episode", () => {
  it("creates a basic episode", () => {
    const ep = new imdb.Episode(origEpisode, 1);

    assert.isOk(ep, "ep exists");
    assert.deepEqual(ep.name, "ep 1", "title is set correctly");
    assert.deepEqual(ep.rating, 5.6, "rating set correctly");
    assert.deepEqual(ep.imdbid, "tt6539212", "imdb id set");
    assert.deepEqual(
      ep.released,
      new Date(2001, 4, 6),
      "Date created correctly"
    );
    assert.deepEqual(ep.season, 1, "testing season");
    assert.deepEqual(ep.episode, 1, "testing ep");
    assert.deepEqual(ep.year, 2006, "testing year");
  });

  it("creates an episode with an invalid release", () => {
    const ep = Object.assign(Object.create(origTv), { Released: "foo" });
    assert.isUndefined(new imdb.Episode(ep, 30).released);
  });

  it("creates an episode with an invalid year", () => {
    const ep = Object.assign(Object.create(origTv), { Year: "foo" });
    assert.throws(() => new imdb.Episode(ep, 30), TypeError);
  });

  it("creates an episode with an invalid number", () => {
    const ep = Object.assign(Object.create(origTv), { Episode: "foo" });
    assert.throws(() => new imdb.Episode(ep, 30), TypeError);
  });
});

describe("Game", () => {
  it("creates a basic game", () => {
    const game = new imdb.Game(origGame);

    assert.isOk(game, "game exists");
    assert.deepEqual(game.name, "The Legend of Heroes: Trails of Cold Steel");
    assert.deepEqual(game.rating, 0);
    assert.deepEqual(game.imdbid, "tt5591880");
    assert.deepEqual(game.released, new Date(2015, 11, 22));
  });
});
