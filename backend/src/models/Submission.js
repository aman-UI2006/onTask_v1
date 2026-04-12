// Submission.js
// Tracks file submissions made by employees for specific tasks within a project.

const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    // Which project this submission belongs to
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // Which task this submission is for
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    // Which employee made this submission
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // URL where the submitted file is stored
    fileUrl: {
      type: String,
      default: null,
    },

    // Original name of the submitted file
    fileName: {
      type: String,
      default: null,
    },

    // Size of the submitted file in bytes
    fileSize: {
      type: Number,
      default: null,
    },

    // When the file was uploaded
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", SubmissionSchema);
