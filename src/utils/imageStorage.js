const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const streamifier = require("streamifier");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

let cloudinary = null;
function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

function getCloudinary() {
  if (cloudinary) return cloudinary;
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      { folder: "roomnest/listings", resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

function uploadToLocalDisk(buffer, originalname, baseUrl) {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const unique = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(originalname).toLowerCase() || ".jpg";
  const filename = `${Date.now()}-${unique}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return `${baseUrl}/uploads/${filename}`;
}

/**
 * Stores an uploaded file buffer and returns its public URL.
 * Uses Cloudinary if credentials are set in .env, otherwise falls back to
 * writing the file to backend/uploads/ (fine for local dev / small deployments,
 * but ephemeral on most hosts - see README for production guidance).
 */
async function storeImage(file, baseUrl) {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file.buffer);
  }
  return uploadToLocalDisk(file.buffer, file.originalname, baseUrl);
}

module.exports = { storeImage, isCloudinaryConfigured };
