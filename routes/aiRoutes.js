const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// This matches your teacher's requirement for a specific /api/ai route
router.post("/process", aiController.getAiRecommendation);

module.exports = router;