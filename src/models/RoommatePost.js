const mongoose = require("mongoose");

const roommatePostSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    city: { type: String, required: true, index: true },
    area: { type: String, default: "" },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },

    genderPreference: {
      type: String,
      enum: ["Male", "Female", "Any"],
      default: "Any",
    },
    moveInDate: { type: Date },
    aboutMe: { type: String, default: "" },
    lookingFor: { type: String, default: "" }, // e.g. "1 flatmate for 2BHK near HITEC City"
    occupation: {
      type: String,
      enum: ["Student", "Working Professional", "Intern", "Other"],
      default: "Student",
    },
    habits: {
      smoking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      foodPreference: { type: String, enum: ["Veg", "Non-Veg", "Either"], default: "Either" },
    },
    contactVisible: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoommatePost", roommatePostSchema);
