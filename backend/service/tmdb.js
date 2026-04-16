const express = require('express');
const router = express.Router();

// TMDB API Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // Add your TMDB API key to .env
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Search movies from TMDB
router.get('/search', async (req, res) => {
  try {
    const { query, language = 'vi-VN' } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    if (!TMDB_API_KEY) {
      return res.status(500).json({ message: 'TMDB API key not configured' });
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${language}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from TMDB');
    }

    const data = await response.json();
    
    // Transform results to include full image URLs
    const results = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      releaseDate: movie.release_date,
      posterPath: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : null,
      voteAverage: movie.vote_average,
      popularity: movie.popularity
    }));

    res.json(results);
  } catch (err) {
    console.error('Error searching TMDB:', err);
    res.status(500).json({ message: 'Error searching movies from TMDB' });
  }
});

// Get movie details including videos (trailers)
router.get('/movie/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { language = 'vi-VN' } = req.query;

    if (!TMDB_API_KEY) {
      return res.status(500).json({ message: 'TMDB API key not configured' });
    }

    // Fetch movie details and videos in parallel
    const [detailsResponse, videosResponse] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}`),
      fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=${language}`)
    ]);

    if (!detailsResponse.ok || !videosResponse.ok) {
      throw new Error('Failed to fetch movie details from TMDB');
    }

    const details = await detailsResponse.json();
    const videos = await videosResponse.json();

    // Find trailer (prefer YouTube trailers)
    const trailer = videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    ) || videos.results[0];

    const movieData = {
      tmdbId: details.id,
      title: details.title,
      originalTitle: details.original_title,
      overview: details.overview,
      releaseDate: details.release_date,
      runtime: details.runtime,
      posterPath: details.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${details.poster_path}` : null,
      backdropPath: details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${details.backdrop_path}` : null,
      genres: details.genres,
      voteAverage: details.vote_average,
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      trailerKey: trailer ? trailer.key : null,
      originalLanguage: details.original_language,
      spokenLanguages: details.spoken_languages
    };

    res.json(movieData);
  } catch (err) {
    console.error('Error fetching movie details from TMDB:', err);
    res.status(500).json({ message: 'Error fetching movie details from TMDB' });
  }
});

// Get popular movies
router.get('/popular', async (req, res) => {
  try {
    const { language = 'vi-VN', page = 1 } = req.query;

    if (!TMDB_API_KEY) {
      return res.status(500).json({ message: 'TMDB API key not configured' });
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=${language}&page=${page}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch popular movies from TMDB');
    }

    const data = await response.json();
    
    const results = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      releaseDate: movie.release_date,
      posterPath: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : null,
      voteAverage: movie.vote_average,
      popularity: movie.popularity
    }));

    res.json(results);
  } catch (err) {
    console.error('Error fetching popular movies from TMDB:', err);
    res.status(500).json({ message: 'Error fetching popular movies from TMDB' });
  }
});

module.exports = router;
