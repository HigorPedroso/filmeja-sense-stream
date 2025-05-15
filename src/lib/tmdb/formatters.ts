
import { ContentItem } from "@/types/movie";

// Format TMDB movie data to ContentItem
export function formatMovieToContentItem(movie: any): ContentItem {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    overview: movie.overview,
    vote_average: movie.vote_average,
    media_type: 'movie',
    genre_ids: movie.genre_ids,
    genres: movie.genres || [] // Add empty array as default
  };
}

// Format TMDB TV show data to ContentItem
export function formatTVShowToContentItem(tvShow: any): ContentItem {
  return {
    id: tvShow.id,
    title: tvShow.name,
    poster_path: tvShow.poster_path,
    backdrop_path: tvShow.backdrop_path,
    release_date: tvShow.first_air_date,
    overview: tvShow.overview,
    vote_average: tvShow.vote_average,
    media_type: 'tv',
    genre_ids: tvShow.genre_ids,
    genres: tvShow.genres || [] // Add empty array as default
  };
}
