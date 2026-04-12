// email.controller.js
// Manager-only controller to send project assignment emails to all assigned employees.
// It generates a unique access code per employee, saves the codes on the Project,
// fetches each employee's tasks, builds an HTML email, and sends it via Nodemailer.

const Project = require("../models/Project");
const Task = require("../models/Task");
const { sendEmail } = require("../utils/emailSender");

/**
 * Generate a 4-character uppercase alphanumeric string (A-Z, 0-9).
 * Used for access code suffix in format: PROJ-XXXX
 */
function randomCode4() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * Format a date for display in email.
 * We keep it simple so it renders consistently across clients.
 */
function formatDateOrDash(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return "—";
  }
}

/**
 * Build an HTML email for a single employee.
 * Includes project name, employee name, tasks, deadline, and access code.
 */
function buildProjectEmailHtml({ project, employee, tasks, accessCode }) {
  const projectDeadline = formatDateOrDash(project.deadline);

  const tasksHtml =
    tasks.length === 0
      ? `<p style="margin:0;color:#444;">No tasks are assigned to you yet for this project.</p>`
      : `<ul style="margin:8px 0 0;padding-left:18px;">
          ${tasks
            .map((t) => {
              const taskDeadline = formatDateOrDash(t.deadline);
              return `
                <li style="margin:10px 0;">
                  <div style="font-weight:600;color:#111;">${t.title}</div>
                  <div style="color:#444;margin-top:2px;">${t.description}</div>
                  <div style="color:#666;font-size:12px;margin-top:4px;">
                    Priority: ${t.priority || "—"} • Est: ${t.estimatedDays || 1} day(s) • Deadline: ${taskDeadline}
                  </div>
                </li>
              `;
            })
            .join("")}
        </ul>`;

  return `
    <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e6e7ee;border-radius:12px;padding:24px;">
        <h2 style="margin:0 0 10px;color:#111;">Project Assignment: ${project.title}</h2>
        <p style="margin:0 0 14px;color:#444;">Hi ${employee.name},</p>
        <p style="margin:0 0 14px;color:#444;">
          You’ve been assigned to this project. Here are your current tasks.
        </p>

        <div style="background:#f3f4ff;border:1px solid #d7d9ff;padding:12px 14px;border-radius:10px;margin:16px 0;">
          <div style="color:#333;font-size:12px;">Project deadline</div>
          <div style="font-size:16px;font-weight:700;color:#111;margin-top:4px;">${projectDeadline}</div>
        </div>

        <h3 style="margin:18px 0 8px;color:#111;">Your tasks</h3>
        ${tasksHtml}

        <div style="margin-top:20px;padding:14px 16px;border-radius:10px;background:#111827;color:#fff;">
          <div style="font-size:12px;opacity:0.9;">Your unique project access code</div>
          <div style="font-size:20px;margin-top:6px;"><b>${accessCode}</b></div>
        </div>

        <p style="margin:18px 0 0;color:#444;">
          If you have questions, reply to this email or contact your manager.
        </p>
        <p style="margin:10px 0 0;color:#666;font-size:12px;">
          — AI Project Manager
        </p>
      </div>
    </div>
  `;
}

/**
 * POST /api/email/send-project-email
 * Manager triggers email sending for all assigned employees in a project.
 */
async function sendProjectEmail(req, res) {
  try {
    const { projectId } = req.body;

    // Validate input early.
    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    // Fetch the project and populate assigned employees with relevant fields.
    const project = await Project.findById(projectId).populate(
      "assignedEmployees",
      "name email skills"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const employees = project.assignedEmployees || [];
    if (employees.length === 0) {
      return res.status(400).json({
        message: "No assigned employees found for this project. Run AI selection first.",
      });
    }

    // Generate and store access codes (one per employee).
    // We overwrite the array each time to ensure codes match the emails sent.
    const employeeAccessCodes = employees.map((emp) => ({
      employeeId: emp._id,
      accessCode: `PROJ-${randomCode4()}`,
    }));

    project.employeeAccessCodes = employeeAccessCodes;
    await project.save();

    // Send emails sequentially (simple + predictable).
    // If you later need speed, we can add concurrency with a limit.
    const codes = [];
    let emailsSent = 0;
    let failures = 0;

    for (const emp of employees) {
      try {
        console.log(`Processing email for: ${emp.email} (ID: ${emp._id})`);
        // Fetch tasks assigned to this employee for this project.
        const tasks = await Task.find({
          projectId: project._id,
          assignedTo: emp._id,
        }).sort({ createdAt: 1 });

        // Pick the access code we saved on the project for this employee.
        const codeRow = employeeAccessCodes.find(
          (c) => String(c.employeeId) === String(emp._id)
        );
        const accessCode = codeRow?.accessCode || `PROJ-${randomCode4()}`;

        const subject = `Project Assigned: ${project.title}`;
        const html = buildProjectEmailHtml({
          project,
          employee: emp,
          tasks,
          accessCode,
        });

        // Send the email.
        await sendEmail(emp.email, subject, html);
        emailsSent += 1;

        codes.push({
          employeeName: emp.name,
          email: emp.email,
          accessCode,
          status: "sent"
        });
      } catch (err) {
        console.error(`Failed to send email to ${emp.email}:`, err.message);
        failures += 1;
        codes.push({
          employeeName: emp.name,
          email: emp.email,
          status: "failed",
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: failures === 0,
      emailsSent,
      failures,
      codes,
    });
  } catch (error) {
    console.error("sendProjectEmail error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/email/send-consolidated
 * Send a generated AI email body to a list of recipients.
 */
async function sendConsolidatedEmail(req, res) {
  try {
    const { recipients, subject, body } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "Recipients array is required" });
    }
    if (!body) {
      return res.status(400).json({ message: "Email body is required" });
    }

    const finalSubject = subject || "Important Project Update from Management";
    
    // Build a nice HTML wrapper for the AI-generated text
    const html = `
      <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:30px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="white-space:pre-wrap;line-height:1.6;color:#374151;font-size:16px;">
            ${body}
          </div>
          <div style="margin-top:30px;padding-top:20px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;text-align:center;">
            This was an automated campaign from your Project Manager via AI PM Platform.
          </div>
        </div>
      </div>
    `;

    let sentCount = 0;
    let failCount = 0;

    for (const email of recipients) {
      try {
        await sendEmail(email, finalSubject, html);
        sentCount++;
      } catch (err) {
        console.error(`Consolidated mail fail for ${email}:`, err.message);
        failCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully launched campaign to ${sentCount} recipients.`,
      sentCount,
      failCount
    });
  } catch (error) {
    console.error("sendConsolidatedEmail error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { sendProjectEmail, sendConsolidatedEmail };

