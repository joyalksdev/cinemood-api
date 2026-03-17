const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String, 
      default: "" // This will be filled during onboarding
    },
    avatar: { 
      type: String, 
      default: "" 
    },
    genres: { 
      type: [Number], 
      default: [] 
    },
    language: { 
      type: String, 
      default: "en" 
    },
    onboarded: { 
      type: Boolean, 
      default: false 
    },
    watchlist: [{ type: Object }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);