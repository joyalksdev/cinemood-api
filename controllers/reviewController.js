const Review = require("../models/Review");
const logActivity = require("../utils/logger");

// Creates a new community rating
exports.addReview = async (req, res) => {
  try {
    const { movieId, rating, content, movieTitle } = req.body;

    // Use the name from the authenticated user object
    const authorName = req.user.name || "CineMood User";

    const newReview = new Review({
      movieId,
      userId: req.user._id,
      userName: authorName, 
      rating: Number(rating),
      content: content.trim()
    });

    await newReview.save();

    // Fallback title to prevent crashes if movieTitle is missing
    const displayTitle = movieTitle || `Movie ID: ${movieId}`;
    
    // Track the action in the user's activity feed
    if (typeof logActivity === 'function') {
      logActivity(req.user._id, `Posted a ${rating}-star review for ${displayTitle}`, "profile");
    }
    
    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    console.error("POST REVIEW ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Fetches reviews specifically from your MongoDB, not TMDB
exports.getLocalReviews = async (req, res) => {
  try {
    // Sort by newest first
    const reviews = await Review.find({ movieId: req.params.movieId }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Increments the report counter for a specific review
exports.reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.reportCount += 1;
    
    // Automated moderation: flags the review for admin review after 3 reports
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

// Admin action to clear flags and reset report counts
exports.dismissReports = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // Clears the moderation status
    review.reportCount = 0;
    review.isFlagged = false;

    await review.save();

    logActivity(req.user.id, `Dismissed reports for Review ID: ${review._id}`, "admin");
    
    res.status(200).json({ success: true, message: "Reports cleared." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};