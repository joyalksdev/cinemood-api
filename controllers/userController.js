const User = require("../models/user");
const bcrypt = require("bcrypt");
const Notification = require("../models/Notification");
const logActivity = require("../utils/logger");

// Updates user preferences and onboarding status
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
          // If onboarded isn't sent, we assume it's true (finishing the setup)
          onboarded: onboarded ?? true,
        },
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Dynamic logging based on whether they just joined or just updated
    const logMessage = onboarded
      ? "Completed account onboarding"
      : "Updated profile settings";
    logActivity(req.user.id, logMessage, "profile");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hashes and saves a new password
const updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

     logActivity(req.user.id, "Changed account password", "auth");

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetches the current logged-in user's data
const getUserProfile = async (req, res) => {
  try {
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

// Complex Filter: Fetches alerts relevant to the specific user
const getUserNotifications = async (req, res) => {
  try {
    const now = new Date();
    const userJoinedDate = req.user.createdAt;

    /**
     * Logic:
     * 1. Only show global alerts (recipient: null) if they were created AFTER the user joined.
     * 2. Only show scheduled alerts if the 'scheduledAt' time has already passed.
     */
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { recipient: req.user._id }, 
            { 
              recipient: null, 
              createdAt: { $gte: userJoinedDate } 
            },
          ],
        },
        {
          $or: [
            { scheduledAt: null }, 
            { scheduledAt: { $lte: now } }, 
          ],
        },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Notification Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch neural alerts" });
  }
};

// Marks a single alert as viewed
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to sync signal" });
  }
};

// Batch update for all unread alerts
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

// Dangerous Action: Verifies password then wipes all user data
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Critical: Verify identity before destruction
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password. Deletion aborted." });
    }

    // Cleans up private notifications so they don't linger in the DB
    await Notification.deleteMany({ recipient: req.user.id });

    logActivity(req.user.id, "Permanently deleted account", "auth");

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ 
      success: true, 
      message: "Account and associated data deleted permanently" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateProfile,
  updatePassword,
  getUserProfile,
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotifications,
  deleteAccount 
};