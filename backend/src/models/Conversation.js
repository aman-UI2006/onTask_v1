// Conversation.js
// Stores global chat history for contextual memory.
// Grok AI reads this for every request to maintain context.

const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    // The user (manager or employee) this history belongs to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One global history per user
    },

    // Array of message objects
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
