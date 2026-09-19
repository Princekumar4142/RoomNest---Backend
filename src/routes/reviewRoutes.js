const express = require("express");
const { createReview, getRoomReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../validation/schemas");

const router = express.Router();

router.get("/room/:roomId", getRoomReviews);
router.post("/", protect, validate(schemas.review), createReview);

module.exports = router;
