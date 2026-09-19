const Review = require("../models/Review");
const Room = require("../models/Room");

async function recalcRoomRating(roomId) {
  const reviews = await Review.find({ room: roomId });
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / count : 0;
  await Room.findByIdAndUpdate(roomId, {
    ratingAverage: Math.round(average * 10) / 10,
    ratingCount: count,
  });
}

// POST /api/reviews
async function createReview(req, res, next) {
  try {
    const { roomId, ratings, comment } = req.body;
    const overallRating =
      Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;

    const review = await Review.create({
      room: roomId,
      user: req.user._id,
      ratings,
      overallRating: Math.round(overallRating * 10) / 10,
      comment,
    });

    await recalcRoomRating(roomId);
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/room/:roomId
async function getRoomReviews(req, res, next) {
  try {
    const reviews = await Review.find({ room: req.params.roomId })
      .populate("user", "name avatarUrl")
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getRoomReviews };
