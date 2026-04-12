// Notification.js
// Stores all events for the manager and employee dashboards.
// Helps trigger review loops, task assignments, and feedback loops.

const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // The user who receives this notification
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The user who triggered this notification (optional)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Notification type
    type: {
      type: String,
      enum: [
        "submission",    // Employee submits a report
        "feedback",      // Manager provides feedback
        "task_assigned", // New task assigned
        "approved",      // Work approved
        "revision",      // Work needs revision
      ],
      required: true,
    },

    // Brief content/summary for the UI
    content: {
      type: String,
      required: true,
    },

    // Related task/report for quick navigation
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);
