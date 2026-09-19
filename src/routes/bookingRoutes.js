const express = require("express");
const {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../validation/schemas");

const router = express.Router();

router.use(protect);
router.post("/", validate(schemas.booking), createBooking);
router.get("/mine", getMyBookings);
router.get("/owner", getOwnerBookings);
router.patch("/:id/status", updateBookingStatus);

module.exports = router;
