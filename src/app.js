const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const messageRoutes = require("./routes/messageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const roommateRoutes = require("./routes/roommateRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://roomnest-backend-pnf5.onrender.com/api",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "roomnest-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/roommates", roommateRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
