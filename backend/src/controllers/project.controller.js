const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const { extractText } = require("../utils/fileParser");
const grokService = require("../services/grokService");

/** Compare two user ids whether ObjectId or string */
function sameUserId(a, b) {
  if (!a || !b) return false;
  try {
    return new mongoose.Types.ObjectId(a).equals(new mongoose.Types.ObjectId(b));
  } catch {
    return String(a) === String(b);
  }
}

/** Normalize access code: trim, uppercase, single hyphen after PROJ */
function normalizeAccessCode(raw) {
  let s = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  // Allow PROJXXXX (no hyphen) → PROJ-XXXX
  if (/^PROJ[A-Z0-9]{4}$/.test(s)) {
    s = `PROJ-${s.slice(4)}`;
  }
  return s;
}

// ─── VERIFY PROJECT ACCESS CODE ────────────────────────────────
// POST /api/projects/verify-access
// Employees submit an access code they received by email to verify access to a project.
const verifyProjectAccess = async (req, res) => {
  try {
    const { projectId, accessCode } = req.body;

    // Validate input.
    if (!projectId || !accessCode) {
      return res.status(400).json({ valid: false, message: "projectId and accessCode are required" });
    }

    // Find the project.
    const project = await Project.findById(projectId).select(
      "_id title description status deadline employeeAccessCodes"
    );

    if (!project) {
      return res.status(404).json({ valid: false, message: "Project not found" });
    }

    if (!project.employeeAccessCodes || project.employeeAccessCodes.length === 0) {
      return res.status(400).json({
        valid: false,
        message:
          "No access codes for this project yet. Ask your manager to click Send Project Emails in the project dashboard.",
      });
    }

    // IMPORTANT:
    // verifyToken sets req.user with Firebase token payload (uid/email),
    // and roleCheck/requireAuth attach the MongoDB user doc as req.dbUser.
    // We must use req.dbUser._id for employeeId matching.
    const employeeId = req.dbUser?._id;

    // Look for a matching entry in employeeAccessCodes:
    // - employeeId matches logged-in employee
    // - accessCode matches (normalized)
    const submitted = normalizeAccessCode(accessCode);
    const match = (project.employeeAccessCodes || []).find((row) => {
      const rowEmployeeId = row?.employeeId;
      const rowCode = normalizeAccessCode(row?.accessCode);
      return sameUserId(rowEmployeeId, employeeId) && rowCode === submitted;
    });

    // If match found, return a minimal project payload.
    if (match) {
      return res.status(200).json({
        valid: true,
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          status: project.status,
          deadline: project.deadline,
        },
      });
    }

    // Otherwise return invalid with 400 as requested.
    return res.status(400).json({ valid: false, message: "Invalid access code" });
  } catch (error) {
    console.error("Verify access error:", error.message);
    return res.status(500).json({ valid: false, message: "Server error" });
  }
};

// ─── CREATE PROJECT ───────────────────────────────────────────
// POST /api/projects
// Only managers can create projects (enforced by roleCheck in routes)
const createProject = async (req, res) => {
  try {
    const { title, description, requiredSkills, deadline } = req.body;
    const transcriptFile = req.file;

    let transcriptContent = "";
    if (transcriptFile) {
      try {
        transcriptContent = await extractText(transcriptFile);
      } catch (err) {
        console.error("Transcript parsing failed during creation:", err.message);
      }
    }

    // Generate unique 6-character invite code
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    let inviteCode = generateCode();

    // Keep generating until we find one that doesn't exist
    let exists = await Project.findOne({ inviteCode });
    while (exists) {
      inviteCode = generateCode();
      exists = await Project.findOne({ inviteCode });
    }

    // 1. Create the project
    const project = await Project.create({
      title,
      description,
      managerId: req.dbUser._id,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(",").map(s => s.trim()) : []),
      deadline: deadline || null,
      inviteCode,
      transcriptContext: transcriptContent,
    });

    // 2. Trigger Immediate AI Crew Generation
    let crewData = null;
    try {
      const allEmployees = await User.find({ role: "employee" }).select("name skills department experience pastProjects bio");
      const requirementsString = `Project: ${title}. Description: ${description}. Required Skills: ${project.requiredSkills.join(", ")}. Additional Context: ${transcriptContent}`;
      
      const aiResult = await grokService.formTeams(requirementsString, allEmployees);
      
      // Populate teams with full employee objects instead of just IDs
      const populatedTeams = {};
      if (aiResult.teams) {
        for (const [teamName, ids] of Object.entries(aiResult.teams)) {
          populatedTeams[teamName] = ids.map(id => {
            const emp = allEmployees.find(e => String(e._id || e.id) === String(id));
            if (emp) return emp;
            // Fallback if ID not found (shouldn't happen with good AI instructions)
            return { _id: id, name: "Employee " + id };
          });
        }
      }

      crewData = {
        teams: populatedTeams,
        rationale: aiResult.rationale || ""
      };
      
      // Update project with the generated crew
      project.crewData = crewData;
      await project.save();
    } catch (err) {
      console.error("CRITICAL: Immediate AI Crew Generation failed for project:", project._id);
      console.error("Error Detail:", err.message);
      if (err.response) console.error("AI Provider Response:", JSON.stringify(err.response.data));
    }

    return res.status(201).json({
      message: "Project created successfully!",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error.message);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// ─── GET ALL PROJECTS ─────────────────────────────────────────
// GET /api/projects
// Manager sees their own projects
// Employee can search all projects (field-limited) to find access-code entry point
const getAllProjects = async (req, res) => {
  try {
    let projects;

    // Optional search filter on title (case-insensitive).
    // Example: GET /api/projects?search=website
    const { search } = req.query;
    const titleFilter =
      search && String(search).trim().length > 0
        ? { title: { $regex: String(search).trim(), $options: "i" } }
        : {};

    if (req.dbUser.role === "manager") {
      // Managers see only projects they created
      projects = await Project.find({
        managerId: req.dbUser._id,
        ...titleFilter,
      })
        .populate("assignedEmployees", "name email skills") // get employee details
        .sort({ createdAt: -1 }); // newest first
    } else {
      // Employees can see ALL projects, but only limited safe fields.
      // IMPORTANT: Do NOT expose employeeAccessCodes to employees via this list endpoint.
      projects = await Project.find({
        ...titleFilter,
      })
        .select("_id title description status deadline requiredSkills")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({ projects });
  } catch (error) {
    console.error("Get projects error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── GET SINGLE PROJECT ───────────────────────────────────────
// GET /api/projects/:id
// Both managers and employees can view a single project
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("assignedEmployees", "name email skills department")
      .populate("managerId", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({ project });
  } catch (error) {
    console.error("Get project error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── UPDATE PROJECT ───────────────────────────────────────────
// PUT /api/projects/:id
// Only the manager who created it can update it
const updateProject = async (req, res) => {
  try {
    const { title, description, requiredSkills, status, deadline } = req.body;

    // Find project and make sure it belongs to this manager
    const project = await Project.findOne({
      _id: req.params.id,
      managerId: req.dbUser._id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you don't have permission",
      });
    }

    // Only update fields that were actually sent in the request
    if (title) project.title = title;
    if (description) project.description = description;
    if (requiredSkills) project.requiredSkills = requiredSkills;
    if (status) project.status = status;
    if (deadline) project.deadline = deadline;
    if (req.body.assignedEmployees) project.assignedEmployees = req.body.assignedEmployees;
    if (req.body.crewData) project.crewData = req.body.crewData;

    await project.save();

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── DELETE PROJECT ───────────────────────────────────────────
// DELETE /api/projects/:id
// Only the manager who created it can delete it
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      managerId: req.dbUser._id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you don't have permission",
      });
    }

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  verifyProjectAccess,
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};