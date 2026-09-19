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
      {
        verificationStatus: "approved",
        isVerified: true,
        isActive: true,
        isFlagged: false,
        verifiedDate: new Date(),
        inspectedBy: req.user?.name || "Admin Physical Audit Team",
        verificationBadges: ["Physical Audit Verified", "100% Genuine Host", "Geo-Tagged Location"],
      },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Room not found." });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${room.owner}`).emit("notification", {
        type: "listing",
        message: `Your listing "${room.title}" was approved by Admin and is now live for students!`,
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
    const { reason } = req.body || {};
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: "rejected",
        isVerified: false,
        isActive: false,
        rejectionReason: reason || "Listing did not meet physical inspection standards or photo requirements.",
      },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: "Room not found." });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${room.owner}`).emit("notification", {
        type: "listing",
        message: `Your listing "${room.title}" was not approved by Admin. Please update details and resubmit.`,
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

// GET /api/admin/users  (all regular users, not owners)
async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/owners  (all owners, regardless of KYC status)
async function getAllOwners(req, res, next) {
  try {
    const owners = await User.find({ role: "owner" }).sort({ createdAt: -1 });
    res.json({ owners });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id  (works for both "user" and "owner" accounts)
async function deleteAccount(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "Account not found." });
    if (target.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be deleted from here." });
    }

    await target.deleteOne();
    res.json({ message: "Account deleted." });
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
  getAllUsers,
  getAllOwners,
  deleteAccount,
};
