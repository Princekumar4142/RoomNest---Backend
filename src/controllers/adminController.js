const User = require("../models/User");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

// GET /api/admin/stats
async function getStats(req, res, next) {
  try {
    const [totalUsers, totalOwners, totalRooms, pendingRooms, totalBookings] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "owner" }),
      Room.countDocuments(),
      Room.countDocuments({ verificationStatus: "pending" }),
      Booking.countDocuments(),
    ]);
    res.json({ totalUsers, totalOwners, totalRooms, pendingRooms, totalBookings });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/rooms/pending
async function getPendingRooms(req, res, next) {
  try {
    const rooms = await Room.find({ verificationStatus: "pending" })
      .populate("owner", "name email phone ownerVerification")
      .sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/rooms/:id/approve
async function approveRoom(req, res, next) {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: "approved", isVerified: true, isFlagged: false },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Room not found." });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${room.owner}`).emit("notification", {
        type: "listing",
        message: `Your listing "${room.title}" was approved and is now live.`,
        roomId: room._id,
      });
    }

    res.json({ room });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/rooms/:id/reject
async function rejectRoom(req, res, next) {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: "rejected", isVerified: false, isActive: false },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Room not found." });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${room.owner}`).emit("notification", {
        type: "listing",
        message: `Your listing "${room.title}" was not approved. Please review and resubmit.`,
        roomId: room._id,
      });
    }

    res.json({ room });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/owners/pending
async function getPendingOwners(req, res, next) {
  try {
    const owners = await User.find({ role: "owner", "ownerVerification.status": "pending" });
    res.json({ owners });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/owners/:id/verify
async function verifyOwner(req, res, next) {
  try {
    const { approve } = req.body;
    const owner = await User.findByIdAndUpdate(
      req.params.id,
      { "ownerVerification.status": approve ? "verified" : "rejected" },
      { new: true }
    );
    if (!owner) return res.status(404).json({ message: "Owner not found." });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${owner._id}`).emit("notification", {
        type: "kyc",
        message: approve
          ? "Your identity verification was approved."
          : "Your identity verification was rejected. Please resubmit.",
      });
    }

    res.json({ owner });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:id/suspend
async function suspendUser(req, res, next) {
  try {
    const { suspend } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: !!suspend }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:id/ban
async function banUser(req, res, next) {
  try {
    const { ban } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: !!ban }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reviews/flagged
async function getFlaggedReviews(req, res, next) {
  try {
    const reviews = await Review.find({ isFlagged: true }).populate("user room");
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  getPendingRooms,
  approveRoom,
  rejectRoom,
  getPendingOwners,
  verifyOwner,
  suspendUser,
  banUser,
  getFlaggedReviews,
};
