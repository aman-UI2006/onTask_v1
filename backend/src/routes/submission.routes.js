// submission.routes.js
// Handles task file submissions by employees.
// Employees upload files for their assigned tasks, and managers can view all submissions.

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Submission = require("../models/Submission");
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// Ensure uploads directory exists on startup
const uploadDir = path.join(__dirname, "../../uploads/submissions");
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Format: timestamp-originalname (spaces replaced with hyphens)
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

// File filter: accept all file types
const fileFilter = (req, file, cb) => {
  cb(null, true); // Accept all files
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

/**
 * POST /api/submissions/upload
 * Upload a file submission for a task
 * Middleware: verifyToken, roleCheck, multer.single('file')
 */
router.post(
  "/upload",
  verifyToken,
  roleCheck("employee"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { projectId, taskId } = req.body;

      // Validate required fields
      if (!projectId || !taskId) {
        return res.status(400).json({
          message: "projectId and taskId are required",
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Find the task and verify it's assigned to this employee
      const task = await Task.findOne({
        _id: taskId,
        projectId: projectId,
        assignedTo: req.dbUser._id,
      });

      if (!task) {
        console.error("[SUBMISSION] Task not found:", taskId);
        return res.status(404).json({
          message: "Task not found or not assigned to you",
        });
      }

      console.log("[SUBMISSION] Found task:", {
        id: task._id,
        title: task.title,
        order: task.order,
        isUnlocked: task.isUnlocked,
        status: task.status,
      });

      // Check if task is unlocked
      if (!task.isUnlocked) {
        console.error("[SUBMISSION] Task is locked:", task._id);
        return res.status(403).json({
          message: "This task is locked. Complete the previous task first.",
          isUnlocked: false,
        });
      }

      // Build file URL (relative path for static serving)
      const fileUrl = `/uploads/submissions/${req.file.filename}`;

      // Update the task with submission details
      task.status = "completed";
      task.submittedFileUrl = fileUrl;
      task.submittedFileName = req.file.originalname;
      task.submittedFileSize = req.file.size;
      task.submittedAt = new Date();
      task.submittedBy = req.dbUser._id;

      await task.save();
      console.log("[SUBMISSION] Task marked as completed:", task._id);

      // Unlock the next task in sequence (order + 1)
      const nextTask = await Task.findOne({
        projectId: projectId,
        order: task.order + 1,
      });

      if (nextTask) {
        console.log("[SUBMISSION] Found next task:", {
          id: nextTask._id,
          title: nextTask.title,
          order: nextTask.order,
          isUnlocked: nextTask.isUnlocked,
        });

        if (!nextTask.isUnlocked) {
          nextTask.isUnlocked = true;
          await nextTask.save();
          console.log("[SUBMISSION] Next task unlocked:", nextTask._id);
        }
      } else {
        console.log("[SUBMISSION] No next task found (this might be the last task)");
      }

      // Create a Submission document
      const submission = new Submission({
        projectId: projectId,
        taskId: taskId,
        employeeId: req.dbUser._id,
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date(),
      });

      const savedSubmission = await submission.save();

      // Check if all tasks in the project are now completed
      const allTasks = await Task.find({ projectId });
      const allDone = allTasks.every((t) => t.status === "completed");

      console.log(`[SUBMISSION] Project tasks: ${allTasks.length}, All completed: ${allDone}`);

      if (allDone) {
        await Project.findByIdAndUpdate(projectId, {
          allTasksCompleted: true,
        });
        console.log("[SUBMISSION] Project marked as all tasks completed:", projectId);
      }

      return res.status(200).json({
        success: true,
        submission: savedSubmission,
        taskUpdated: true,
        allTasksCompleted: allDone,
      });
    } catch (error) {
      console.error("Submission upload error:", error.message);
      return res.status(500).json({
        message: "Failed to upload submission",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/submissions/project/:projectId
 * Get all submissions for a project (manager only)
 * Middleware: verifyToken, roleCheck
 */
router.get(
  "/project/:projectId",
  verifyToken,
  roleCheck("manager"),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      // Find all submissions for this project
      const submissions = await Submission.find({ projectId })
        .populate("employeeId", "name email")
        .populate("taskId", "title description priority")
        .sort({ uploadedAt: -1 }); // Most recent first

      return res.status(200).json({ submissions });
    } catch (error) {
      console.error("Get project submissions error:", error.message);
      return res.status(500).json({
        message: "Failed to fetch submissions",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/submissions/my-submissions/:projectId
 * Get submissions made by the current employee for a project
 * Middleware: verifyToken, roleCheck
 */
router.get(
  "/my-submissions/:projectId",
  verifyToken,
  roleCheck("employee"),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      // Find submissions by this employee for this project
      const submissions = await Submission.find({
        projectId: projectId,
        employeeId: req.dbUser._id,
      }).populate("taskId", "title");

      return res.status(200).json({ submissions });
    } catch (error) {
      console.error("Get my submissions error:", error.message);
      return res.status(500).json({
        message: "Failed to fetch submissions",
        error: error.message,
      });
    }
  }
);

module.exports = router;
