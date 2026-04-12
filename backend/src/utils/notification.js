// notification.js
// Utility function to create notifications.
// Centralizes logic so it can be used across controllers.

const Notification = require("../models/Notification");

/**
 * Creates and saves a notification to the database.
 * @param {string} recipientId - Who receives it.
 * @param {string} type - Notification type.
 * @param {string} content - Brief summary.
 * @param {string} senderId - Who triggered it (optional).
 * @param {string} relatedId - Associated task/report (optional).
 */
const sendNotification = async ({ recipientId, type, content, senderId = null, relatedId = null }) => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      content,
      relatedId,
    });
    return notification;
  } catch (error) {
    console.error("sendNotification utility error:", error.message);
  }
};

module.exports = { sendNotification };
