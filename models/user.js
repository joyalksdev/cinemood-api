const mongoose = require("mongoose");

/**
 * User Schema: The central data structure for CineMood.
 * Defines everything from authentication to personalized AI spotlights.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Security: Automatically excludes password from queries by default
    },
    
    // --- AUTHENTICATION RECOVERY ---
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // --- PROFILE & PREFERENCES ---
    name: {
      type: String,
      default: "", // Filled during the onboarding phase
    },
    avatar: {
      type: String,
      default: "",
    },
    genres: {
      type: [Number], // Stores TMDB genre IDs for matching logic
      default: [],
    },
    language: {
      type: String,
      default: "en",
    },
    onboarded: {
      type: Boolean,
      default: false,
    },

    // --- PERSONALIZED MOVIE DATA ---
    watchlist: [{ type: Object }], // Flexible storage for TMDB movie objects

    weeklySpotlight: {
      themeTitle: String,
      themeDescription: String,
      aiInsight: String,
      movies: [{ type: Object }],
      // Used by the controller to manage the 7-day caching cycle
      generatedAt: { type: Date, default: Date.now },
    },

    // --- SYSTEM & MODERATION ---
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    warnings: {
      type: Number,
      default: 0, // Auto-escalates to 'suspended' in controller when >= 3
    },
    lastActive: {
      type: Date,
      default: Date.now // Updated via updateActive.js middleware
    }
  },
  { 
    // Automatically creates 'createdAt' and 'updatedAt' fields
    timestamps: true 
  },
);

module.exports = mongoose.model("User", userSchema);