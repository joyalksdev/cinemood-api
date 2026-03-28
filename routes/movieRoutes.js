const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');
const updateLastActive = require('../middleware/updateActive');

// Tracks user activity on every movie-related request
router.use(updateLastActive);

// --- DISCOVERY & FEED ---

// Personalized based on user genres/language
router.get('/personalized', protect, movieController.getPersonalizedMovies);

// Filtered browsing (sort by rating, date, etc.)
router.get('/browse', protect, movieController.getBrowseMovies);

router.get('/top-rated', protect, movieController.getTopRated);
router.get('/popular', protect, movieController.getPopular);
router.get('/now-playing', protect, movieController.getNowPlaying);
router.get('/kdrama', protect, movieController.getKDramas);
router.get('/anime', protect, movieController.getAnime);
router.get('/trending', movieController.getTrending);

// --- SEARCH & FILTERING ---

// Multi-search (Movies + People)
router.get('/search', protect, movieController.searchMulti);
router.get('/search/movies', protect, movieController.searchMovies);
router.get('/search/people', protect, movieController.searchPeople);

// Fetch by specific Genre ID
router.get('/discover', protect, movieController.discoverByGenre);

// Keyword-based mood search (e.g., "dark", "funny")
router.get('/mood', protect, movieController.searchByMoodKeyword);

// --- DETAILED DATA ---

// Actor/Director bios and credits
router.get('/person/:id', protect, movieController.getPersonDetails);

// Full movie info (trailers, cast, overview)
router.get('/:id', protect, movieController.getMovieDetails);

router.get('/:id/similar', protect, movieController.getSimilarMovies);
router.get('/:id/credits', protect, movieController.getMovieCredits);

// Community reviews from TMDB
router.get('/:id/reviews', protect, movieController.getMovieReviews);

module.exports = router;