// User.js
// This defines what a "User" looks like in our MongoDB database.
// Every manager and employee is stored here.
// 'skills' is the key field — Grok AI uses it to match employees to projects.

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Firebase UID links this MongoDB record to the Firebase Auth account
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // "manager" can create projects, assign tasks, review reports
    // "employee" can view tasks, submit reports
    role: {
      type: String,
      enum: ["manager", "employee"],
      default: "employee",
    },

    // Example: ["React", "Node.js", "Python", "MongoDB"]
    // Grok AI reads this to pick the best employee for each task
    skills: {
      type: [String],
      default: [],
    },

    // Bio for contextual understanding
    bio: {
      type: String,
      default: "",
    },

    // A simple record of project involvement
    pastProjects: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
        title: { type: String },
        status: { type: String },
      },
    ],

    experience: {
      type: Number,
      default: 0,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("User", UserSchema);