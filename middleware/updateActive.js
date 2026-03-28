const User = require("../models/user");

/**
 * middleware to track user engagement.
 * runs on every request where a user is authenticated (req.user exists).
 */
const updateLastActive = async (req, res, next) => {
  if (req.user) {
    // updates the timestamp silently in the background whenever the user hits an api endpoint
    await User.findByIdAndUpdate(req.user._id, { lastActive: Date.now() });
  }
  // passes control to the next middleware or route handler regardless of the update result
  next();
};

module.exports = updateLastActive