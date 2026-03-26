const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');
const updateLastActive = require('../middleware/updateActive');
router.use(updateLastActive);

router.get('/personalized', protect, movieController.getPersonalizedMovies);
router.get('/browse', protect, movieController.getBrowseMovies);
router.get('/top-rated', protect, movieController.getTopRated);
router.get('/popular', protect, movieController.getPopular);
router.get('/now-playing', protect, movieController.getNowPlaying);
router.get('/kdrama', protect, movieController.getKDramas);
router.get('/anime', protect, movieController.getAnime);
router.get('/trending', movieController.getTrending);
router.get('/search', protect, movieController.searchMulti);
router.get('/search/movies', protect, movieController.searchMovies);
router.get('/search/people', protect, movieController.searchPeople);
router.get('/discover', protect, movieController.discoverByGenre);
router.get('/mood', protect, movieController.searchByMoodKeyword);

router.get('/person/:id', protect, movieController.getPersonDetails);
router.get('/:id', protect, movieController.getMovieDetails);
router.get('/:id/similar', protect, movieController.getSimilarMovies);
router.get('/:id/credits', protect, movieController.getMovieCredits);
router.get('/:id/reviews', protect, movieController.getMovieReviews);
router.get('/:id', protect, movieController.getMovieDetails);

module.exports = router;