const express  = require("express")
const { addReview, getLocalReviews, reportReview, dismissReports }  = require("../controllers/reviewController.js")
const { protect, admin } = require("../middleware/authMiddleware.js")

const router = express.Router();
const updateLastActive = require("../middleware/updateActive");

router.use(updateLastActive);

router.get("/:movieId", getLocalReviews); // Public: anyone can read reviews
router.post("/", protect, addReview);     // Protected: must be logged in to write
router.put("/:id/report", protect, reportReview);
router.put("/reviews/:id/dismiss", protect, admin, dismissReports);

module.exports = router;    