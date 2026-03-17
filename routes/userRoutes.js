const express = require('express');
const router = express.Router();
const { updateProfile, updatePassword, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getUserProfile);

router.put('/update', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;