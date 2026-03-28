const Activity = require("../models/Activity");

// Saves user actions to the database for the Admin Dashboard
const logActivity = async (userId, action, type = "search") => {
  try {
    // Creates a new entry in the Activity collection
    await Activity.create({ user: userId, action, type });
  } catch (err) {
    // We only log the error to the console
    console.error("Activity Log Error:", err);
    
    /**
     * Why we don't 'throw' the error:
     * If logging fails, we still want the user to get their search results 
     * or update their profile. A "background" task should never break the main app.
     */
  }
};

module.exports = logActivity;