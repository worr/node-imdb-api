# Version 4.0.3

* Documentation fixes
* Dependency bumps

# Version 4.0.0 -> 4.0.1/4.0.2

* Fixes #63, #65 - Be more tolerant of bad data

# Version 3.1.2 -> 4.0.0

* Removed callback api
* Created a client object so that applications can re-use options (Fixes #61)
* Added short plot summary (Fixes #55, #37)
* Episode now inherits from Movie, like everything else
* Much more data validation on responses
* Fix broken rating conversion
* Drop support for unsupported node versions
* Convert tests to typescript
* Remove utils module
* Remove `MovieOpts` from `MovieRequest` and have it be a separate arg to `get`
* Changed `SearchRequest.title` to `SearchRequest.name` to unify interface
* Specify types for `TVShow.totalseasons`, `TVShow.start_year` and `TVShow.end_year`

# Version 3.1.1 -> 3.1.2

* Fixes #54
* Fixes #51
* lots of modernization and enabling of tslint

# Version 3.0.0 -> 3.1.0

This adds searching for movies and items from omdb.

```js
imdb.search({title: 'foo'}, {apiKey: 'bar'}).then(console.log);
```

This also adds supports for timeouts

```js
imdb.get('The Toxic Avenger', {apiKey: 'foo', timeout: 30}).then(console.log);
```

# Version 2.2.2 -> 3.0.0

This is a breaking change

* Added support for passing in options to all `get` functions
* Require an apiKey option for authentication to omdb

```js
imdb.get('The Toxic Avenger', {apiKey: 'foo'}).then(function(data) { console.log(data); });
```

To see more about getting a key, see [here](https://www.patreon.com/posts/api-is-going-10743518)

# Version 2.2.1 -> 2.2.2

* Fixed broken date parsing ([PR](https://github.com/worr/node-imdb-api/pull/41))

# Version 2.2.0 -> 2.2.1

* Bug fixes

# Version 2.1.0 -> 2.2.0

* Added promise API

## Promises

```js
imdb.get('The Toxic Avenger').then(function(data) { console.log(data); });
```

# Version 2.0.0 -> 2.1.0

* Adds the ability to filter by year

## Filtering by year

```js
imdb.getReq({name: 'James Bond', year: 2015}, function(err, data) { console.log(data) });
```

# Version 1.3.3 -> 2.0.0

Version 2.0 is a breaking change. The APIs that I was using disappeared, and I
switched over to using omdb. Most of the functions and the objects returned
are similar, with some additional properties (and some removed).

## Removed properties

The following properties have been removed from all movie/tv show/episode
objects that are returned to callbacks.

* `stv`
* `usascreens`
* `ukscreens`

## Renamed properties

The following properties have been renamed in order to not conflict with
builtins or to better describe what the property means

* `Episode.number` -> `Episode.episode`

## Retyped properties

Some properties have new types for convenience.

* `Episode.released`: `string` -> `Date`
* `Movie.released`: `string` -> `Date`
* `Movie.series`: `number` -> `boolean`

## Changed callback signatures

* The `episodes` call now just passes a list of episodes to the callback
