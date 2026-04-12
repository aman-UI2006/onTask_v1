// notification.routes.js
// Endpoints for fetching and managing dashboard alerts.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notification.controller");

// GET /api/notifications
// Retrieves notifications for the current user
router.get("/", verifyToken, getNotifications);

// PATCH /api/notifications/:notificationId
// Marks a single notification as read
router.patch("/:notificationId", verifyToken, markAsRead);

// PATCH /api/notifications/mark-all/read
// Marks all as read
router.patch("/mark-all/read", verifyToken, markAllAsRead);

module.exports = router;
