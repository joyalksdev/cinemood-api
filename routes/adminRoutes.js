const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const { 
  getAllUsers, updateUserStatus, warnUser, clearWarnings, 
  banUser, getAllReviews, deleteReview, createNotification, getDashboardData,
  updateUserRole, deleteNotification, updateNotification, getAllNotifications
} = require("../controllers/adminController");

const updateLastActive = require("../middleware/updateActive");

// Tracks admin activity whenever they use these routes
router.use(updateLastActive);

// --- USER MANAGEMENT ---
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/status", protect, admin, updateUserStatus);
router.put("/users/:id/role", protect, admin, updateUserRole);
router.put("/users/:id/warn", protect, admin, warnUser);
router.put("/users/:id/clear", protect, admin, clearWarnings);
router.put("/users/:id/ban", protect, admin, banUser);

// --- MODERATION ---
router.get("/reviews", protect, admin, getAllReviews);
router.delete("/reviews/:id", protect, admin, deleteReview);

// --- SYSTEM ALERTS (Neural Notifications) ---
router.get("/notifications", protect, admin, getAllNotifications); 
router.post("/notifications", protect, admin, createNotification); 
router.put("/notifications/:id", protect, admin, updateNotification); 
router.delete("/notifications/:id", protect, admin, deleteNotification); 

// --- ANALYTICS ---
// Pulls the chart data and stats for the main Admin Dashboard
router.get("/dashboard-data", protect, admin, getDashboardData);

module.exports = router;