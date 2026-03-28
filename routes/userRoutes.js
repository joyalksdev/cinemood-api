const express = require('express');
const router = express.Router();
const { 
  updateProfile, updatePassword, getUserProfile, 
  markAllNotificationsRead, markNotificationRead, 
  getUserNotifications, deleteAccount 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const updateLastActive = require("../middleware/updateActive");

// Automatically updates the "Last Active" timestamp for any user request here
router.use(updateLastActive);

// --- PROFILE MANAGEMENT ---

// Fetches all personal data for the logged-in user
router.get('/me', protect, getUserProfile);

// Handles onboarding info and general profile changes
router.put('/update', protect, updateProfile);

// High-security password replacement
router.put('/update-password', protect, updatePassword);

// Permanent data wipe (requires password verification in controller)
router.delete('/delete', protect, deleteAccount);

// --- NEURAL ALERTS (Notifications) ---

// Fetches both targeted and relevant global notifications
router.get("/notifications", protect, getUserNotifications);

// Batch update to clear the unread counter
router.put("/notifications/read-all", protect, markAllNotificationsRead);

// Marks a specific alert as viewed
router.put("/notifications/:id/read", protect, markNotificationRead);

module.exports = router;