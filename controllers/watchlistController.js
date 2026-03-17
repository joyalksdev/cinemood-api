const User = require('../models/user');

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

    res.status(200).json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};