const Joi = require("joi");

const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{7,15}$/).required().messages({
      "string.pattern.base": "Enter a valid phone number.",
    }),
    password: Joi.string().min(6).max(72).required(),
    role: Joi.string().valid("user", "owner").optional(),
  }),

  login: Joi.object({
    emailOrPhone: Joi.string().trim().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().trim().email().required(),
  }),

  resetPassword: Joi.object({
    email: Joi.string().trim().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
    newPassword: Joi.string().min(6).max(72).required(),
  }),

  verifyEmailOtp: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  room: Joi.object({
    title: Joi.string().trim().min(5).max(140).required(),
    description: Joi.string().allow("").max(3000),
    city: Joi.string().trim().min(2).max(60).required(),
    area: Joi.string().trim().min(2).max(60).required(),
    address: Joi.string().trim().min(5).max(240).required(),
    landmark: Joi.string().allow("").max(120),
    nearbyCollege: Joi.string().allow("").max(120),
    nearbyCompanyHub: Joi.string().allow("").max(120),
    nearbyMetroStation: Joi.string().allow("").max(120),
    nearbyRailwayStation: Joi.string().allow("").max(120),
    location: Joi.object({
      type: Joi.string().valid("Point"),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }).optional(),
    rent: Joi.number().min(500).max(2000000).required(),
    deposit: Joi.number().min(0).max(5000000),
    electricityCharge: Joi.string().allow("").max(60),
    waterCharge: Joi.string().allow("").max(60),
    maintenanceCharge: Joi.number().min(0).max(200000),
    roomType: Joi.string().valid("Single Room", "Shared Room", "PG", "Hostel", "Flat").required(),
    occupancy: Joi.string().valid("Boys", "Girls", "Family", "Co-ed").required(),
    furnishing: Joi.string().valid("Furnished", "Semi Furnished", "Unfurnished"),
    amenities: Joi.object({
      ac: Joi.boolean(),
      attachedBathroom: Joi.boolean(),
      kitchen: Joi.boolean(),
      parking: Joi.boolean(),
      wifi: Joi.boolean(),
      petFriendly: Joi.boolean(),
      powerBackup: Joi.boolean(),
      laundry: Joi.boolean(),
    }),
    images: Joi.array().items(Joi.string().uri()).min(1).max(8).required(),
    videoUrl: Joi.string().uri().allow(""),
    availableFrom: Joi.date().optional(),
    rules: Joi.array().items(Joi.string().max(200)).max(20),
  }),

  booking: Joi.object({
    roomId: Joi.string().hex().length(24).required(),
    type: Joi.string().valid("visit", "booking"),
    visitScheduledFor: Joi.date().greater("now").optional(),
    advanceAmount: Joi.number().min(0).max(1000000),
    notes: Joi.string().allow("").max(500),
  }),

  review: Joi.object({
    roomId: Joi.string().hex().length(24).required(),
    ratings: Joi.object({
      cleanliness: Joi.number().min(1).max(5).required(),
      safety: Joi.number().min(1).max(5).required(),
      ownerBehaviour: Joi.number().min(1).max(5).required(),
      internet: Joi.number().min(1).max(5).required(),
      waterSupply: Joi.number().min(1).max(5).required(),
      electricity: Joi.number().min(1).max(5).required(),
    }).required(),
    comment: Joi.string().allow("").max(1000),
  }),

  roommatePost: Joi.object({
    city: Joi.string().trim().min(2).max(60).required(),
    area: Joi.string().allow("").max(60),
    budgetMin: Joi.number().min(0).max(1000000).required(),
    budgetMax: Joi.number().min(Joi.ref("budgetMin")).max(1000000).required(),
    genderPreference: Joi.string().valid("Male", "Female", "Any"),
    moveInDate: Joi.date().optional(),
    aboutMe: Joi.string().allow("").max(500),
    lookingFor: Joi.string().trim().min(3).max(200).required(),
    occupation: Joi.string().valid("Student", "Working Professional", "Intern", "Other"),
    habits: Joi.object({
      smoking: Joi.boolean(),
      pets: Joi.boolean(),
      foodPreference: Joi.string().valid("Veg", "Non-Veg", "Either"),
    }),
  }),
};

// Express middleware factory: validate(schemas.register)
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const message = error.details.map((d) => d.message).join(" ");
      return res.status(400).json({ message });
    }
    req.body = value;
    next();
  };
}

module.exports = { schemas, validate };
