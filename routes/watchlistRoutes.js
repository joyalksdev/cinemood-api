const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist, getWatchlistTitlesForAI } = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');
const updateLastActive = require("../middleware/updateActive");

// Global middleware for this router
router.use(updateLastActive);

// --- COLLECTION MANAGEMENT ---

// Fetches the full list of movie objects saved by the user
router.get('/', protect, getWatchlist);

// Adds a movie to the array (controller handles duplicate prevention)
router.post('/add', protect, addToWatchlist);

// Removes a specific movie using its TMDB ID from the URL params
router.delete('/:movieId', protect, removeFromWatchlist);

// --- AI INTEGRATION ---

/**
 * titles: A specialized endpoint that returns only a string of movie names.
 * This is used to feed the Gemini AI context without sending unnecessary data.
 */
router.get('/titles', protect, getWatchlistTitlesForAI);

module.exports = router;