const Message = require("../models/Message");

function buildConversationId(userA, userB, roomId) {
  const ids = [userA.toString(), userB.toString()].sort();
  return `${ids[0]}_${ids[1]}_${roomId || "general"}`;
}

// GET /api/messages  (list all conversation threads for the logged-in user)
async function getMyConversations(req, res, next) {
  try {
    const userId = req.user._id.toString();

    const messages = await Message.find({ $or: [{ sender: req.user._id }, { recipient: req.user._id }] })
      .sort({ createdAt: -1 })
      .populate("sender", "name avatarUrl")
      .populate("recipient", "name avatarUrl")
      .populate("room", "title images");

    const conversations = new Map();
    for (const m of messages) {
      if (conversations.has(m.conversationId)) continue;
      const otherUser = m.sender._id.toString() === userId ? m.recipient : m.sender;
      conversations.set(m.conversationId, {
        conversationId: m.conversationId,
        otherUser,
        room: m.room || null,
        lastMessage: m.text,
        lastMessageAt: m.createdAt,
        unread: !m.readAt && m.recipient._id.toString() === userId,
      });
    }

    res.json({ conversations: Array.from(conversations.values()) });
  } catch (err) {
    next(err);
  }
}

// GET /api/messages/:otherUserId?roomId=...
async function getConversation(req, res, next) {
  try {
    const conversationId = buildConversationId(req.user._id, req.params.otherUserId, req.query.roomId);
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.json({ conversationId, messages });
  } catch (err) {
    next(err);
  }
}

// POST /api/messages
async function sendMessage(req, res, next) {
  try {
    const { recipientId, roomId, text, attachmentUrl, attachmentType } = req.body;
    const conversationId = buildConversationId(req.user._id, recipientId, roomId);

    const message = await Message.create({
      conversationId,
      room: roomId,
      sender: req.user._id,
      recipient: recipientId,
      text,
      attachmentUrl,
      attachmentType: attachmentType || "none",
    });

    // Emit over socket.io if available (attached to app in server.js)
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("newMessage", message);
      io.to(`user:${recipientId}`).emit("notification", {
        type: "message",
        message: `New message: "${text?.slice(0, 60) || "Attachment"}"`,
        conversationId,
      });
    }

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

module.exports = { getConversation, sendMessage, getMyConversations, buildConversationId };
