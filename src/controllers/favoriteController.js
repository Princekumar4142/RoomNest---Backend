const User = require("../models/User");

// GET /api/favorites
async function getFavorites(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate("favorites");
    res.json({ favorites: user.favorites });
  } catch (err) {
    next(err);
  }
}

// POST /api/favorites/:roomId
async function addFavorite(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: req.params.roomId } });
    res.json({ message: "Added to favorites." });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/favorites/:roomId
async function removeFavorite(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: req.params.roomId } });
    res.json({ message: "Removed from favorites." });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFavorites, addFavorite, removeFavorite };
