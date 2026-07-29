const Booking = require("../models/Booking");
const Room = require("../models/Room");

// POST /api/bookings  (user schedules a visit or requests a booking)
async function createBooking(req, res, next) {
  try {
    const { roomId, type, visitScheduledFor, advanceAmount, notes } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found." });

    const booking = await Booking.create({
      room: room._id,
      user: req.user._id,
      owner: room.owner,
      type: type || "visit",
      visitScheduledFor,
      advanceAmount: advanceAmount || 0,
      paymentStatus: advanceAmount ? "pending" : "not_required",
      notes,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${room.owner}`).emit("notification", {
        type: "booking",
        message: `New ${type || "visit"} request for "${room.title}"`,
        bookingId: booking._id,
      });
    }

    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/mine (as a user)
async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("room", "title city area rent images")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/owner (as an owner - bookings on their listings)
async function getOwnerBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate("room", "title city area rent images")
      .populate("user", "name phone avatarUrl")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id/status  (owner accepts/rejects; user cancels)
async function updateBookingStatus(req, res, next) {
  try {
    const { status } = req.body; // accepted | rejected | cancelled | completed
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    const isOwner = booking.owner.toString() === req.user._id.toString();
    const isRequester = booking.user.toString() === req.user._id.toString();

    if (status === "cancelled" && !isRequester) {
      return res.status(403).json({ message: "Only the requester can cancel this booking." });
    }
    if (["accepted", "rejected", "completed"].includes(status) && !isOwner) {
      return res.status(403).json({ message: "Only the room owner can update this booking." });
    }

    booking.status = status;
    await booking.save();

    const io = req.app.get("io");
    if (io) {
      const notifyUserId = status === "cancelled" ? booking.owner : booking.user;
      io.to(`user:${notifyUserId}`).emit("notification", {
        type: "booking",
        message:
          status === "accepted"
            ? "Your visit request was accepted."
            : status === "rejected"
            ? "Your visit request was declined."
            : status === "cancelled"
            ? "A visit request was cancelled."
            : "Your booking was updated.",
        bookingId: booking._id,
      });
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, getMyBookings, getOwnerBookings, updateBookingStatus };
