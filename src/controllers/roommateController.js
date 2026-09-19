const RoommatePost = require("../models/RoommatePost");

// GET /api/roommates?city=&genderPreference=&maxBudget=
async function listPosts(req, res, next) {
  try {
    const { city, genderPreference, maxBudget, occupation } = req.query;
    const filter = { isActive: true };
    if (city) filter.city = new RegExp(`^${city}$`, "i");
    if (genderPreference && genderPreference !== "Any") filter.genderPreference = genderPreference;
    if (occupation) filter.occupation = occupation;
    if (maxBudget) filter.budgetMin = { $lte: Number(maxBudget) };

    const posts = await RoommatePost.find(filter)
      .populate("user", "name avatarUrl phone email")
      .sort({ createdAt: -1 })
      .limit(60);

    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

// POST /api/roommates
async function createPost(req, res, next) {
  try {
    const post = await RoommatePost.create({ ...req.body, user: req.user._id });
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

// GET /api/roommates/mine
async function myPosts(req, res, next) {
  try {
    const posts = await RoommatePost.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/roommates/:id
async function deletePost(req, res, next) {
  try {
    const post = await RoommatePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own post." });
    }
    await post.deleteOne();
    res.json({ message: "Post removed." });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPosts, createPost, myPosts, deletePost };
