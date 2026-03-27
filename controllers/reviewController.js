const Review = require("../models/Review");
const logActivity = require("../utils/logger");

// Add a new review to a movie
exports.addReview = async (req, res) => {
  try {
    const { movieId, rating, content, movieTitle } = req.body;

    // FIX: Accessing 'name' from your User model via req.user
    const authorName = req.user.name || "CineMood User";

    const newReview = new Review({
      movieId,
      userId: req.user._id,
      userName: authorName, // Saves 'name' from User to 'userName' in Review
      rating: Number(rating),
      content: content.trim()
    });

    await newReview.save();

    // FIX: Pull movieTitle from req.body to prevent the 500 ReferenceError
    const displayTitle = movieTitle || `Movie ID: ${movieId}`;
    
    // Log activity safely
    if (typeof logActivity === 'function') {
      logActivity(req.user._id, `Posted a ${rating}-star review for ${displayTitle}`, "profile");
    }
    
    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    console.error("POST REVIEW ERROR:", err.message);
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

exports.dismissReports = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // Reset the flags
    review.reportCount = 0;
    review.isFlagged = false;

    await review.save();

    logActivity(req.user.id, `Dismissed reports for Review ID: ${review._id}`, "admin");
    
    res.status(200).json({ success: true, message: "Reports cleared." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};