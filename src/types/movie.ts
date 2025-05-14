
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface ContentItem {
  id: number;
  title?: string;  // for movies
  name?: string;   // for TV shows
  first_air_date?: string;  // for TV shows
  poster_path: string;
  backdrop_path: string;
  release_date: string; // Movie release_date or TV first_air_date
  overview: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface ContentDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genres: Genre[];
  runtime?: number; // minutes (movies only)
  number_of_seasons?: number; // TV shows only
  streaming_providers: StreamingProvider[];
  trailer_key?: string; // YouTube video key
  media_type: 'movie' | 'tv';
}

export type MoodType = 
  | 'happy'
  | 'sad'
  | 'excited'
  | 'relaxed'
  | 'romantic'
  | 'scared'
  | 'thoughtful';

export interface MoodOption {
  id: MoodType;
  label: string;
  description: string;
  icon: string;
}
