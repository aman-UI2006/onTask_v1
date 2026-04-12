// email.routes.js
// Defines manager-only email endpoints under /api/email.
// Follows the same middleware chaining style used in project.routes.js.

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const requireAuth = require("../middleware/requireAuth");
const roleCheck = require("../middleware/roleCheck");

const { sendProjectEmail } = require("../controllers/email.controller");

// POST /api/email/send-project-email — manager-only
router.post(
  "/send-project-email",
  verifyToken,
  requireAuth,
  roleCheck("manager"),
  sendProjectEmail
);

// POST /api/email/send-consolidated — manager-only AI campaign launch
router.post(
  "/send-consolidated",
  verifyToken,
  requireAuth,
  roleCheck("manager"),
  require("../controllers/email.controller").sendConsolidatedEmail
);

module.exports = router;
