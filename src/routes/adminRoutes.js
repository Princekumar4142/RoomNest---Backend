const express = require("express");
const {
  getStats,
  getPendingRooms,
  approveRoom,
  rejectRoom,
  getPendingOwners,
  verifyOwner,
  suspendUser,
  banUser,
  getFlaggedReviews,
} = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/stats", getStats);
router.get("/rooms/pending", getPendingRooms);
router.patch("/rooms/:id/approve", approveRoom);
router.patch("/rooms/:id/reject", rejectRoom);
router.get("/owners/pending", getPendingOwners);
router.patch("/owners/:id/verify", verifyOwner);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/ban", banUser);
router.get("/reviews/flagged", getFlaggedReviews);

module.exports = router;
