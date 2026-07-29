const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true }, // `${userId}_${ownerId}_${roomId}`
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    attachmentUrl: { type: String, default: "" },
    attachmentType: { type: String, enum: ["none", "image", "document"], default: "none" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
