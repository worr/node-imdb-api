# node-imdb-api

A non-scraping, functional node.js interface to imdb

# Badges

[![NPM version](https://badge.fury.io/js/imdb-api.png)](http://badge.fury.io/js/imdb-api)

[![Build Status](https://travis-ci.org/worr/node-imdb-api.png?branch=master)](https://travis-ci.org/worr/node-imdb-api)

[![Flattr Button](http://api.flattr.com/button/button-compact-static-100x17.png "Flattr This!")](https://flattr.com/submit/auto?user_id=worr&url=https%3A%2F%2Fgithub.com%2Fworr%2Fnode-imdb-api%2F "node-imdb-api")

# Installation:
```bash
npm install --save imdb-api
```

# Upgrading from 1.3.3?

Many things have changed. Read the [changelog](CHANGELOG.md)

# Use

Get an imdb object:

    var imdb = require('imdb-api');

Call get/getReq/getById

    var movie;
    imdb.getReq({ name: 'The Toxic Avenger' }, function(err, things) {
        movie = things;
    });
    
    // Promises!
    imdb.get('The Toxic Avenger').then(function(data) { console.log(data) });
    imdb.getById('tt0090190).then(function(data) { console.log(data) });
    imdb.getReq({ name: 'The Toxic Avenger' }).then(function(data) { console.log(data) });

DATA

    console.log(movie);

    Movie {
      title: 'The Toxic Avenger',
      _year_data: '1984',
      rated: 'R',
      released: 1986-04-11T08:00:00.000Z,
      runtime: '82 min',
      genres: 'Action, Comedy, Horror',
      director: 'Michael Herz, Lloyd Kaufman',
      writer: 'Lloyd Kaufman (story), Joe Ritter (screenplay), Lloyd Kaufman (additional material), Gay Partington Terry (additional material), Stuart Strutin (additional material)',
      actors: 'Andree Maranda, Mitch Cohen, Jennifer Babtist, Cindy Manion',
      plot: 'This is the story of Melvin, the Tromaville Health Club mop boy, who inadvertently and naively trusts the hedonistic, contemptuous and vain health club members, to the point of accidentally ending up in a vat of toxic waste. The devastating results then have a transmogrification effect, his alter ego is released, and the Toxic Avenger is born, to deadly and comical results. The local mop boy is now the local Superhero, the saviour of corruption, thuggish bullies and indifference. Troma classic with good make-up effects and stunts, a pleasant surprise indeed.',
      languages: 'English',
      country: 'USA',
      awards: '1 nomination.',
      poster: 'http://ia.media-imdb.com/images/M/MV5BNzViNmQ5MTYtMmI4Yy00N2Y2LTg4NWUtYWU3MThkMTVjNjk3XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg',
      metascore: 'N/A',
      rating: '6.2',
      votes: '19,306',
      imdbid: 'tt0090190',
      type: 'movie',
      response: 'True',
      series: false,
      imdburl: 'https://www.imdb.com/title/tt0090190' }

Furthermore if you already know the id you can call getReq with different args:

    var movie;
    imdb.getReq({ id: '0090190' }, function(err, things) {
        movie = things;
    });

DATA

    console.log(movie);

    Movie {
      title: 'The Toxic Avenger',
      _year_data: '1984',
      rated: 'R',
      released: 1986-04-11T08:00:00.000Z,
      runtime: '82 min',
      genres: 'Action, Comedy, Horror',
      director: 'Michael Herz, Lloyd Kaufman',
      writer: 'Lloyd Kaufman (story), Joe Ritter (screenplay), Lloyd Kaufman (additional material), Gay Partington Terry (additional material), Stuart Strutin (additional material)',
      actors: 'Andree Maranda, Mitch Cohen, Jennifer Babtist, Cindy Manion',
      plot: 'This is the story of Melvin, the Tromaville Health Club mop boy, who inadvertently and naively trusts the hedonistic, contemptuous and vain health club members, to the point of accidentally ending up in a vat of toxic waste. The devastating results then have a transmogrification effect, his alter ego is released, and the Toxic Avenger is born, to deadly and comical results. The local mop boy is now the local Superhero, the saviour of corruption, thuggish bullies and indifference. Troma classic with good make-up effects and stunts, a pleasant surprise indeed.',
      languages: 'English',
      country: 'USA',
      awards: '1 nomination.',
      poster: 'http://ia.media-imdb.com/images/M/MV5BNzViNmQ5MTYtMmI4Yy00N2Y2LTg4NWUtYWU3MThkMTVjNjk3XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg',
      metascore: 'N/A',
      rating: '6.2',
      votes: '19,306',
      imdbid: 'tt0090190',
      type: 'movie',
      response: 'True',
      series: false,
      imdburl: 'https://www.imdb.com/title/tt0090190' }

How do I get series episodes?

Well, it's a promise (or a function that takes a callback).

    imdb.get('How I Met Your Mother').then(function(things) {
        things.episodes().then(function(data) {
            console.log(data);
        })
    });

    imdb.get('How I Met Your Mother', function(err, things) {
        things.episodes(function(err, moreThings) {
            console.log(moreThings);
        });
    });

    ...
    Episode {
      season: 2,
      name: 'The Scorpion and the Toad',
      released: 2006-10-25T07:00:00.000Z,
      episode: 2,
      rating: '8.3',
      imdbid: 'tt0869673' },
    Episode {
      season: 2,
      name: 'Brunch',
      released: 2006-11-01T08:00:00.000Z,
      episode: 3,
      rating: '8.6',
      imdbid: 'tt0873024' },
    Episode {
      season: 2,
      name: 'Ted Mosby, Architect',
      released: 2006-11-09T08:00:00.000Z,
      episode: 4,
      rating: '8.9',
      imdbid: 'tt0858000' },
    Episode {
      season: 2,
      name: 'World\'s Greatest Couple',
      released: 2006-11-16T08:00:00.000Z,
      episode: 5,
      rating: '8.8',
      imdbid: 'tt0866188' },
    Episode {
      season: 2,
      name: 'Aldrin Justice',
      released: 2006-11-23T08:00:00.000Z,
      episode: 6,
      rating: '8.2',
      imdbid: 'tt0865115' },
    ...

# FAQ

## Why? There are like 3 other interfaces to imdb in npm

Most of them scrape imdb. imdb explicitly forbids scarping.

And what happens when the site layout changes? Well then your screen scraping
solution fails in interesting ways. Screen scraping is also pretty slow,
and we can't have that.

## WOAH I looked at your code and you're using unofficial APIs!

There isn't an official API to imdb. As soon as one is released (and I
notice), I'll update the module.

imdb DOES release all of their data in text files nightly, so unofficial sites
have popped up providing RESTful APIs against that data.

I have to use a few, since none of them are complete.

## What if one of the unofficial APIs disappears?

File a bug. I'll get creative.
