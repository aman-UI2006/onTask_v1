// report.controller.js
// Handles all report-related business logic.
// Employees submit reports when they complete a task.
// Managers review reports and can add comments.
// Grok AI generates feedback on reports (triggered separately via /api/ai).

const Report = require("../models/Report");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { sendNotification } = require("../utils/notification");

// ─── SUBMIT REPORT ────────────────────────────────────────────
// POST /api/reports
// Employee submits a report for a completed task
const submitReport = async (req, res) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({
        message: "taskId and content are required",
      });
    }

    // Verify the task exists and belongs to this employee
    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.dbUser._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or not assigned to you",
      });
    }

    // Check if report already submitted for this task
    const existingReport = await Report.findOne({
      taskId,
      employeeId: req.dbUser._id,
    });

    if (existingReport) {
      return res.status(400).json({
        message: "Report already submitted for this task",
        report: existingReport,
      });
    }

    // Create the report
    const reportData = {
      taskId,
      employeeId: req.dbUser._id,
      content,
    };

    if (req.file) {
      // For this demo, we store the original filename. 
      // In production, we'd save to S3/Cloud and store the URL.
      reportData.attachmentUrl = req.file.originalname;
    }

    const report = await Report.create(reportData);

    // Auto-update task status to completed
    task.status = "completed";
    await task.save();

    // Trigger notification to manager
    const project = await Project.findById(task.projectId);
    if (project) {
      await sendNotification({
        recipientId: project.userId, // The manager who created the project
        senderId: req.dbUser._id,
        type: "submission",
        content: `${req.dbUser.name} submitted a report for task: ${task.title}`,
        relatedId: report._id,
      });
    }

    return res.status(201).json({
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error("Submit report error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── GET REPORT FOR A TASK ────────────────────────────────────
// GET /api/reports/task/:taskId
// Both manager and employee can view the report for a specific task
const getReportByTask = async (req, res) => {
  try {
    const report = await Report.findOne({ taskId: req.params.taskId })
      .populate("employeeId", "name email")
      .populate("taskId", "title description");

    if (!report) {
      return res.status(404).json({ message: "No report found for this task" });
    }

    return res.status(200).json({ report });
  } catch (error) {
    console.error("Get report error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── GET ALL REPORTS FOR A PROJECT ───────────────────────────
// GET /api/reports/project/:projectId
// Manager views all reports submitted for a project
const getReportsByProject = async (req, res) => {
  try {
    // First get all task IDs for this project
    const tasks = await Task.find({
      projectId: req.params.projectId,
    }).select("_id");

    const taskIds = tasks.map((t) => t._id);

    // Then get all reports for those tasks
    const reports = await Report.find({ taskId: { $in: taskIds } })
      .populate("employeeId", "name email department")
      .populate("taskId", "title priority status")
      .sort({ createdAt: -1 });

    return res.status(200).json({ reports });
  } catch (error) {
    console.error("Get project reports error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── ADD MANAGER COMMENT ──────────────────────────────────────
// PUT /api/reports/:id/comment
// Manager adds their own written comment to a report
const addManagerComment = async (req, res) => {
  try {
    const { comment, status } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Update manager comment and optionally change status
    report.managerComment = comment;
    if (status) {
      report.status = status;
      // If approved (completed), sync with the actual Task status
      if (status === "completed" && report.taskId) {
        await Task.findByIdAndUpdate(report.taskId, { status: "completed" });
      } else if (status === "needs_revision" && report.taskId) {
        await Task.findByIdAndUpdate(report.taskId, { status: "needs_revision" });
      }
    }
    await report.save();

    return res.status(200).json({
      message: "Comment added successfully",
      report,
    });
  } catch (error) {
    console.error("Add comment error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── GET MY REPORTS ───────────────────────────────────────────
// GET /api/reports/my-reports
// Employee views all their submitted reports
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ employeeId: req.dbUser._id })
      .populate("taskId", "title description priority status")
      .sort({ createdAt: -1 });

    return res.status(200).json({ reports });
  } catch (error) {
    console.error("Get my reports error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  submitReport,
  getReportByTask,
  getReportsByProject,
  addManagerComment,
  getMyReports,
};