const rateLimit = require('express-rate-limit');

exports.supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { 
    success: false, 
    message: "You have sent  cooling in progress. Please wait 15 minutes before sending another message." 
  }
});