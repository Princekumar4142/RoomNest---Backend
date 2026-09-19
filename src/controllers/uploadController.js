const { storeImage } = require("../utils/imageStorage");

// POST /api/uploads/images  (multipart/form-data, field name: "images")
async function uploadImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images were uploaded." });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = await Promise.all(req.files.map((file) => storeImage(file, baseUrl)));

    res.status(201).json({ urls });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImages };
