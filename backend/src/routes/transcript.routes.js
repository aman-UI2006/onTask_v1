// transcript.routes.js
// Defines transcript upload endpoints under /api/transcripts.
// Uses multer memory storage so files are processed in-memory (no disk writes).

const express = require("express");
const multer = require("multer");

const verifyToken = require("../middleware/verifyToken");
const requireAuth = require("../middleware/requireAuth");
const roleCheck = require("../middleware/roleCheck");

const { uploadTranscript } = require("../controllers/transcript.controller");

const router = express.Router();

// Multer configuration: store uploaded file in memory as Buffer.
const upload = multer({
  storage: multer.memoryStorage(),
  // Keep a reasonable size limit to avoid memory abuse.
  // You can increase later if needed.
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/transcripts/upload (manager-only)
// multipart/form-data:
// - transcript: file (PDF/DOCX/TXT)
// - projectId: string field
router.post(
  "/upload",
  verifyToken,
  requireAuth,
  roleCheck("manager"),
  upload.single("transcript"),
  uploadTranscript
);

module.exports = router;

