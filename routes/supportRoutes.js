const express = require('express');
const router = express.Router();
const { contactSupport } = require('../controllers/supportController');
const { supportLimiter } = require('../middleware/rateLimiter');

// The limiter only applies to this specific POST route
router.post('/contact', supportLimiter, contactSupport);

module.exports = router;