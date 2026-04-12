// Report.js
// An employee submits a report when they complete a task.
// The manager (or AI) reviews it and gives feedback.

const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    // Which task this report is for
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    // Which employee submitted this report
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The actual report content written by the employee
    content: {
      type: String,
      required: true,
    },

    // Status of the report after manager/AI review
    status: {
      type: String,
      enum: ["submitted", "approved", "needs_revision"],
      default: "submitted",
    },

    // AI-generated feedback object from Grok
    // Filled after manager triggers /api/ai/generate-feedback
    aiFeedback: {
      rating: { type: Number, default: null },
      strengths: { type: String, default: "" },
      improvements: { type: String, default: "" },
      recommendation: { type: String, default: "" },
      detailedFeedback: { type: String, default: "" },
    },

    // Manager's own written comment (optional)
    managerComment: {
      type: String,
      default: "",
    },
    // URL or Path to the attached file for this submission
    attachmentUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", ReportSchema);