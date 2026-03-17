const User = require('../models/user');
const bcrypt = require('bcrypt');

const updateProfile = async (req, res) => {
  try {
    const { name, genres, language, onboarded, avatar } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { 
        $set: { 
          name, 
          avatar,
          genres, 
          language, 
          onboarded: onboarded ?? true 
        } 
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const getUserProfile = async (req, res) => {
  try {
    // req.user.id comes from your protect middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        onboarded: user.onboarded,
        genres: user.genres || [],
        language: user.language || "en",
        watchlist: user.watchlist || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateProfile, updatePassword, getUserProfile };