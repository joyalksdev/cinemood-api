const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist, getWatchlistTitlesForAI } = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWatchlist);
router.get('/titles', protect, getWatchlistTitlesForAI);
router.post('/add', protect, addToWatchlist);
router.delete('/:movieId', protect, removeFromWatchlist);

module.exports = router;