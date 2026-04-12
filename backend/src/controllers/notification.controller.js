// notification.controller.js
// Handles fetching and marking notifications as read.

const Notification = require("../models/Notification");

// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error.message);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error.message);
    return res.status(500).json({ message: "Failed to update notification" });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ recipientId: userId }, { isRead: true });
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error.message);
    return res.status(500).json({ message: "Failed to update notifications" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
