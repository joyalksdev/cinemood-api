const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const { 
  getAllUsers, updateUserStatus, warnUser, clearWarnings, 
  banUser, getAllReviews, deleteReview, createNotification, getDashboardData,
  updateUserRole,
  deleteNotification,
  updateNotification,
  getAllNotifications
} = require("../controllers/adminController");

const updateLastActive = require("../middleware/updateActive");

router.use(updateLastActive);

router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/status", protect, admin, updateUserStatus);
router.put("/users/:id/role", protect,admin, updateUserRole)
router.put("/users/:id/warn", protect, admin, warnUser);
router.put("/users/:id/clear", protect, admin, clearWarnings);
router.put("/users/:id/ban", protect, admin, banUser);
router.get("/reviews", protect, admin, getAllReviews);
router.delete("/reviews/:id", protect, admin, deleteReview);
router.get("/notifications", protect, admin, getAllNotifications); // Fetch for Admin Drawer
router.post("/notifications", protect, admin, createNotification); 
router.put("/notifications/:id", protect, admin, updateNotification); // Inline Edit
router.delete("/notifications/:id", protect, admin, deleteNotification); // Purge
router.get("/dashboard-data", protect, admin, getDashboardData)

module.exports = router;    