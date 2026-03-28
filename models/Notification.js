const mongoose = require("mongoose");

/**
 * Notification Schema: Powering the CineMood messaging system.
 * Handles both targeted user warnings and system-wide global broadcasts.
 */
const notificationSchema = new mongoose.Schema(
  {
    // --- TARGETING LOGIC ---
    
    // The intended viewer. If null, the notification is a "Global Broadcast" 
    // visible to all users (e.g., system maintenance alerts).
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, 
    },
    
    // Tracks who initiated the notification (usually an Admin ID).
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- CONTENT ---
    
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // Defines the visual style and urgency on the frontend (e.g., Red for 'warning', Blue for 'info')
    type: {
      type: String,
      enum: ["system", "warning", "alert", "message", "maintenance", "info"],
      default: "system",
    },

    // Tracks if the user has clicked/dismissed the notification in their drawer
    isRead: {
      type: Boolean,
      default: false,
    },

    // --- SCHEDULING & EXPIRY ---

    // Allows admins to draft notifications that only appear after a certain date/time
    scheduledAt: {
      type: Date,
      default: null, 
    },

    // Automates database cleanup. By default, notifications vanish after 7 days
    // to keep the user's feed fresh and the database lean.
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    },
  },
  { 
    // Records when the notification was created/updated
    timestamps: true 
  },
);

/**
 * DATABASE OPTIMIZATION:
 * This index tells MongoDB to automatically delete the document when 'expiresAt' is reached.
 * It's a "set it and forget it" way to handle data lifecycle management.
 */
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);