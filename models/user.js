const mongoose = require("mongoose");

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
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    name: {
      type: String,
      default: "", // This will be filled during onboarding
    },
    avatar: {
      type: String,
      default: "",
    },
    genres: {
      type: [Number],
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
    watchlist: [{ type: Object }],

    weeklySpotlight: {
      themeTitle: String,
      themeDescription: String,
      movies: [{ type: Object }],
      generatedAt: { type: Date, default: Date.now },
    },
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
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
