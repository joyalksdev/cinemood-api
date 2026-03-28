const express = require("express");
const router = express.Router();
const { getAiRecommendation, syncWeeklySpotlight } = require("../controllers/aiController");
const { protect } = require('../middleware/authMiddleware');
const updateLastActive = require("../middleware/updateActive");

// Global middleware for these routes
router.use(updateLastActive);

// --- AI INTERACTION ---

/** * process: Triggers the Gemini matching logic based on user mood/input.
 * We use POST here because the frontend sends a body with the user's prompt.
 */
router.post("/process", protect, updateLastActive, getAiRecommendation);

/** * weekly-spotlight: Fetches or regenerates the 7-day AI movie collection.
 * Uses GET since it simply retrieves the current cached spotlight for the user.
 */
router.get("/weekly-spotlight", protect, updateLastActive, syncWeeklySpotlight);

module.exports = router;