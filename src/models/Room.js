const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // Location
    city: { type: String, required: true, index: true },
    area: { type: String, required: true, index: true },
    address: { type: String, required: true },
    landmark: { type: String, default: "" },
    nearbyCollege: { type: String, default: "" },
    nearbyCompanyHub: { type: String, default: "" },
    nearbyMetroStation: { type: String, default: "" },
    nearbyRailwayStation: { type: String, default: "" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // Pricing
    rent: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    electricityCharge: { type: String, default: "Included" },
    waterCharge: { type: String, default: "Included" },
    maintenanceCharge: { type: Number, default: 0 },

    // Category / type
    roomType: {
      type: String,
      enum: ["Single Room", "Shared Room", "PG", "Hostel", "Flat"],
      required: true,
    },
    occupancy: {
      type: String,
      enum: ["Boys", "Girls", "Family", "Co-ed"],
      required: true,
    },
    furnishing: {
      type: String,
      enum: ["Furnished", "Semi Furnished", "Unfurnished"],
      default: "Semi Furnished",
    },

    amenities: {
      ac: { type: Boolean, default: false },
      attachedBathroom: { type: Boolean, default: false },
      kitchen: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      petFriendly: { type: Boolean, default: false },
      powerBackup: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
    },

    images: [{ type: String }],
    videoUrl: { type: String, default: "" },

    availableFrom: { type: Date, default: Date.now },
    rules: [{ type: String }],

    // Trust & moderation
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isActive: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.index({ location: "2dsphere" });
roomSchema.index({ title: "text", area: "text", city: "text", nearbyCollege: "text" });

module.exports = mongoose.model("Room", roomSchema);
