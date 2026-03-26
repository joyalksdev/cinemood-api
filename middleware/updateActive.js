// middleware/updateActive.js
const User = require("../models/user");

const updateLastActive = async (req, res, next) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { lastActive: Date.now() });
  }
  next();
};

module.exports = updateLastActive