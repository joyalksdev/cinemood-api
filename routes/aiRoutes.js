const express = require("express");
const router = express.Router();
const {getAiRecommendation, syncWeeklySpotlight,} = require("../controllers/aiController");
const { protect } = require('../middleware/authMiddleware');
const updateLastActive = require("../middleware/updateActive");

router.use(updateLastActive);

router.post("/process",protect, updateLastActive, getAiRecommendation);
router.get("/weekly-spotlight", protect,updateLastActive, syncWeeklySpotlight)

module.exports = router;