export interface OmdbMovie {
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
    Type: string;
    Response: string;
}

export interface OmdbTvshow {
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
    Type: string;
    Response: string;

    totalSeasons: string;
}

export interface OmdbEpisode {
    Title: string;
    Released: string;
    Episode: string;
    imdbRating: string;
    imdbID: string;
}

export interface OmdbSeason {
    Title: string;
    Season: string;
    totalEpisodes: string;
    Episodes: OmdbEpisode[];
    Response: string;
}

export interface OmdbError {
    Response: string;
    Error: string;
}

export function isError(response: OmdbSeason | OmdbTvshow | OmdbMovie | OmdbError): response is OmdbError {
    return response.Response === "False";
}

export function isTvshow(response: OmdbMovie | OmdbTvshow): response is OmdbTvshow {
    return response.Type === "series";
}

export function isMovie(response: OmdbMovie | OmdbTvshow): response is OmdbTvshow {
    return response.Type === "movie";
}
