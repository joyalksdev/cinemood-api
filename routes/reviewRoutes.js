const express = require("express");
const { addReview, getLocalReviews, reportReview, dismissReports } = require("../controllers/reviewController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

const router = express.Router();
const updateLastActive = require("../middleware/updateActive");

// Tracks user/admin presence on every review action
router.use(updateLastActive);

// --- PUBLIC FEED ---
// Anyone can read reviews for a movie, even if they aren't signed in
router.get("/:movieId", getLocalReviews); 

// --- USER ACTIONS ---
// Must be logged in to post a new rating
router.post("/", protect, addReview); 

// Allows users to flag inappropriate content for moderation
router.put("/:id/report", protect, reportReview);

// --- MODERATION CONTROL ---
// Only accessible by roles with 'admin' privileges
router.put("/reviews/:id/dismiss", protect, admin, dismissReports);

module.exports = router;