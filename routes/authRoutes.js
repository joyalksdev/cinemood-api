const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { authLimiter } = require('../utils/rateLimiter');

// --- ACCOUNT ACCESS ---

// Uses authLimiter to stop bots from bulk-creating fake accounts
router.post('/register', authLimiter, registerUser);

// Protects against brute-force password guessing
router.post('/login', authLimiter, loginUser);

// Clears the session or cookie (no limiter needed)
router.post('/logout', logoutUser);

// --- RECOVERY FLOW ---

// Limits how many reset emails a user (or attacker) can request
router.post('/forgotpassword', authLimiter, forgotPassword);

// The final step: updates the DB with the new hashed password
router.put('/resetpassword/:resettoken', resetPassword); 

module.exports = router;