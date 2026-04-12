// task.controller.js
// Handles all task-related business logic.
// Tasks are created by Grok AI (Day 3) — here we just read and update them.
// Employees can view their tasks and update status.
// Managers can view all tasks for a project.

const Task = require("../models/Task");
const Project = require("../models/Project");

// ─── GET ALL TASKS FOR A PROJECT ──────────────────────────────
// GET /api/tasks/project/:projectId
// Manager sees all tasks, employee sees only their assigned tasks
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    let tasks = [];

    const userRole = req.dbUser?.role || "employee";

    if (userRole === "manager") {
      // Manager sees ALL tasks in the project
      tasks = await Task.find({ projectId })
        .populate("assignedTo", "name email skills") // get employee details
        .sort({ createdAt: -1 });
    } else {
      // Employee sees ONLY their own tasks
      const userId = req.dbUser?._id;
      if (userId) {
        tasks = await Task.find({
          projectId,
          assignedTo: userId,
        })
          .populate("assignedTo", "name email")
          .sort({ createdAt: -1 });
      }
    }

    return res.status(200).json({ tasks: tasks || [] });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// ─── GET MY TASKS ─────────────────────────────────────────────
// GET /api/tasks/my-tasks
// Employee calls this to see all their tasks across ALL projects
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.dbUser._id })
      .populate("projectId", "title status deadline") // get project info
      .sort({ createdAt: -1 });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get my tasks error:", error.message);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// ─── UPDATE TASK STATUS ───────────────────────────────────────
// PUT /api/tasks/:id/status
// Employee updates their task status as they work on it
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value
    const allowedStatuses = ["pending", "in_progress", "completed", "needs_revision"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    // Find the task — make sure it belongs to this employee
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.dbUser._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or not assigned to you",
      });
    }

    task.status = status;
    await task.save();

    return res.status(200).json({
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task status error:", error.message);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// ─── GET SINGLE TASK ──────────────────────────────────────────
// GET /api/tasks/:id
// Both manager and employee can view a single task
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email skills")
      .populate("projectId", "title status");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error("Get task error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTasksByProject,
  getMyTasks,
  updateTaskStatus,
  getTaskById,
};