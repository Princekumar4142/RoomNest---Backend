const express = require("express");
const { getConversation, sendMessage, getMyConversations } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getMyConversations);
router.get("/:otherUserId", getConversation);
router.post("/", sendMessage);

module.exports = router;
