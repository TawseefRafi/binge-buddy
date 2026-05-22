export interface Movie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  runtime: number | null;
  genres: string[];
  directors: string[];
  directors_list?: { id: number; name: string; profile_path: string | null }[];
  cast: { id: number; name: string; character: string; profile_path: string | null }[];
  origin_country: string[];
  spoken_languages: string[];
  vote_average: number;
  vote_count: number;
  status: 'watchlist' | 'watched' | 'none';
  user_rating?: number;
  user_review?: string;
  media_type: 'movie' | 'tv';
  similar?: any[];
  recommendations?: any[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline?: string;
  date_added?: string;
  date_watched?: string;
  imdb_id?: string;
}

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  overview?: string;
}

export interface Genre {
  id: number;
  name: string;
}
