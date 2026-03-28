const User = require('../models/user');
const logActivity = require('../utils/logger');

// Fetch user's saved movies
exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Push movie to array (no duplicates)
exports.addToWatchlist = async (req, res) => {
  try {
    const { movie } = req.body;
    
    // Use $addToSet to handle double-clicks/duplicates
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { watchlist: movie } },
      { new: true }
    );

    logActivity(req.user._id, `Added ${movie.title} to watchlist`, "profile");

    res.status(200).json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete movie by its ID
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Pulls the specific object out of the array
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { watchlist: { id: parseInt(movieId) } } },
      { new: true }
    );

    logActivity(req.user._id, `Removed movie ID: ${movieId} from watchlist`, "profile");

    res.status(200).json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Format titles for Gemini prompt
exports.getWatchlistTitlesForAI = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.watchlist || user.watchlist.length === 0) {
      return res.status(200).json({ titles: "" });
    }

    // Turns array into comma-separated string
    const titles = user.watchlist.map(movie => movie.title).join(", ");

    res.status(200).json({ titles });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch titles for AI" });
  }
};