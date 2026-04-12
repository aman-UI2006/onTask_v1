// emailSender.js
// Central helper to send a single HTML email using Gmail SMTP via Nodemailer.
// Reads credentials from environment variables:
// - EMAIL_USER
// - EMAIL_PASS

const nodemailer = require("nodemailer");

/**
 * Send a single HTML email.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} htmlContent - HTML body.
 * @returns {Promise<{success: true}>}
 */
async function sendEmail(to, subject, htmlContent) {
  // Validate minimal inputs early.
  if (!to || !subject || !htmlContent) {
    throw new Error("sendEmail: missing required parameters (to, subject, htmlContent)");
  }

  // Read Gmail app credentials from env.
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("EMAIL_USER/EMAIL_PASS are not set in environment variables");
  }

  // Gmail SMTP with STARTTLS on port 587.
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS upgrades the connection
    auth: { user, pass },
    requireTLS: true,
  });

  // Send email.
  await transporter.sendMail({
    from: user,
    to,
    subject,
    html: htmlContent,
  });

  return { success: true };
}

module.exports = { sendEmail };

