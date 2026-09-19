const express = require("express");
const { listPosts, createPost, myPosts, deletePost } = require("../controllers/roommateController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../validation/schemas");

const router = express.Router();

router.get("/", listPosts);
router.get("/mine", protect, myPosts);
router.post("/", protect, validate(schemas.roommatePost), createPost);
router.delete("/:id", protect, deletePost);

module.exports = router;
