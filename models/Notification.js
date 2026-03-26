const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null = Global Broadcast
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["system", "warning", "alert", "message", "maintenance", "info"], // Add 'maintenance' and 'info'
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // --- ADDED FOR SCHEDULING ---
    scheduledAt: {
      type: Date,
      default: null, // If null, it sends immediately
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from creation
    },
  },
  { timestamps: true },
);

// Indexing for performance (Optional but recommended for large apps)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
