const express = require("express");
const upload = require("../middleware/upload");
const { uploadImages } = require("../controllers/uploadController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.post("/images", protect, restrictTo("owner", "admin"), upload.array("images", 8), uploadImages);

module.exports = router;
