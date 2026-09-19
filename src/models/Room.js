const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // Campus & Location
    campus: { type: String, default: "", index: true },
    distanceToCampusKm: { type: Number, default: 1.0, index: true }, // Distance to college gate in km
    walkingTimeMinutes: { type: Number, default: 10 },
    cyclingTimeMinutes: { type: Number, default: 4 },
    transitTimeMinutes: { type: Number, default: 12 },

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

    // Pricing & Transparency
    rent: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    maintenanceCharge: { type: Number, default: 0 },
    electricityCharge: { type: String, default: "Included" },
    waterCharge: { type: String, default: "Included" },
    foodIncluded: { type: Boolean, default: false },
    foodType: { type: String, enum: ["Veg", "Non-veg", "Both", "None"], default: "None" },
    foodChargeMonthly: { type: Number, default: 0 },
    isZeroBrokerage: { type: Boolean, default: true },
    rentAgreementAvailable: { type: Boolean, default: true }, // Formal rent agreement for student address proof

    // Category / Room details
    roomType: {
      type: String,
      enum: ["Single Room", "Shared Room", "PG", "Hostel", "Flat"],
      required: true,
    },
    sharingType: {
      type: String,
      enum: ["Single Room", "2-Sharing", "3-Sharing", "4-Sharing", "Private Flat"],
      default: "Single Room",
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
    totalBeds: { type: Number, default: 1 },
    availableBeds: { type: Number, default: 1 },
    immediateMoveIn: { type: Boolean, default: true },
    availableFrom: { type: Date, default: Date.now },

    // Student Amenities & Facilities
    amenities: {
      wifi: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      attachedBathroom: { type: Boolean, default: false },
      kitchen: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      petFriendly: { type: Boolean, default: false },
      powerBackup: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
      studyTable: { type: Boolean, default: false },
      roWater: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false },
      housekeeping: { type: Boolean, default: false },
      refrigerator: { type: Boolean, default: false },
      geyser: { type: Boolean, default: false },
    },

    images: [{ type: String }],
    videoUrl: { type: String, default: "" },

    // Rules & Timings
    curfewTime: { type: String, default: "No Curfew" }, // e.g. "No Curfew", "10:00 PM", "10:30 PM", "11:00 PM"
    noticePeriod: { type: String, default: "1 Month" },
    rules: [{ type: String }],

    // Owner Contact Details
    contactPerson: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    callingHours: { type: String, default: "9:00 AM - 8:00 PM" },

    // Trust & Verification
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationBadges: [{ type: String }],
    verifiedDate: { type: Date },
    inspectedBy: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    ratingsBreakdown: {
      cleanliness: { type: Number, default: 0 },
      safety: { type: Number, default: 0 },
      ownerBehaviour: { type: Number, default: 0 },
      foodQuality: { type: Number, default: 0 },
      internetSpeed: { type: Number, default: 0 },
      distanceAccuracy: { type: Number, default: 0 },
    },

    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.index({ location: "2dsphere" });
roomSchema.index({ campus: "text", nearbyCollege: "text", title: "text", area: "text", city: "text" });

module.exports = mongoose.model("Room", roomSchema);
