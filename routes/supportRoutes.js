const express = require('express');
const router = express.Router();
const { contactSupport } = require('../controllers/supportController');
const { supportLimiter } = require('../middleware/rateLimiter');

// --- SUPPORT CHANNELS ---

/**
 * contact: Receives user messages and sends them via Gmail.
 * We apply the 'supportLimiter' specifically here so a bot can't
 * flood your private inbox with thousands of emails.
 */
router.post('/contact', supportLimiter, contactSupport);

module.exports = router;