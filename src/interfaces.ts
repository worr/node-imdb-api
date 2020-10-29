export interface OmdbRating {
  Source: string;
  Value: string;
}

export interface OmdbGetResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Website?: string;
  Ratings?: OmdbRating[];
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Type: string;
  Response: string;
}

export interface OmdbTvshow extends OmdbGetResponse {
  totalSeasons: string;
}

export interface OmdbEpisode extends OmdbGetResponse {
  Season: string;
  Episode: string;
  seriesID: string;
}

export interface OmdbSeason {
  Title: string;
  Season: string;
  totalSeasons: string;
  Episodes: OmdbEpisode[];
  Response: string;
}

export interface OmdbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearch {
  Search: OmdbSearchResult[];
  totalResults: string;
  Response: string;
}

export interface OmdbError {
  Response: string;
  Error: string;
}

export function isError(
  response: OmdbSearch | OmdbSeason | OmdbTvshow | OmdbGetResponse | OmdbError
): response is OmdbError {
  return response.Response === "False";
}

export function isTvshow(response: OmdbGetResponse): response is OmdbTvshow {
  return response.Type === "series";
}

export function isMovie(response: OmdbGetResponse): boolean {
  return response.Type === "movie";
}

export function isEpisode(response: OmdbGetResponse): response is OmdbEpisode {
  return response.Type === "episode";
}

export function isGame(response: OmdbGetResponse): boolean {
  return response.Type === "game";
}

export function assertEpisodeSeasonResponse(
  response: unknown
): response is OmdbSeason[] | OmdbError[] {
  if (!Array.isArray(response)) {
    return false;
  }

  for (const res of response) {
    if (typeof res !== "object") {
      return false;
    }

    if ("Response" in res) {
      if (res.Response === "False") {
        return true;
      }

      if ("Season" in res && "totalSeasons" in res) {
        return true;
      }
    }
  }

  return false;
}

export function assertGetResponse(
  response: unknown
): response is OmdbGetResponse | OmdbError {
  if (typeof response !== "object") {
    return false;
  }

  const res: any = response;
  if (res === null) {
    return false;
  }

  if ("Response" in res) {
    return true;
  }

  return false;
}

export function assertSearchResponse(
  response: unknown
): response is OmdbSearch | OmdbError {
  if (typeof response !== "object") {
    return false;
  }

  const res: any = response;
  if (res === null) {
    return false;
  }

  if ("Response" in res) {
    if (res.Response === "False") {
      return true;
    }
  }

  if ("Search" in res) {
    return true;
  }

  return false;
}
