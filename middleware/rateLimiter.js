const rateLimit = require('express-rate-limit');

/**
 * 1. Global Limiter (The General Shield)
 * Standard protection for all routes.
 * 100 requests every 5 minutes.
 */
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "System busy. Please wait a few minutes.",
  },
});

/**
 * 2. Auth Limiter (The Login/Register Vault)
 * Shortened to 15 minutes instead of an hour.
 * 5 attempts allowed.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

/**
 * 3. Support Limiter (The Ticket Shield)
 * 3 messages every 10 minutes.
 */
const supportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: "Message limit reached. Please wait 10 minutes before sending another." 
  }
});

/**
 * 4. Report Limiter (The "User Reporting" Limit)
 * This stops one user from reporting 100 reviews in a minute.
 * 5 reports every 10 minutes.
 */
const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: "You are reporting too fast. Take a breath and try again in 10 minutes." 
  }
});

module.exports = { 
  globalLimiter, 
  authLimiter, 
  supportLimiter, 
  reportLimiter 
};