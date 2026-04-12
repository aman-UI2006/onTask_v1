// invite.routes.js
// Handles sending project invite emails to employees with token-based links
// and validating/accepting those invite links.

const express = require("express");
const crypto = require("crypto");
const Project = require("../models/Project");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");
const { sendEmail } = require("../utils/emailSender");

const router = express.Router();

/**
 * POST /api/invite/send
 * Send project invite email to an employee with a token-based link
 * Middleware: verifyToken, roleCheck (manager only)
 */
router.post("/send", verifyToken, roleCheck("manager"), async (req, res) => {
  try {
    const { employeeEmail, projectId } = req.body;

    // Validate required fields
    if (!employeeEmail || !projectId) {
      return res.status(400).json({
        message: "employeeEmail and projectId are required",
      });
    }

    // Find the project and verify it belongs to this manager
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.managerId.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: "You don't own this project" });
    }

    // Find the employee by email
    const employee = await User.findOne({
      email: employeeEmail,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found. They must register first.",
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Update project with invite token
    project.inviteToken = token;
    project.inviteTokenExpiry = tokenExpiry;

    // Add employee to assignedEmployees if not already there
    const employeeObjectId = employee._id;
    if (!project.assignedEmployees.includes(employeeObjectId)) {
      project.assignedEmployees.push(employeeObjectId);
    }

    await project.save();

    // Build invite link
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/employee/accept-invite?token=${token}&projectId=${projectId}`;

    // Build email HTML
    const deadlineText = project.deadline
      ? new Date(project.deadline).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not specified";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fa;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .project-title {
            font-size: 22px;
            color: #2d3748;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-label {
            color: #718096;
            font-weight: 500;
          }
          .detail-value {
            color: #2d3748;
            font-weight: 600;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .expiry-notice {
            background: #fff5f5;
            border-left: 4px solid #fc8181;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            color: #c53030;
            font-size: 14px;
          }
          .footer {
            background: #f7fafc;
            padding: 20px 30px;
            text-align: center;
            color: #718096;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 You've Been Assigned to a Project!</h1>
          </div>
          <div class="content">
            <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">
              Hi there,
            </p>
            <p style="color: #4a5568; font-size: 16px;">
              You have been selected to work on an exciting new project. Here are the details:
            </p>
            
            <div class="project-title">${project.title}</div>
            
            <div class="detail-row">
              <span class="detail-label">Project Deadline:</span>
              <span class="detail-value">${deadlineText}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Assigned By:</span>
              <span class="detail-value">${req.dbUser.name}</span>
            </div>
            
            <div class="button-container">
              <a href="${inviteLink}" class="button">
                Accept Project Assignment
              </a>
            </div>
            
            <div class="expiry-notice">
              ⚠️ <strong>Important:</strong> This link expires in 48 hours. Please accept the assignment before it expires.
            </div>
            
            <p style="color: #4a5568; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact your project manager.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from AI Project Manager.</p>
            <p>&copy; ${new Date().getFullYear()} AI Project Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail(
      employeeEmail,
      `You've been assigned to a project: ${project.title}`,
      htmlContent
    );

    return res.status(200).json({
      success: true,
      message: `Invite sent to ${employeeEmail}`,
    });
  } catch (error) {
    console.error("Invite send error:", error.message);
    return res.status(500).json({
      message: "Failed to send invite",
      error: error.message,
    });
  }
});

/**
 * GET /api/invite/accept
 * Validate and accept an invite link (public endpoint)
 */
router.get("/accept", async (req, res) => {
  try {
    const { token, projectId } = req.query;

    // Validate required params
    if (!token || !projectId) {
      return res.status(400).json({
        valid: false,
        message: "Token and projectId are required",
      });
    }

    // Find project with valid token that hasn't expired
    const project = await Project.findOne({
      _id: projectId,
      inviteToken: token,
      inviteTokenExpiry: { $gt: new Date() },
    });

    if (!project) {
      return res.status(400).json({
        valid: false,
        message: "Invite link expired or invalid",
      });
    }

    // Clear the invite token (one-time use)
    project.inviteToken = null;
    project.inviteTokenExpiry = null;
    await project.save();

    // Populate assigned employees to get full details
    const populatedProject = await Project.findById(project._id).populate(
      "assignedEmployees",
      "name email"
    );

    return res.status(200).json({
      valid: true,
      projectId: project._id,
      projectTitle: project.title,
      assignedEmployees: populatedProject.assignedEmployees,
    });
  } catch (error) {
    console.error("Invite accept error:", error.message);
    return res.status(500).json({
      valid: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
