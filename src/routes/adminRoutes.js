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
  getAllUsers,
  getAllOwners,
  deleteAccount,
} = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/stats", getStats);

router.get("/rooms/pending", getPendingRooms);
router.patch("/rooms/:id/approve", approveRoom);
router.patch("/rooms/:id/reject", rejectRoom);

// Note: /owners/pending must be defined before /owners (both are exact literal
// segments here, not params, so there's no real ambiguity - kept in this order
// for readability/grouping).
router.get("/owners/pending", getPendingOwners);
router.get("/owners", getAllOwners);
router.patch("/owners/:id/verify", verifyOwner);

router.get("/users", getAllUsers);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/ban", banUser);
router.delete("/users/:id", deleteAccount);

router.get("/reviews/flagged", getFlaggedReviews);

module.exports = router;
