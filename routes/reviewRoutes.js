const express  = require("express")
const { addReview, getLocalReviews }  = require("../controllers/reviewController.js")
const { protect } = require("../middleware/authMiddleware.js")

const router = express.Router();

router.get("/:movieId", getLocalReviews); // Public: anyone can read reviews
router.post("/", protect, addReview);     // Protected: must be logged in to write

module.exports = router;    