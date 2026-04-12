// issue.routes.js
// Handles raising and managing issues/doubts by employees on their assigned tasks.

const express = require("express");
const Issue = require("../models/Issue");
const Task = require("../models/Task");
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

/**
 * POST /api/issues/raise
 * Employee raises an issue on their assigned task
 * Middleware: verifyToken, roleCheck
 */
router.post("/raise", verifyToken, roleCheck("employee"), async (req, res) => {
  try {
    const { projectId, taskId, title, description } = req.body;

    // Validate required fields
    if (!projectId || !taskId || !title) {
      return res.status(400).json({
        message: "projectId, taskId, and title are required",
      });
    }

    // Verify the task exists and is assigned to this employee
    const task = await Task.findOne({
      _id: taskId,
      projectId: projectId,
      assignedTo: req.dbUser._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or not assigned to you",
      });
    }

    // Create new issue
    const issue = new Issue({
      projectId: projectId,
      taskId: taskId,
      raisedBy: req.dbUser._id,
      title: title,
      description: description || "",
    });

    const savedIssue = await issue.save();

    return res.status(201).json({
      success: true,
      issue: savedIssue,
    });
  } catch (error) {
    console.error("Raise issue error:", error.message);
    return res.status(500).json({
      message: "Failed to raise issue",
      error: error.message,
    });
  }
});

/**
 * GET /api/issues/project/:projectId
 * Manager views all issues for a project
 * Middleware: verifyToken, roleCheck (manager only)
 */
router.get(
  "/project/:projectId",
  verifyToken,
  roleCheck("manager"),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      // Find all issues for this project
      const issues = await Issue.find({ projectId })
        .populate("raisedBy", "name email")
        .populate("taskId", "title")
        .sort({ createdAt: -1 }); // Most recent first

      return res.status(200).json({ issues });
    } catch (error) {
      console.error("Get project issues error:", error.message);
      return res.status(500).json({
        message: "Failed to fetch issues",
        error: error.message,
      });
    }
  }
);

/**
 * PATCH /api/issues/:issueId/resolve
 * Manager resolves an issue
 * Middleware: verifyToken, roleCheck (manager only)
 */
router.patch(
  "/:issueId/resolve",
  verifyToken,
  roleCheck("manager"),
  async (req, res) => {
    try {
      const { issueId } = req.params;

      // Find and update the issue
      const issue = await Issue.findById(issueId);

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      issue.status = "resolved";
      const updatedIssue = await issue.save();

      return res.status(200).json({
        success: true,
        issue: updatedIssue,
      });
    } catch (error) {
      console.error("Resolve issue error:", error.message);
      return res.status(500).json({
        message: "Failed to resolve issue",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/issues/my-issues
 * Employee views their own raised issues
 * Middleware: verifyToken, roleCheck (employee only)
 * Query params: projectId (optional filter)
 */
router.get(
  "/my-issues",
  verifyToken,
  roleCheck("employee"),
  async (req, res) => {
    try {
      const { projectId } = req.query;

      // Build query
      const query = { raisedBy: req.dbUser._id };

      // Add projectId filter if provided
      if (projectId) {
        query.projectId = projectId;
      }

      // Find issues raised by this employee
      const issues = await Issue.find(query)
        .populate("taskId", "title")
        .sort({ createdAt: -1 }); // Most recent first

      return res.status(200).json({ issues });
    } catch (error) {
      console.error("Get my issues error:", error.message);
      return res.status(500).json({
        message: "Failed to fetch issues",
        error: error.message,
      });
    }
  }
);

module.exports = router;
