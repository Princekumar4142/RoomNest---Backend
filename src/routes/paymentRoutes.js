const express = require("express");
const { createOrder, verifyPayment, paymentStatus } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/status", paymentStatus);
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;
