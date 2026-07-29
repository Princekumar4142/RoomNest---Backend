function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "Each image must be smaller than 5MB.",
      LIMIT_FILE_COUNT: "You can upload up to 8 images per listing.",
      LIMIT_UNEXPECTED_FILE: "Too many images, or an unexpected upload field.",
    };
    return res.status(400).json({ message: messages[err.code] || "Image upload failed." });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `${field} already in use.` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Something went wrong on our end.",
  });
}

module.exports = { notFound, errorHandler };
