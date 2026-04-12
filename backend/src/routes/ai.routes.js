// ai.routes.js
// All AI-powered endpoints.
// Only managers can trigger AI actions — employees can't.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");
const {
  selectEmployees,
  generateWorkflow,
  generateFeedback,
  chat,
  employeeChat,
  generateManualEmail,
  formTeams,
  generateEnhancedEmail,
  getEmployees,
  allocateTasks,
  commitTasks,
} = require("../controllers/ai.controller");

// POST /api/ai/select-employees
// Manager triggers this after creating a project
router.post("/select-employees", verifyToken, roleCheck("manager"), selectEmployees);

// POST /api/ai/form-teams
// Manager triggers this for systematic team formation
router.post("/form-teams", verifyToken, roleCheck("manager"), formTeams);

// POST /api/ai/generate-workflow
// Manager triggers this after employees are selected
router.post("/generate-workflow", verifyToken, roleCheck("manager"), generateWorkflow);

// POST /api/ai/generate-feedback
// Manager triggers this after employee submits a report
router.post("/generate-feedback", verifyToken, roleCheck("manager"), generateFeedback);

// POST /api/ai/chat
// Global contextual chat for managers (can perform actions)
router.post("/chat", verifyToken, roleCheck("manager"), chat);

// POST /api/ai/employee-chat
// Global contextual assistant for employees
router.post("/employee-chat", verifyToken, roleCheck("employee"), employeeChat);

// POST /api/ai/generate-email
// Generate email with tone selection
router.post("/generate-email", verifyToken, roleCheck("manager"), generateManualEmail);

// POST /api/ai/generate-enhanced-email
// Enhanced email generation with context
router.post("/generate-enhanced-email", verifyToken, roleCheck("manager"), generateEnhancedEmail);

// GET /api/ai/employees
// Get all employees for selection/management
router.get("/employees", verifyToken, roleCheck("manager"), getEmployees);

// POST /api/ai/allocate-tasks
router.post("/allocate-tasks", verifyToken, roleCheck("manager"), allocateTasks);

// POST /api/ai/commit-tasks
router.post("/commit-tasks", verifyToken, roleCheck("manager"), commitTasks);

module.exports = router;