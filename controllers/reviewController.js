const Review = require("../models/Review");

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