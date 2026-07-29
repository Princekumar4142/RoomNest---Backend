const crypto = require("crypto");
const Booking = require("../models/Booking");

function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

let razorpayInstance = null;
function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  const Razorpay = require("razorpay");
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return razorpayInstance;
}

// POST /api/payments/create-order  { bookingId }
async function createOrder(req, res, next) {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        message:
          "Online payments aren't set up yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend .env (free test keys at dashboard.razorpay.com/app/keys) to enable this.",
      });
    }

    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId is required." });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only pay for your own booking." });
    }
    if (!booking.advanceAmount || booking.advanceAmount <= 0) {
      return res.status(400).json({ message: "This booking has no advance amount due." });
    }
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "This booking has already been paid." });
    }

    const order = await getRazorpay().orders.create({
      amount: Math.round(booking.advanceAmount * 100), // paise
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: { bookingId: booking._id.toString() },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public key, safe to expose to the client
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/verify  { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
async function verifyPayment(req, res, next) {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({ message: "Online payments aren't configured." });
    }

    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "paid", paymentReference: razorpay_payment_id },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    res.json({ message: "Payment verified.", booking });
  } catch (err) {
    next(err);
  }
}

// GET /api/payments/status
async function paymentStatus(req, res) {
  res.json({ enabled: isRazorpayConfigured() });
}

module.exports = { createOrder, verifyPayment, paymentStatus };
