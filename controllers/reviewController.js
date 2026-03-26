const Review = require("../models/Review");
const logActivity = require("../utils/logger");

// Add a new review to a movie
exports.addReview = async (req, res) => {
  try {
    const { movieId, rating, content } = req.body;
    
    const newReview = new Review({
      movieId,
      userId: req.user.id,
      userName: req.user.name,
      rating,
      content
    });

    await newReview.save();

    const displayTitle = movieTitle || `Movie ID: ${movieId}`;
    logActivity(req.user.id, `Posted a ${rating}-star review for ${displayTitle}`, "profile");
    
    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reviews from our database for a specific movie
exports.getLocalReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.reportCount += 1;
    
    // Auto-flag if reports get high
    if (review.reportCount >= 3) {
      review.isFlagged = true;
    }

    await review.save();

    logActivity(req.user.id, `Reported a review (Review ID: ${review._id})`, "admin");
    
    res.status(200).json({ success: true, message: "Signal reported to admins." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};