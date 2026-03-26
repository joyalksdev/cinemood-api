const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  movieId: { type: String, required: true }, // TMDB ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 10, required: true },
  content: { type: String, required: true },
  isFlagged: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);