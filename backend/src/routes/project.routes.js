// project.routes.js
// Defines all /api/projects endpoints.
// Every route is protected by verifyToken (must be logged in).
// Create, update, delete are restricted to managers via roleCheck.
// GET routes use requireAuth so both managers and employees can access them.

const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");
const requireAuth = require("../middleware/requireAuth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const {
  verifyProjectAccess,
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/project.controller");

// POST /api/projects/verify-access — employee-only
router.post(
  "/verify-access",
  verifyToken,
  roleCheck("employee"),
  verifyProjectAccess
);

// POST /api/projects — create new project (managers only)
router.post(
  "/",
  verifyToken,
  roleCheck("manager"),
  upload.single("transcript"),
  createProject
);

// GET /api/projects — both roles
// Manager sees projects they created
// Employee sees projects they are assigned to
// (the controller handles the difference internally using req.dbUser.role)
router.get(
  "/",
  verifyToken,
  requireAuth,
  getAllProjects
);

// GET /api/projects/:id — both roles can view a single project
router.get(
  "/:id",
  verifyToken,
  requireAuth,
  getProjectById
);

// PUT /api/projects/:id — update project (managers only)
router.put(
  "/:id",
  verifyToken,
  roleCheck("manager"),
  updateProject
);

// DELETE /api/projects/:id — delete project (managers only)
router.delete(
  "/:id",
  verifyToken,
  roleCheck("manager"),
  deleteProject
);

module.exports = router;