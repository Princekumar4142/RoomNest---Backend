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
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many code requests. Please wait a few minutes before trying again." },
});

router.post("/register", otpLimiter, validate(schemas.register), register);
router.post("/email/verify", authLimiter, validate(schemas.verifyEmailOtp), verifyEmailOtp);
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
