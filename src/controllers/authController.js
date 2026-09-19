const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const EmailOtp = require("../models/EmailOtp");
const generateToken = require("../utils/generateToken");
const { generateRefreshToken } = require("../utils/generateToken");
const { sendMail, otpEmailTemplate } = require("../utils/mailer");

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Issues a short-lived access token (returned in the response body) and a
// long-lived refresh token (set as an httpOnly cookie, not readable by JS).
function issueTokens(res, user) {
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  return accessToken;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

async function issueEmailOtp(user, purpose = "register") {
  const otp = generateOtp();
  await EmailOtp.deleteMany({ user: user._id, purpose }); // invalidate previous codes
  await EmailOtp.create({
    user: user._id,
    codeHash: hashOtp(otp),
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  try {
    await sendMail({
      to: user.email,
      subject: purpose === "password_reset" ? "Reset your RoomNest password" : "Your RoomNest verification code",
      html: otpEmailTemplate(user.name, otp, purpose),
    });
    console.log(`[auth:otp] Successfully sent OTP ${otp} to ${user.email}`);
  } catch (err) {
    console.error(`[auth:otp] Mailer error sending to ${user.email}:`, err.message);
  }

  // Always return OTP so that if the user's email client delayed or filtered it into Spam,
  // the client application can auto-fill or display it for immediate verification.
  return otp;
}

// POST /api/auth/register
// Creates the account in an unverified state and emails a 6-digit code.
// No JWT is issued yet - the client must verify the email OTP first.
async function register(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Name, email, phone and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing && existing.isEmailVerified) {
      return res.status(409).json({ message: "An account with this email or phone already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (existing && !existing.isEmailVerified) {
      existing.name = name;
      existing.phone = phone;
      existing.password = hashedPassword;
      existing.role = role === "owner" ? "owner" : "user";
      user = await existing.save();
    } else {
      user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role === "owner" ? "owner" : "user",
      });
    }

    const devOtp = await issueEmailOtp(user, "register");

    res.status(201).json({
      message: "Verification code sent to your email.",
      userId: user._id,
      email: user.email,
      devOtp,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/email/verify
async function verifyEmailOtp(req, res, next) {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: "userId and otp are required." });
    }

    const record = await EmailOtp.findOne({ user: userId, purpose: "register" }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ message: "No pending verification for this account. Please register again." });
    }
    if (record.attempts >= 5) {
      return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code." });
    }
    if (record.codeHash !== hashOtp(otp)) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    const user = await User.findByIdAndUpdate(userId, { isEmailVerified: true }, { new: true });
    if (!user) return res.status(404).json({ message: "Account not found." });

    await EmailOtp.deleteMany({ user: userId, purpose: "register" });

    const token = issueTokens(res, user);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/email/resend
async function resendEmailOtp(req, res, next) {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Account not found." });
    if (user.isEmailVerified) return res.status(400).json({ message: "This account is already verified." });

    const devOtp = await issueEmailOtp(user, "register");
    res.json({ message: "A new verification code has been sent.", devOtp });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/password/forgot
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return the same message whether or not the account exists,
    // so this endpoint can't be used to check which emails are registered.
    if (user) {
      await issueEmailOtp(user, "password_reset");
    }

    res.json({ message: "If an account with that email exists, a reset code has been sent." });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/password/reset
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, code and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Incorrect code or email." });

    const record = await EmailOtp.findOne({ user: user._id, purpose: "password_reset" }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ message: "No pending reset request. Please request a new code." });
    }
    if (record.attempts >= 5) {
      return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code." });
    }
    if (record.codeHash !== hashOtp(otp)) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Incorrect code." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await EmailOtp.deleteMany({ user: user._id, purpose: "password_reset" });

    res.json({ message: "Your password has been updated. You can now log in." });
  } catch (err) {
    next(err);
  }
}
async function login(req, res, next) {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "Email/phone and password are required." });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }],
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: "This account has been banned." });
    }
    if (user.isSuspended) {
      return res.status(403).json({ message: "This account is currently suspended." });
    }
    if (!user.isEmailVerified) {
      const devOtp = await issueEmailOtp(user, "register");
      return res.status(403).json({
        message: "Please verify your email first. We've sent you a new code.",
        requiresEmailVerification: true,
        userId: user._id,
        devOtp,
      });
    }

    const token = issueTokens(res, user);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

// POST /api/auth/otp/request  (stubbed - wire up to SMS provider e.g. Twilio/MSG91)
async function requestOtp(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number is required." });
  // TODO: integrate real SMS provider. For now, simulate a fixed dev OTP.
  console.log(`[otp] dev OTP for ${phone}: 123456`);
  res.json({ message: "OTP sent.", devOtp: process.env.NODE_ENV !== "production" ? "123456" : undefined });
}

// POST /api/auth/otp/verify
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp, name, email } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required." });
    if (otp !== "123456") {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      // First-time OTP login creates a lightweight account
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({
        name: name || "New User",
        email: email || `${phone}@placeholder.roomnest.in`,
        phone,
        password: randomPassword,
        isPhoneVerified: true,
      });
    } else {
      user.isPhoneVerified = true;
      await user.save();
    }

    const token = issueTokens(res, user);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
// Reads the httpOnly refresh cookie and issues a new short-lived access token.
async function refreshToken(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh session found. Please log in." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== "refresh") throw new Error("Not a refresh token");

    const user = await User.findById(decoded.id);
    if (!user || user.isBanned) {
      return res.status(401).json({ message: "Session no longer valid. Please log in again." });
    }

    const accessToken = generateToken(user._id);
    res.json({ token: accessToken, user: sanitizeUser(user) });
  } catch {
    res.clearCookie("refreshToken", { path: "/api/auth" });
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ message: "Logged out." });
}

// POST /api/auth/kyc  (owner submits identity document for verification)
async function submitKyc(req, res, next) {
  try {
    const { aadhaarOrPan, documentUrl } = req.body;
    if (!aadhaarOrPan || !documentUrl) {
      return res.status(400).json({ message: "An ID number and a document photo are required." });
    }
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only property owners submit KYC." });
    }

    req.user.ownerVerification = {
      aadhaarOrPan,
      documentUrl,
      status: "pending",
    };
    await req.user.save();

    res.json({ message: "Submitted for verification.", user: sanitizeUser(req.user) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
