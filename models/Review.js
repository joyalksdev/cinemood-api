const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  movieId: { type: String, required: true }, // TMDB ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 10, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);