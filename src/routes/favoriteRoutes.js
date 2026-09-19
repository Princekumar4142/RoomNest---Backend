const express = require("express");
const { getFavorites, addFavorite, removeFavorite } = require("../controllers/favoriteController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getFavorites);
router.post("/:roomId", addFavorite);
router.delete("/:roomId", removeFavorite);

module.exports = router;
