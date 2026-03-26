const User = require('../models/user');
const logActivity = require('../utils/logger');

// Get Watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add to Watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const { movie } = req.body;
    
    // $addToSet prevents duplicate movies from being added
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { watchlist: movie } },
      { new: true }
    );

    logActivity(req.user._id, `Added ${movie.title}  to watchlist`, "profile");


    res.status(200).json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove from Watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;

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


// Get a clean string of titles for the AI Recommendation engine
exports.getWatchlistTitlesForAI = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.watchlist || user.watchlist.length === 0) {
      return res.status(200).json({ titles: "" });
    }

    // Extract only the titles and join them: "Inception, Batman, Shutter Island"
    const titles = user.watchlist.map(movie => movie.title).join(", ");

    res.status(200).json({ titles });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch titles for AI" });
  }
};