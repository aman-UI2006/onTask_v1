// report.routes.js
// All report-related endpoints.
// Employees submit reports, managers review them.

const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const {
  submitReport,
  getReportByTask,
  getReportsByProject,
  addManagerComment,
  getMyReports,
} = require("../controllers/report.controller");

// POST /api/reports — employee submits a report
router.post("/", verifyToken, roleCheck("employee"), upload.single("attachment"), submitReport);

// GET /api/reports/my-reports — employee views their reports
// NOTE: must come BEFORE /:id routes
router.get("/my-reports", verifyToken, roleCheck("employee"), getMyReports);

// GET /api/reports/task/:taskId — view report for a specific task
router.get("/task/:taskId", verifyToken, roleCheck("manager"), getReportByTask);

// GET /api/reports/project/:projectId — manager views all reports
router.get("/project/:projectId", verifyToken, roleCheck("manager"), getReportsByProject);

// PUT /api/reports/:id/comment — manager adds comment
router.put("/:id/comment", verifyToken, roleCheck("manager"), addManagerComment);

module.exports = router;