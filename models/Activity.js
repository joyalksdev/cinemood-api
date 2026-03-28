const mongoose = require("mongoose");

/**
 * Activity Schema: The "Neural Stream" of the CineMood Engine.
 * This model records every critical event for the Admin Dashboard and security audits.
 */
const activitySchema = new mongoose.Schema({
  // Relational link to the User collection. 
  // This allows the dashboard to show "John Doe searched..." instead of just an ID.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },

  // A human-readable description of the event.
  // e.g., "Searched for 'Inception'", "Changed Password", "Admin Banned User X"
  action: {
    type: String, 
    required: true, 
  },

  // Categorization for filtering. 
  // Use 'admin' for moderation logs and 'search' to track AI usage trends.
  type: {
    type: String,
    enum: ["search", "auth", "profile", "admin"], 
    default: "search",
  },

  // Explicit timestamp used for the "Activity Chart" on the Admin Dashboard.
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Activity", activitySchema);