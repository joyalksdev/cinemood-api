const express  = require("express")
const { addReview, getLocalReviews, reportReview }  = require("../controllers/reviewController.js")
const { protect } = require("../middleware/authMiddleware.js")

const router = express.Router();
const updateLastActive = require("../middleware/updateActive");

router.use(updateLastActive);

router.get("/:movieId", getLocalReviews); // Public: anyone can read reviews
router.post("/", protect, addReview);     // Protected: must be logged in to write
router.put("/:id/report", protect, reportReview);

module.exports = router;    