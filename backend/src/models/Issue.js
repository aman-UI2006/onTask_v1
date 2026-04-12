// Issue.js
// Tracks issues/bugs raised by team members for specific tasks within a project.

const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
  {
    // Which project this issue belongs to
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // Which task this issue is related to
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    // Who raised this issue
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Short title describing the issue
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Detailed description of the issue
    description: {
      type: String,
      default: "",
    },

    // Current status of the issue
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },

    // When the issue was created
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Automatically adds updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", IssueSchema);
