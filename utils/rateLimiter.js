const rateLimit = require('express-rate-limit');

/**
 * globalLimiter: The "Standard Shield"
 * Protects against general DDoS attacks or accidental infinite loops in frontend code.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 100, // 100 requests per IP
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true, // Returns limit info in the 'RateLimit-*' headers
  legacyHeaders: false,
});

/**
 * authLimiter: The "Vault Lock"
 * Specifically for Login/Register. Stops hackers from trying thousands of passwords.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1-hour window
  max: 5, // Only 5 attempts allowed per hour
  message: {
    success: false,
    message: "Too many attempts. For security reasons, please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter };