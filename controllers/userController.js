const User = require("../models/user");
const bcrypt = require("bcrypt");
const Notification = require("../models/Notification");
const logActivity = require("../utils/logger");

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
          onboarded: onboarded ?? true,
        },
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const logMessage = onboarded
      ? "Completed account onboarding"
      : "Updated profile settings";
    logActivity(req.user.id, logMessage, "profile");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    logActivity(req.user.id, "Changed account password", "auth");

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    // req.user.id comes from your protect middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
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

// controllers/userController.js

const getUserNotifications = async (req, res) => {
  try {
    const now = new Date();
    
    // Get the timestamp of when this specific user joined
    // This ensures they don't see global spam from weeks ago.
    const userJoinedDate = req.user.createdAt;

    const notifications = await Notification.find({
      $and: [
        // 1. RECIPIENT FILTER
        {
          $or: [
            { recipient: req.user._id }, // Targeted specifically to them
            { 
              recipient: null, 
              createdAt: { $gte: userJoinedDate } // Global, but only since they joined
            },
          ],
        },
        // 2. SCHEDULING FILTER
        {
          $or: [
            { scheduledAt: null }, // Immediate send
            { scheduledAt: { $lte: now } }, // Future send that is now due
          ],
        },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Notification Fetch Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch neural alerts" 
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to sync signal" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    await Notification.updateMany(
      {
        $or: [{ recipient: userId }, { recipient: null }],
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    res.status(200).json({ success: true, message: "All signals synced" });
  } catch (error) {
    res.status(500).json({ message: "Bulk sync failed" });
  }
};

module.exports = {
  updateProfile,
  updatePassword,
  getUserProfile,
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotifications
};
