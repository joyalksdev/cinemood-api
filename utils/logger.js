const Activity = require("../models/Activity");

// This function saves the action to the DB
const logActivity = async (userId, action, type = "search") => {
  try {
    await Activity.create({ user: userId, action, type });
  } catch (err) {
    console.error("Activity Log Error:", err);
    // We don't throw an error here because we don't want 
    // a logging failure to crash the whole app for the user.
  }
};

module.exports = logActivity;