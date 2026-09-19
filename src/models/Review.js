const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    ratings: {
      cleanliness: { type: Number, min: 1, max: 5, required: true },
      safety: { type: Number, min: 1, max: 5, required: true },
      ownerBehaviour: { type: Number, min: 1, max: 5, required: true },
      internet: { type: Number, min: 1, max: 5, required: true },
      waterSupply: { type: Number, min: 1, max: 5, required: true },
      electricity: { type: Number, min: 1, max: 5, required: true },
    },
    overallRating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },

    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ room: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
