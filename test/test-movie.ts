import nodeunit = require('nodeunit');
import imdb = require('../lib/imdb.js');

const orig_movie = {
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
    Response: "ok"
};

const orig_tv = {
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
    Type: "tvshow",
    totalSeasons: "5",
    Response: "ok"
};

const orig_episode = {
    Title: "ep 1",
    Released: "6 May 2001",
    Episode: "1",
    Type: "series",
    imdbRating: "5.6",
    imdbID: "tt6539212"
};

module.exports = nodeunit.testCase({
    "Create a normal movie": function(test: nodeunit.Test) {
        const mov = new imdb.Movie(orig_movie);

        test.ok(mov, "movie exists");
        test.deepEqual(mov.title, "Foo", "name is set correctly");
        test.deepEqual(mov.released, new Date(2001, 4, 1), "Date created correctly");
        test.deepEqual(mov.rating, 6.7);
        test.deepEqual(mov.genres, orig_movie.Genre, "Genres set correctly");
        test.deepEqual(mov.languages, orig_movie.Language, "Language set correctly");
        test.deepEqual(mov.votes, 5, "votes set correctly");
        test.deepEqual(mov.series, false, "not a series");
        test.deepEqual(mov.imdburl, "https://www.imdb.com/title/tt653921", "url formulated correctly");
        test.done();
    },
    "Create a series": function(test: nodeunit.Test) {
        const mov = new imdb.TVShow(orig_tv, { apiKey: "foo" });

        test.ok(mov, "movie exists");
        test.deepEqual(mov.title, "Foo", "name is set correctly");
        test.deepEqual(mov.released, new Date(2001, 4, 1), "Date created correctly");
        test.deepEqual(mov.rating, 6.7);
        test.deepEqual(mov.genres, orig_tv.Genre, "Genres set correctly");
        test.deepEqual(mov.languages, orig_tv.Language, "Language set correctly");
        test.deepEqual(mov.votes, 5, "votes set correctly");
        test.deepEqual(mov.series, true, "deffo a series");
        test.deepEqual(mov.imdburl, "https://www.imdb.com/title/tt653921", "url formulated correctly");
        test.deepEqual(mov.start_year, 1996, "test start year");
        test.deepEqual(mov.end_year, 1998, "end year set correctly");
        test.deepEqual(mov.totalseasons, 5, "total seasons set correctly");

        test.done();
    },
    "Create a basic episode": function(test: nodeunit.Test) {
        const ep = new imdb.Episode(orig_episode, 1);

        test.ok(ep, "ep exists");
        test.deepEqual(ep.name, "ep 1", "title is set correctly");
        test.deepEqual(ep.rating, 5.6, "rating set correctly");
        test.deepEqual(ep.imdbid, "tt6539212", "imdb id set");
        test.deepEqual(ep.released, new Date(2001, 4, 6), "Date created correctly");
        test.deepEqual(ep.season, 1, "testing season");
        test.deepEqual(ep.episode, 1, "testing ep");
        test.done();
    },
    "Movie with invalid score": function(test: nodeunit.Test) {
        const mov = Object.assign(orig_movie, {imdbRating: 'foo'});
        test.throws(new imdb.Movie(mov), TypeError);
        test.done();
    },
    "Movie with bad release data": function(test: nodeunit.Test) {
        const mov = Object.assign(orig_movie, {Released: 'foo'});
        test.throws(new imdb.Movie(mov), TypeError);
        test.done();
    },
    "Movie with no year": function(test: nodeunit.Test) {
        let mov = Object.assign(orig_movie);
        delete mov.Year;
        test.ok(! new imdb.Movie(mov).year);
        test.done();
    },
    "Movie with invalid year": function(test: nodeunit.Test) {
        const mov = Object.assign(orig_movie, {Year: 'foo'});
        test.throws(new imdb.Movie(mov), TypeError);
        test.done();
    },
    "Movie with matching year": function(test: nodeunit.Test) {
        for (let year of ["2005-2006", "2005-", "2005–2006", "2005–"]) {
            const mov = Object.assign(orig_movie, {Year: year});
            test.ok(! new imdb.Movie(mov).year);
        }
        test.done();
    }
});
