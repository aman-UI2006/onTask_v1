// Project.js
// Defines what a "Project" looks like in MongoDB.
// A project is created by a manager and contains:
// - basic info (title, description)
// - list of selected employees (filled by Grok AI later)
// - list of required skills (used by Grok to pick employees)
// - status to track project lifecycle
// - inviteCode so selected employees can join

const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    // Project title — e.g. "Build E-commerce Website"
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Detailed description of what the project involves
    description: {
      type: String,
      required: true,
    },

    // Links to the User document of the manager who created this project
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Skills needed for this project — Grok AI reads this to pick employees
    // Example: ["React", "Node.js", "MongoDB"]
    requiredSkills: {
      type: [String],
      default: [],
    },

    // Array of User ObjectIds — employees selected by Grok AI
    // Starts empty, gets filled when manager triggers AI selection
    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Tracks where the project is in its lifecycle
    status: {
      type: String,
      enum: ["planning", "active", "review", "completed", "on_hold"],
      default: "planning",
    },

    // Optional deadline for the whole project
    deadline: {
      type: Date,
      default: null,
    },

    // 6-character code sent to selected employees so they can join this project
    // Generated when manager triggers AI selection
    inviteCode: {
      type: String,
      default: null,
    },

    // Stores extracted text from uploaded transcripts (PDF/DOCX/TXT).
    // Manager uploads a transcript to give AI additional project context.
    transcriptContext: {
      type: String,
      default: "",
    },

    // Per-employee access codes (PROJ-XXXX). Set when manager sends project emails.
    // Required in schema or Mongoose strict mode strips it on save and verify always fails.
    employeeAccessCodes: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        accessCode: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    // Stores the structured AI-generated teams and rationale
    crewData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", ProjectSchema);