const rateLimit = require('express-rate-limit');

// Limits support ticket submissions to prevent email spam
exports.supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute "cooling" window
  max: 5, // Only 5 messages allowed per IP in that window
  standardHeaders: true, // Sends 'RateLimit-Limit' and 'RateLimit-Remaining' to the browser
  legacyHeaders: false, 
  message: { 
    success: false, 
    message: "You have sent too many transmissions. Cooling in progress. Please wait 15 minutes." 
  }
});