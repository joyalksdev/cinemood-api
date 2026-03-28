// Helper for TMDB Requests
const axios = require("axios");
const logActivity = require("../utils/logger");

// verification logs to ensure env variables are loading correctly in production
console.log("BASE URL CHECK:", process.env.TMDB_BASE_URL);
console.log("TOKEN CHECK:", process.env.TMDB_TOKEN ? "Exists" : "MISSING");

// axios instance configured with tmdb base url and bearer token for all requests
const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
  },
});

/**
 * filterResults: trims the massive tmdb response down to exactly what the frontend needs.
 * helps reduce payload size and ensures consistent property names (like 'rating').
 */
const filterResults = (results) =>
  results.map((m) => ({
    id: m.id,
    title: m.title || m.name,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    rating: m.vote_average, 
    overview: m.overview, 
    release_date: m.release_date || m.first_air_date, 
    media_type: m.media_type || (m.title ? "movie" : "tv"),
  }));

// --- CONTROLLERS ---

/**
 * fetches movies based on the genres and language saved in the user's profile.
 * this is the core of the "For You" section.
 */
exports.getPersonalizedMovies = async (req, res) => {
  try {
    const genres = req.user.genres?.join(",") || "";
    const lang = req.user.language || "en";
    const { data } = await tmdb.get(
      `/discover/movie?with_genres=${genres}&with_original_language=${lang}&sort_by=popularity.desc`,
    );
    res.json(filterResults(data.results));
  } catch (err) {
    console.error("TMDB ERROR:", err.response?.data || err.message); 
    res.status(500).json({ message: err.message });
  }
};

/**
 * dynamic discover: allows users to filter by specific genres, language, or custom sorting.
 */
exports.getBrowseMovies = async (req, res) => {
  try {
    const { genre, language, sort, page = 1 } = req.query;
    let sortBy = "release_date.desc";
    if (sort === "old") sortBy = "release_date.asc";
    if (sort === "rating") sortBy = "vote_average.desc";

    const { data } = await tmdb.get(
      `/discover/movie?with_genres=${genre}&with_original_language=${language}&sort_by=${sortBy}&page=${page}`,
    );
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTopRated = async (req, res) => {
  try {
    const { data } = await tmdb.get(`/movie/top_rated`);
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPopular = async (req, res) => {
  try {
    const { data } = await tmdb.get(`/movie/popular`);
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNowPlaying = async (req, res) => {
  try {
    const { data } = await tmdb.get(`/movie/now_playing`);
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// specialized filter for korean dramas using language code 'ko'
exports.getKDramas = async (req, res) => {
  try {
    const { data } = await tmdb.get(
      `/discover/tv?with_original_language=ko&sort_by=popularity.desc`,
    );
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// specialized filter for anime using genre id 16 (animation) and language code 'ja'
exports.getAnime = async (req, res) => {
  try {
    const { data } = await tmdb.get(
      `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
    );
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const { data } = await tmdb.get(`/trending/movie/day`);
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * multi-search: searches across movies, tv, and people simultaneously.
 * filtered here to focus primarily on movies and actors/directors.
 */
exports.searchMulti = async (req, res) => {
  try {
    const { query } = req.query;
    const { data } = await tmdb.get(
      `/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
    );
    const filtered = data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "person",
    );
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * movie details: uses 'append_to_response' to get cast and trailers in a single api call.
 */
exports.getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await tmdb.get(
      `/movie/${id}?append_to_response=credits,videos`,
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSimilarMovies = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await tmdb.get(`/movie/${id}/similar`);
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * manual movie search: specifically logs this activity to the database for analytics.
 */
exports.searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    const { data } = await tmdb.get(
      `/search/movie?query=${encodeURIComponent(query)}&include_adult=false`,
    );

    logActivity(req.user.id, `Manually searched for: ${query}`, "search");
    
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchPeople = async (req, res) => {
  try {
    const { query } = req.query;
    const { data } = await tmdb.get(
      `/search/person?query=${encodeURIComponent(query)}&include_adult=false`,
    );
    res.json(data.results); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPersonDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await tmdb.get(
      `/person/${id}?append_to_response=movie_credits,external_ids`,
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMovieCredits = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await tmdb.get(`/movie/${id}/credits`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMovieReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    const { data } = await tmdb.get(`/movie/${id}/reviews?page=${page}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * discoverByGenre: allows the frontend to request a paginated list of movies for a specific genre ID.
 */
exports.discoverByGenre = async (req, res) => {
  try {
    const { genres, page = 1 } = req.query;

    if (!genres) {
      return res.status(400).json({ message: "Genre IDs are required." });
    }

    const { data } = await tmdb.get(`/discover/movie`, {
      params: {
        with_genres: genres,
        sort_by: "popularity.desc",
        page: page,
      },
    });

    res.json(filterResults(data.results));
  } catch (err) {
    console.error("TMDB API ERROR DETAILS:", err.response?.data || err.message);

    res.status(err.response?.status || 500).json({
      message: "Failed to fetch movies from TMDB",
      error: err.response?.data?.status_message || err.message,
    });
  }
};

/**
 * searchByMoodKeyword: a simple keyword-based search that can be used for "mood" tags 
 * like 'dark', 'uplifting', or 'trippy'.
 */
exports.searchByMoodKeyword = async (req, res) => {
  try {
    const { keyword, page = 1 } = req.query;
    const { data } = await tmdb.get(`/search/movie`, {
      params: {
        query: encodeURIComponent(keyword),
        page: page,
      },
    });
    res.json(filterResults(data.results));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};