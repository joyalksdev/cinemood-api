const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * protect: checks if a user is logged in before allowing them to access a route.
 * it looks for a token in two places: cookies (standard) or headers (fallback).
 */
const protect = async (req, res, next) => {
  let token;

  // 1. prioritizes cookies for secure browser-based sessions
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } 
  // 2. supports bearer tokens for mobile apps or dev tools like postman
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, please login' });
  }

  try {
    // 3. decrypts the token using the secret key to get the user id
    const decoded = jwt.verify(token, process.env.secret_key);

    // 4. fetches the latest user data and attaches it to the request object for the next functions
    req.user = await User.findById(decoded.id).select('-password');

    // handles banned accounts immediately to prevent further api access
    if (req.user && req.user.status === 'banned') {
      return res.status(403).json({ 
          success: false, 
          message: 'Your account has been banned due to a violation of our terms.' 
      });
    }

    if (req.user.status === 'suspended') {
      return res.status(403).json({ 
          success: false, 
          message: 'Your account is currently under a temporary suspension.' 
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    // catches expired or tampered tokens to force a re-login
    res.status(401).json({ success: false, message: 'Session expired, login again' });
  }
};

/**
 * admin: simple check to ensure the user has elevated privileges.
 * must be used AFTER 'protect' because it relies on req.user being populated.
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};

module.exports = { protect, admin };