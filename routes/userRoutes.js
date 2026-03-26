const express = require('express');
const router = express.Router();
const { updateProfile, updatePassword, getUserProfile, markAllNotificationsRead, markNotificationRead, getUserNotifications } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const updateLastActive = require("../middleware/updateActive");

router.use(updateLastActive);

router.get('/me', protect, getUserProfile);

router.put('/update', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
router.get("/notifications", protect, getUserNotifications);
router.put("/notifications/read-all", protect, markAllNotificationsRead);
router.put("/notifications/:id/read", protect, markNotificationRead);

module.exports = router;