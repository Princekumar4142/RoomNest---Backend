const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  getMe,
  requestOtp,
  verifyOtp,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  submitKyc,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../validation/schemas");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a moment." },
});

const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Please wait a moment before requesting another code." },
});

router.post("/register", validate(schemas.register), register);
router.post("/email/verify", validate(schemas.verifyEmailOtp), verifyEmailOtp);
router.post("/email/resend", otpLimiter, resendEmailOtp);
router.post("/login", authLimiter, validate(schemas.login), login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/kyc", protect, submitKyc);
router.post("/otp/request", otpLimiter, requestOtp);
router.post("/otp/verify", authLimiter, verifyOtp);
router.post("/password/forgot", otpLimiter, validate(schemas.forgotPassword), forgotPassword);
router.post("/password/reset", authLimiter, validate(schemas.resetPassword), resetPassword);

module.exports = router;
