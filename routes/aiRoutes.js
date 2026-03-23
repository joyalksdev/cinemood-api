const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect } = require('../middleware/authMiddleware');

router.post("/process",protect, aiController.getAiRecommendation);
router.get("/weekly-spotlight", protect, aiController.syncWeeklySpotlight)

module.exports = router;