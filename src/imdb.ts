import ky from "ky-universal";
import URLSearchParams from "@ungap/url-search-params";
import {
  assertGetResponse,
  assertSearchResponse,
  assertEpisodeSeasonResponse,
  isEpisode,
  isError,
  isGame,
  isMovie,
  isTvshow,
  OmdbEpisode,
  OmdbError,
  OmdbGetResponse,
  OmdbSearch,
  OmdbSearchResult,
  OmdbSeason,
  OmdbTvshow,
} from "./interfaces";

/**
 * @hidden
 */
const omdbapi = new URL("https://www.omdbapi.com");

/**
 * Options to manipulate movie fetching. These can be passed to {@link get}, {@link search}
 * or the constructor for {@link Client}.
 */
export interface MovieOpts {
  /**
   * API key for omdbapi. Needed to make any API calls.
   *
   * Get one [here](https://www.patreon.com/posts/api-is-going-10743518)
   */
  apiKey?: string;

  /**
   * Timeout in milliseconds to wait before giving up on a request
   */
  timeout?: number;

  /**
   * Base URL to connect to (default: https://www.omdbapi.com)
   */
  baseURL?: string | URL;
}

/**
 * An explicit request for a movie. Does not do searching, this is meant
 * to specify *one* movie.
 *
 * One of {@link name} or {@link id} *MUST* be requested. {@link year} can be used to ensure
 * that the movie you're looking for is selected in the case that there exists
 * more than one movie with the same name.
 *
 * {@link short_plot} can be used to specify whether or not a short or a long plot
 * description is returned with your movie. Default is to return a full plot.
 */
export interface MovieRequest {
  /**
   * Name of the movie
   *
   * Unfortunately, only English names are supported
   * by omdb at the moment.
   */
  name?: string;

  /**
   * imdb id of the movie
   */
  id?: string;

  /**
   * Year that the movie was released
   */
  year?: number;

  /**
   * Whether or not to request a short plot. Default is full plot.
   */
  short_plot?: boolean; // eslint-disable-line camelcase
}

/**
 * Type of media we're searching for
 */
export type RequestType = "movie" | "series" | "episode" | "game";

function isRequestType(reqtype: string): reqtype is RequestType {
  if (
    reqtype === "movie" ||
    reqtype === "series" ||
    reqtype === "episode" ||
    reqtype === "game"
  ) {
    return true;
  }

  return false;
}

/**
 * A search for a movie. This will fetch multiple results based on fuzzy matches
 * for a particular piece of media.
 */
export interface SearchRequest {
  /**
   * Title of the media that we're looking for. Unfortunately, only English
   * names are supported by omdb at the moment.
   */
  name: string;

  /**
   * Type of media we're looking for
   */
  reqtype?: RequestType;

  /**
   * Year that the media was released
   */
  year?: number;
}

/**
 * @hidden
 */
function reqtoqueryobj(
  req: SearchRequest,
  apikey: string,
  page: number
): URLSearchParams {
  const r = new URLSearchParams({
    apikey,
    s: req.name,
    page: String(page),
    r: "json",
  });

  if (req.year !== undefined) {
    r.append("y", String(req.year));
  }

  if (req.reqtype !== undefined) {
    r.append("type", String(req.reqtype));
  }

  return r;
}

/**
 * Rating for a piece of media.
 */
export class Rating {
  /** Site where the rating came from */
  public source: string;

  /** Rating that the media got from the @{link Rating.source} */
  public value: string;

  constructor(source: string, value: string) {
    this.source = source;
    this.value = value;
  }
}

/**
 * A movie as returned by {@link get}, {@link search}, or any of the methods
 * from {@link Client}. This is not meant to be created directly by consumers of
 * this lib, but instead through querying omdb.
 */
export class Movie {
  /** id of the movie on imdb */
  public imdbid: string;

  /** direct URL to the movie on imdb */
  public imdburl: string;

  /** the genres that this movie belongs to */
  public genres: string;

  /** languages this movie was released in */
  public languages: string;

  /** countries this movie was released in */
  public country: string;

  /** votes received on imdb */
  public votes: string;

  /** whether or not this is a TV series */
  public series: boolean;

  /** the rating as it appears on imdb */
  public rating: number;

  /** the runtime of the movie */
  public runtime: string;

  /** the title of the movie in English */
  public title: string;

  /** year the movie was released */
  public year: number;

  /** type of media (see {@link RequestType}) */
  public type: RequestType;

  /** link to the poster for this movie */
  public poster: string;

  /** score from a bunch of different review sites */
  public metascore: string;

  /** the plot (can either be long or short as specified in {@link MovieRequest}) */
  public plot: string;

  /** what the movie was rated in its country of release */
  public rated: string;

  /** the directors of the movie */
  public director: string;

  /** writers of the movie */
  public writer: string;

  /** leading actors that starred in the movie */
  public actors: string;

  /** date that the movie was originally released */
  public released?: Date;

  /** title of the movie */
  public name: string;

  /** awards won */
  public awards: string;

  /** website for the movie */
  public website?: string;

  /** ratings for the media from various sources */
  public ratings: Rating[];

  /** date of the DVD release */
  public dvd?: Date;

  /** Production studio */
  public production?: string;

  /** Box office earnings */
  public boxoffice?: string;

  /**
   * @hidden
   */
  protected _yearData: string;

  /**
   * This takes a result from omdb, and transforms it into an
   * object consumable by customers of imdb-api.
   *
   * This isn't meant for direct consumption by API consumers,
   * and consumers should look at {@link get}, {@link search} or
   * any of the methods on {@link Client} to get a movie instead.
   *
   * @param obj Results from omdb
   */
  constructor(obj: OmdbGetResponse) {
    this.ratings = [];

    this.title = obj.Title;

    this.year = 0;
    this._yearData = "";
    if (obj.Year !== undefined) {
      this._yearData = obj.Year;
      // check for emdash as well
      if (!obj.Year.match(/\d{4}[-–](?:\d{4})?/)) {
        const rawYear = parseInt(obj.Year, 10);
        if (isNaN(rawYear)) {
          throw new TypeError("invalid year");
        }
        this.year = rawYear;
      } else {
        this.year = 0;
      }
    }

    this.rated = obj.Rated;

    const rawReleased = new Date(obj.Released);
    if (isNaN(rawReleased.getTime())) {
      this.released = undefined;
    } else {
      this.released = rawReleased;
    }

    this.runtime = obj.Runtime;
    this.genres = obj.Genre;
    this.director = obj.Director;
    this.writer = obj.Writer;
    this.actors = obj.Actors;
    this.plot = obj.Plot;
    this.languages = obj.Language;
    this.country = obj.Country;
    this.awards = obj.Awards;
    this.poster = obj.Poster;
    this.metascore = obj.Metascore;

    const rawRating = parseFloat(obj.imdbRating);
    this.rating = isNaN(rawRating) ? 0 : rawRating;

    this.votes = obj.imdbVotes;
    this.imdbid = obj.imdbID;

    // obj.Type only undefined on episodes
    this.type = "episode";
    if (obj.Type !== undefined) {
      if (!isRequestType(obj.Type)) {
        throw new TypeError(`${obj.Type} is not a valid RequestType`);
      }
      this.type = obj.Type;
    }

    if (obj.Ratings !== undefined) {
      for (const rating of obj.Ratings) {
        this.ratings.push(new Rating(rating.Source, rating.Value));
      }
    }

    if (obj.DVD !== undefined) {
      const rawDvd = new Date(obj.DVD);
      if (isNaN(rawDvd.getTime())) {
        this.dvd = undefined;
      } else {
        this.dvd = rawDvd;
      }
    }

    this.boxoffice = obj.BoxOffice;
    this.production = obj.Production;
    this.website = obj.Website;

    this.name = this.title;
    this.series = this.type === "series";
    this.imdburl = `https://www.imdb.com/title/${this.imdbid}`;
  }
}

/**
 * An episode as returned by {@link TVShow.episodes}. This is not intended to be
 * instantiated by an API consumer, but instead from results from omdb.
 */
export class Episode extends Movie {
  /** what season this episode is a part of */
  public season: number;

  /** what number episode in the season this episode is */
  public episode: number;

  /** what series this episode is a part of (imdbid) */
  public seriesid: string;

  /**
   * Creates an epsiode from results from omdb. This is not intended for consumer use.
   * Please prefer {@link TVShow.epsiodes}.
   *
   * @param obj Episodes fetched from omdb
   * @param season Which season this episode belongs to
   *
   * @throws TypeError when the episode number is invalid
   */
  constructor(obj: OmdbEpisode, season?: number) {
    super(obj);

    if (season !== undefined) {
      this.season = season;
    } else {
      this.season = parseInt(obj.Season, 10);
      if (isNaN(this.season)) {
        throw new TypeError("invalid season");
      }
    }

    this.seriesid = obj.seriesID;

    if ("Episode" in obj) {
      this.episode = parseInt(obj.Episode, 10);
      if (isNaN(this.episode)) {
        throw new TypeError("invalid episode");
      }
    } else {
      this.episode = 0;
    }
  }
}

/**
 * A TVShow as returned from {@link get}, {@link search} or any of the methods from
 * {@link Client}. This is not intended to be directly created by consumers of this
 * library
 */
export class TVShow extends Movie {
  /** year this show started */
  public start_year: number; // eslint-disable-line camelcase

  /** year this show ended if it's ended */
  public end_year?: number; // eslint-disable-line camelcase

  /** how many seasons this show ran */
  public totalseasons: number;

  /**
   * @hidden
   */
  private _episodes: Episode[] = [];

  /**
   * @hidden
   */
  private opts: MovieOpts;

  /**
   * @hidden
   */
  private baseURL: URL;

  /**
   * Creates a new {@link TVShow} from omdb results. This isn't intended to be
   * used by consumers of this library, instead see {@link get}, {@link search}
   * or any methods from {@link Client}.
   *
   * @param obj The tv show info we got from omdb
   * @param opts Options that we used to fetch this TVShow, so we can use
   * them to fetch episodes
   */
  constructor(obj: OmdbTvshow, opts: MovieOpts) {
    super(obj);
    const years = this._yearData.split("-");
    this.start_year = parseInt(years[0], 10);
    this.end_year = parseInt(years[1], 10) ? parseInt(years[1], 10) : undefined;
    this.totalseasons = parseInt(obj.totalSeasons, 10);
    this.opts = opts;
    if (opts.baseURL && typeof opts.baseURL === "string") {
      opts.baseURL = new URL(opts.baseURL);
      this.baseURL = opts.baseURL;
    } else if (opts.baseURL && opts.baseURL instanceof URL) {
      this.baseURL = opts.baseURL;
    } else {
      this.baseURL = omdbapi;
    }
  }

  /**
   * Fetches episodes of a TV show
   *
   * @return Promise yielding list of episodes
   */
  public episodes(): Promise<Episode[]> {
    if (this._episodes.length !== 0) {
      return Promise.resolve(this._episodes);
    }

    if (this.opts.apiKey === undefined) {
      throw new ImdbError("Missing api key in opts");
    }

    const funcs = [];
    for (let i = 1; i <= this.totalseasons; i++) {
      const qs = new URLSearchParams({
        Season: String(i),
        apikey: this.opts.apiKey,
        i: this.imdbid,
        r: "json",
      });
      const reqopts = {
        searchParams: qs,
        headers: {
          "Content-Type": "application/json",
        },
        timeout: undefined as number | undefined,
        prefixUrl: this.baseURL,
      };

      if (this.opts.timeout !== undefined) {
        reqopts.timeout = this.opts.timeout;
      }

      funcs.push(ky("", reqopts).json());
    }

    const prom = Promise.all(funcs)
      .then((result: unknown) => {
        if (assertEpisodeSeasonResponse(result)) {
          return Promise.resolve(result);
        }

        return Promise.reject(new TypeError("Invalid response from server"));
      })
      .then((epData: OmdbSeason[] | OmdbError[]) => {
        const eps: Episode[] = [];

        for (const datum of epData) {
          if (isError(datum)) {
            throw new ImdbError(datum.Error);
          }

          const season = parseInt(datum.Season, 10);
          for (const ep of datum.Episodes) {
            eps.push(new Episode(ep, season));
          }
        }

        this._episodes = eps;

        return Promise.resolve(eps);
      });

    return prom;
  }
}

export class Game extends Movie {}

/**
 * A single search result from either {@link search} or {@link Client.search}.
 * This is not intended to be directly created by api consumers.
 */
export class SearchResult {
  /** name of the movie */
  public title: string;

  /** name of the movie */
  public name: string;

  /** year the movie was released */
  public year: number;

  /** imdb id of the movie */
  public imdbid: string;

  /** type of media we found */
  public type: RequestType;

  /** link to the poster for this movie */
  public poster: string;

  constructor(obj: OmdbSearchResult) {
    this.title = obj.Title;
    this.year = parseInt(obj.Year, 10);
    this.imdbid = obj.imdbID;

    if (!isRequestType(obj.Type)) {
      throw new TypeError(`${obj.Type} is not a valid RequestType`);
    }

    this.type = obj.Type;

    this.poster = obj.Poster;
    this.name = this.title;
  }
}

/**
 * A single page of {@link SearchResult}s. You can call {@link SearchResults.next} to fetch
 * the next page of results. This is not intended to be created by an API consumer, but instead
 * to be returned by {@link search} or {@link Client.search}.
 */
export class SearchResults {
  public results: SearchResult[] = [];

  public totalresults: number;

  /**
   * @hidden
   */
  private page: number;

  /**
   * @hidden
   */
  private opts: MovieOpts;

  /**
   * @hidden
   */
  private req: SearchRequest;

  /**
   * Builds a new {@link SearchResults}. Not intended to be called directly by
   * API consumers, as it only creates the object from omdb results.
   *
   * @param obj Search results from omdb
   * @param page Page number we're fetching
   * @param opts Stored options from our initial request
   * @param req A reference to the original request
   */
  constructor(
    obj: OmdbSearch,
    page: number,
    opts: MovieOpts,
    req: SearchRequest
  ) {
    this.page = page;
    this.req = req;
    this.opts = opts;

    for (const result of obj.Search) {
      this.results.push(new SearchResult(result));
    }

    this.totalresults = parseInt(obj.totalResults, 10);
  }

  /**
   * Returns the next page of search results
   *
   * @return next page of search results
   */
  public next(): Promise<SearchResults> {
    return search(this.req, this.opts, this.page + 1);
  }
}

export class ImdbError {
  public name = "imdb api error";

  constructor(public message: string) {}
}

/**
 * Fetches a single movie by arbitrary criteria
 *
 * @param req set of requirements to search for
 * @param opts options that modify a search
 *
 * @return a promise yielding a movie
 */
export function get(req: MovieRequest, opts: MovieOpts): Promise<Movie> {
  try {
    return new Client(opts).get(req);
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Searches for a movie by arbitrary criteria
 *
 * @param req set of requirements to search for
 * @param opts options that modify a search
 * @param page page number to return
 *
 * @return a promise yielding search results
 */
export function search(
  req: SearchRequest,
  opts: MovieOpts,
  page?: number
): Promise<SearchResults> {
  return new Client(opts).search(req, page);
}

/**
 * A client for fetching imdb information.
 *
 * This is primarly useful for making many requests without having
 * to pass a {@link MovieOpts} object to the same function over and
 * over again.
 *
 * All methods still accept an optional {@link MovieOpts} object in
 * the case that you want to override one or more of the options.
 * These per-method options are merged with the options that are
 * attached to the object, and override the object-local options.
 *
 * ```javascript
 * const cli = new imdb.Client({apiKey: 'xxxxxx', timeout: 30000});
 * cli.get({name: "The Toxic Avenger"}).then((movie) => {
 *   console.log(movie.title);
 * });
 *
 * cli.search({name: "The Toxic Avenger"}).then((search) => {
 *   for (let result of search.results) {
 *     console.log(result.title);
 *   }
 * });
 * ```
 */
export class Client {
  /**
   * @hidden
   */
  private opts: MovieOpts;

  /**
   * @hidden
   */
  private baseURL: URL;

  /**
   * Creates a new {@link Client} object.
   *
   * @param opts A set of {@link MovieOpts} that will be applied to all
   * requests made by this object unless overridden.
   *
   * @throws {@link ImdbError} if an invalid {@link MovieOpts} is passed
   */
  constructor(opts: MovieOpts) {
    if (!Object.prototype.hasOwnProperty.call(opts, "apiKey")) {
      throw new ImdbError("Missing api key in opts");
    }
    this.opts = opts;
    if (opts.baseURL && typeof opts.baseURL === "string") {
      opts.baseURL = new URL(opts.baseURL);
      this.baseURL = opts.baseURL;
    } else if (opts.baseURL && opts.baseURL instanceof URL) {
      this.baseURL = opts.baseURL;
    } else {
      this.baseURL = omdbapi;
    }
  }

  /**
   * Fetches a single movie by arbitrary criteria
   *
   * @param req set of requirements to search for
   * @param opts options that override the {@link Client}'s options
   *
   * @return a promise yielding a movie
   */
  public get(req: MovieRequest, opts?: MovieOpts): Promise<Movie> {
    const mergedOpts = this.mergeOpts(opts);
    if (mergedOpts.apiKey === undefined) {
      throw new ImdbError("Missing api key in opts");
    }

    const qs = new URLSearchParams({
      apikey: mergedOpts.apiKey,
      plot: req.short_plot ? "short" : "full",
      r: "json",
    });

    if (req.year !== undefined) {
      qs.append("y", String(req.year));
    }

    if (req.name) {
      qs.append("t", req.name);
    } else if (req.id) {
      qs.append("i", req.id);
    } else {
      return Promise.reject(new ImdbError("Missing one of req.id or req.name"));
    }

    const reqopts = {
      headers: {
        "Content-Type": "application/json",
      },
      searchParams: qs,
      timeout: undefined as number | undefined,
      prefixUrl: this.baseURL,
    };

    if ("timeout" in mergedOpts) {
      reqopts.timeout = mergedOpts.timeout;
    }

    const prom = ky("", reqopts)
      .json()
      .then((response: unknown) => {
        if (assertGetResponse(response)) {
          return Promise.resolve(response);
        }

        return Promise.reject(new TypeError("Invalid response from server"));
      })
      .then((data: OmdbGetResponse | OmdbError) => {
        let ret: Movie | Episode;
        if (isError(data)) {
          throw new ImdbError(`${data.Error}: ${req.name ? req.name : req.id}`);
        }

        if (isMovie(data)) {
          ret = new Movie(data);
        } else if (isGame(data)) {
          ret = new Game(data);
        } else if (isTvshow(data)) {
          ret = new TVShow(data, mergedOpts);
        } else if (isEpisode(data)) {
          ret = new Episode(data);
        } else {
          throw new ImdbError(`type: '${data.Type}' is not valid`);
        }

        return Promise.resolve(ret);
      });

    return prom;
  }

  /**
   * Searches for a movie by arbitrary criteria
   *
   * @param req set of requirements to search for
   * @param opts options that override the {@link Client}'s options
   * @param page page number to return
   *
   * @return a promise yielding search results
   */
  public search(
    req: SearchRequest,
    page?: number,
    opts?: MovieOpts
  ): Promise<SearchResults> {
    const mergedOpts = this.mergeOpts(opts);
    if (page === undefined) {
      page = 1;
    }

    if (mergedOpts.apiKey === undefined) {
      throw new ImdbError("Missing api key in opts");
    }

    const qs = reqtoqueryobj(req, mergedOpts.apiKey, page);
    const reqopts = {
      searchParams: qs,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: undefined as number | undefined,
      prefixUrl: this.baseURL,
    };

    if (mergedOpts.timeout) {
      reqopts.timeout = mergedOpts.timeout;
    }

    const prom = ky("", reqopts)
      .json()
      .then((response: unknown) => {
        if (assertSearchResponse(response)) {
          return Promise.resolve(response);
        }

        return Promise.reject(new TypeError("Invalid response from server"));
      })
      .then((data: OmdbSearch | OmdbError) => {
        if (isError(data)) {
          throw new ImdbError(`${data.Error}: ${req.name}`);
        }

        if (page === undefined) {
          page = 0;
        }

        return Promise.resolve(new SearchResults(data, page, mergedOpts, req));
      });

    return prom;
  }

  /**
   * @hidden
   */
  private mergeOpts(opts?: MovieOpts): MovieOpts {
    if (opts !== undefined) {
      return { ...this.opts, ...opts };
    }

    return { ...this.opts };
  }
}
