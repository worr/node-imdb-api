# node-imdb-api

A non-scraping, functional node.js interface to imdb

# Badges

[![NPM version](https://badge.fury.io/js/imdb-api.svg)](http://badge.fury.io/js/imdb-api) [![Build Status](https://travis-ci.org/worr/node-imdb-api.svg?branch=master)](https://travis-ci.org/worr/node-imdb-api) [![Dependency Freshness](https://david-dm.org/worr/node-imdb-api.svg)](https://david-dm.org/worr/node-imdb-api) [![Coverage Status](https://coveralls.io/repos/github/worr/node-imdb-api/badge.svg?branch=master)](https://coveralls.io/github/worr/node-imdb-api?branch=master) [![Join the chat at https://gitter.im/worr/node-imdb-api](https://badges.gitter.im/worr/node-imdb-api.svg)](https://gitter.im/worr/node-imdb-api?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**NOTE ON GITTER**: I *am* online! I use the [matrix](matrix.org) bridge to talk on Gitter, so you'll see me talking through `MatrixBot`. Feel free to ask questions!

# API Docs

[API docs are now here](https://docs.worrbase.com/node/imdb-api/)

# Installation:
```bash
npm install --save imdb-api
```

# Use

Import the library using `require`

```js
const imdb = require('imdb-api')
```

or ES6 `import`

```js
import imdb from 'imdb-api'
```

Call `get` to get a single movie
```js
imdb.get({name: 'The Toxic Avenger'}, {apiKey: 'foo', timeout: 30000}).then(console.log).catch(console.log);

Movie {
  title: 'The Toxic Avenger',
  ...
}
```
Furthermore if you already know the id you can call `get` with different args:
```js
imdb.get({id: 'tt0090190'}, {apiKey: 'foo'}).then(console.log);

Movie {
  title: 'The Toxic Avenger',
  ...
}
```

You can search for movies, and get multiple results by using the `search` function.

```js
imdb.search({
  name: 'Toxic Avenger'
}, {
  apiKey: 'foo'
}).then(console.log).catch(console.log);
```

TV shows have an `episodes` method that you can use to fetch all of the episodes
from that TV series.

```js
imdb.get('How I Met Your Mother', {apiKey: 'foo'}).then((things) => {
    return things.episodes()
}).then((eps) => {
    console.log(eps);
});

Episode {
  season: 2,
  name: 'The Scorpion and the Toad',
  released: '2006-10-25T07:00:00.000Z',
  episode: 2,
  rating: '8.3',
  imdbid: 'tt0869673' },
...
```

# Using a `Client` object

`imdb-api` also exported a `Client` object that you can use to store options for subsequent requests.

```js
import imdb = require('imdb');
const cli = new imdb.Client({apiKey: 'xxxxxx'});
cli.get({'name': 'The Toxic Avenger'}).then(console.log);
```

`Client` also has a `search` method for searching.

```js
import imdb = require('imdb');
const cli = new imdb.Client({apiKey: 'xxxxxx'});
cli.search({'name': 'The Toxic Avenger'}).then((search) => {
  for (const result of search.results) {
    console.log(result.title);
  }
});
```

# FAQ

## I see an API key in your examples? Is it required? How do I get one?

Yes, it is required! omdb made this a requirement as of May 8, 2017. This is unfortunate,
but totally understandable. While I plan on working on finding an alternative to provide
the movie info you crave, I've enabled you to pass in an apikey.

You can get one by going [here](https://www.patreon.com/posts/api-is-going-10743518).

## Why? There are like 3 other interfaces to imdb in npm

Most of them scrape imdb. imdb explicitly forbids scraping.

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
