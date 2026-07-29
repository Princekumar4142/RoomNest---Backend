const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
    avatarUrl: { type: String, default: "" },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isIdentityVerified: { type: Boolean, default: false },
    // Owner-specific verification (only relevant when role === "owner")
    ownerVerification: {
      aadhaarOrPan: { type: String, default: "" },
      documentUrl: { type: String, default: "" },
      status: {
        type: String,
        enum: ["unverified", "pending", "verified", "rejected"],
        default: "unverified",
      },
    },
    isSuspended: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
