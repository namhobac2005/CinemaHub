import { API_BASE } from './booking';

const TMDB_BASE = `${API_BASE.replace(/\/$/, '')}/tmdb`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${TMDB_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export interface TMDBMovie {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  popularity: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  tmdbId: number;
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  trailerUrl: string | null;
  trailerKey: string | null;
  originalLanguage: string;
  spokenLanguages: Array<{ iso_639_1: string; name: string }>;
}

export const searchTMDBMovies = (query: string, language?: string) => {
  const params = new URLSearchParams({ query });
  if (language) params.set('language', language);
  return request<TMDBMovie[]>(`/search?${params.toString()}`);
};

export const getTMDBMovieDetails = (tmdbId: number, language?: string) => {
  const params = new URLSearchParams();
  if (language) params.set('language', language);
  const queryString = params.toString();
  return request<TMDBMovieDetails>(
    `/movie/${tmdbId}${queryString ? `?${queryString}` : ''}`
  );
};

export const getPopularMovies = (language?: string, page?: number) => {
  const params = new URLSearchParams();
  if (language) params.set('language', language);
  if (page) params.set('page', page.toString());
  const queryString = params.toString();
  return request<TMDBMovie[]>(`/popular${queryString ? `?${queryString}` : ''}`);
};
