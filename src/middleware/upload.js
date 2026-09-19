const multer = require("multer");

// Always buffer in memory - uploadController decides whether to forward the
// buffer to Cloudinary (if configured) or write it to local disk (fallback).
const storage = multer.memoryStorage();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
    files: 8, // max images per listing
  },
});

module.exports = upload;
