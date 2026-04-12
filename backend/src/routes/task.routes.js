// task.routes.js
// All task-related endpoints.
// Both managers and employees can access tasks
// but see different data based on their role.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");
const requireAuth = require("../middleware/requireAuth");
const {
  getTasksByProject,
  getMyTasks,
  updateTaskStatus,
  getTaskById,
} = require("../controllers/task.controller");

// GET /api/tasks/my-tasks — employee sees all their tasks across all projects
// NOTE: must come BEFORE /:id to avoid Express treating "my-tasks" as an id
router.get(
  "/my-tasks",
  verifyToken,
  roleCheck("employee"),
  getMyTasks
);

// GET /api/tasks/project/:projectId — manager sees all tasks for a project
router.get(
  "/project/:projectId",
  verifyToken,
  roleCheck("manager"),
  getTasksByProject
);

// GET /api/tasks/:id — both roles can view a single task
router.get(
  "/:id",
  verifyToken,
  requireAuth,
  getTaskById
);

// PUT /api/tasks/:id/status — employee updates their task status
router.put(
  "/:id/status",
  verifyToken,
  roleCheck("employee"),
  updateTaskStatus
);

module.exports = router;
