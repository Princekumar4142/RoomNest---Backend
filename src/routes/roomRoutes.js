const express = require("express");
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getMyRooms,
  updateRoomAvailability,
  getNearbyPlaces,
  getRentInsight,
} = require("../controllers/roomController");
const { protect, restrictTo } = require("../middleware/auth");
const { validate, schemas } = require("../validation/schemas");

const router = express.Router();

router.get("/", getRooms);
router.get("/owner/mine", protect, restrictTo("owner", "admin"), getMyRooms);
router.get("/:id", getRoomById);
router.get("/:id/nearby-places", getNearbyPlaces);
router.get("/:id/rent-insight", getRentInsight);

router.post("/", protect, restrictTo("owner", "admin"), validate(schemas.room), createRoom);
router.put("/:id", protect, restrictTo("owner", "admin"), validate(schemas.room), updateRoom);
router.patch("/:id/availability", protect, restrictTo("owner", "admin"), updateRoomAvailability);
router.delete("/:id", protect, restrictTo("owner", "admin"), deleteRoom);

module.exports = router;
