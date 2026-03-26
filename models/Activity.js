const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Links the log to a specific user
    required: true,
  },
  action: {
    type: String, 
    required: true, // e.g., "Searched for 'Inception'", "Changed Password"
  },
  type: {
    type: String,
    enum: ["search", "auth", "profile", "admin"], // Categorizes the log
    default: "search",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Activity", activitySchema);