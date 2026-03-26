// Helper for TMDB Requests
const axios = require("axios");
const logActivity = require("../utils/logger");

console.log("BASE URL CHECK:", process.env.TMDB_BASE_URL);
console.log("TOKEN CHECK:", process.env.TMDB_TOKEN ? "Exists" : "MISSING");

const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
  },
});

// Helper to filter results (Keeping it lean for the frontend)
const filterResults = (results) =>
  results.map((m) => ({
    id: m.id,
    title: m.title || m.name,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    rating: m.vote_average, // Keep as rating for your MovieRow fix
    overview: m.overview, // <--- ADD THIS
    release_date: m.release_date || m.first_air_date, // <--- ADD THIS
    media_type: m.media_type || (m.title ? "movie" : "tv"),
  }));

// --- CONTROLLERS ---

exports.getPersonalizedMovies = async (req, res) => {
  try {
    const genres = req.user.genres?.join(",") || "";
    const lang = req.user.language || "en";
    const { data } = await tmdb.get(
      `/discover/movie?with_genres=${genres}&with_original_language=${lang}&sort_by=popularity.desc`,
    );
    res.json(filterResults(data.results));
  } catch (err) {
    console.error("TMDB ERROR:", err.response?.data || err.message); // THIS LINE IS KEY
    res.status(500).json({ message: err.message });
  }
};

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

// Search specifically for Movies
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

// Search specifically for People (Actors/Directors)
exports.searchPeople = async (req, res) => {
  try {
    const { query } = req.query;
    const { data } = await tmdb.get(
      `/search/person?query=${encodeURIComponent(query)}&include_adult=false`,
    );
    res.json(data.results); // We don't filter people with the movie filter
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch Full Person Details (Bio, Credits, etc.)
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

// Fetch Movie Credits (Cast and Crew)
exports.getMovieCredits = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await tmdb.get(`/movie/${id}/credits`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch Movie Reviews
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

exports.discoverByGenre = async (req, res) => {
  try {
    const { genres, page = 1 } = req.query;

    if (!genres) {
      return res.status(400).json({ message: "Genre IDs are required." });
    }

    // we use the 'tmdb' instance created at the top of the file
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
