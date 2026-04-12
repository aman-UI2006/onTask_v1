// ai.controller.js
// Handles the business logic for all AI endpoints.
// Fetches data from MongoDB, calls grokService, saves results back to DB.

const Project = require("../models/Project");
const User = require("../models/User");
const Report = require("../models/Report");
const Task = require("../models/Task");
const Conversation = require("../models/Conversation");
const grokService = require("../services/grokService");
const { sendNotification } = require("../utils/notification");

// ─── AI CHAT (MANAGER ASSISTANT WITH MEMORY) ───────────────────
// POST /api/ai/chat
// 1. Builds context
// 2. Fetches/Updates global history from MongoDB
// 3. Sends prompt to Grok (Actionable)
// 4. Processes AI commands (if any) or returns message
const chat = async (req, res) => {
  try {
    const { query, projectId } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    // Validate required input.
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ message: "query is required" });
    }

    // Fetch all employees (name, department, skills).
    const employees = await User.find({ role: "employee" }).select(
      "name department skills"
    );

    // Fetch all projects with key fields and populated assigned employee names.
    const projects = await Project.find({})
      .select("title status description requiredSkills deadline assignedEmployees")
      .populate("assignedEmployees", "name");

    // Build optional project-specific context (transcript + tasks).
    let projectTranscriptContext = "";
    let projectTasks = [];

    if (projectId) {
      // Fetch the transcriptContext field for this project (meeting notes).
      const projectForTranscript = await Project.findById(projectId).select(
        "transcriptContext"
      );
      projectTranscriptContext = projectForTranscript?.transcriptContext || "";

      // Fetch tasks for this project with assignedTo populated name.
      projectTasks = await Task.find({ projectId })
        .select("title assignedTo status priority")
        .populate("assignedTo", "name");
    }

    // Convert employees list into a readable text block.
    const employeesBlock =
      employees.length === 0
        ? "No employees found.\n"
        : employees
            .map((e) => {
              const skills = Array.isArray(e.skills) ? e.skills.join(", ") : "";
              return `- Name: ${e.name} | Department: ${e.department || "—"} | Skills: ${
                skills || "—"
              }`;
            })
            .join("\n");

    // Convert projects list into a readable text block.
    const projectsBlock =
      projects.length === 0
        ? "No projects found.\n"
        : projects
            .map((p) => {
              const requiredSkills = Array.isArray(p.requiredSkills)
                ? p.requiredSkills.join(", ")
                : "";
              const assignedNames = Array.isArray(p.assignedEmployees)
                ? p.assignedEmployees.map((u) => u?.name).filter(Boolean).join(", ")
                : "";
              return [
                `- Title: ${p.title}`,
                `  Status: ${p.status || "—"}`,
                `  Description: ${p.description || "—"}`,
                `  Required Skills: ${requiredSkills || "—"}`,
                `  Deadline: ${p.deadline || "—"}`,
                `  Assigned Employees: ${assignedNames || "—"}`,
              ].join("\n");
            })
            .join("\n");

    // Convert project tasks (only when projectId provided).
    const tasksBlock =
      !projectId
        ? ""
        : projectTasks.length === 0
          ? "No tasks found for this project.\n"
          : projectTasks
              .map((t) => {
                return `- ${t.title} | AssignedTo: ${t.assignedTo?.name || "Unassigned"} | Status: ${
                  t.status || "—"
                } | Priority: ${t.priority || "—"}`;
              })
              .join("\n");

    // Fetch global conversation history for this user
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      conversation = await Conversation.create({ userId, messages: [] });
    }

    // Limit history to last 15 messages for token efficiency (global memory)
    const history = conversation.messages.slice(-15).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Assemble the full context string
    let contextString = "";
    contextString += `EMPLOYEES:\n${employeesBlock}\n\n`;
    contextString += `PROJECTS:\n${projectsBlock}\n\n`;

    if (projectId) {
      contextString += `CURRENT PROJECT CONTEXT:\n${projectTranscriptContext || "—"}\n\n`;
      contextString += `TASKS FOR THIS PROJECT:\n${tasksBlock}\n\n`;
    }

    const prompt = `
COMPANY CONTEXT:
${contextString}

MANAGER QUESTION: ${query}
`;

    // Call Grok with Actionable intent
    const aiResponseString = await grokService.callGrokActionable(prompt, history);

    // Try to parse as JSON command
    let aiReply = aiResponseString;
    let actionResult = null;

    try {
      const jsonCmd = JSON.parse(aiResponseString);
      if (jsonCmd.action && jsonCmd.params) {
        // Process AI Command (Actionable AI)
        if (jsonCmd.action === "update_task") {
          const { taskId, ...updates } = jsonCmd.params;
          await Task.findByIdAndUpdate(taskId, updates);
          actionResult = { type: "task_updated", taskId };
        } else if (jsonCmd.action === "update_project") {
          const { projectId: pId, ...updates } = jsonCmd.params;
          await Project.findByIdAndUpdate(pId, updates);
          actionResult = { type: "project_updated", projectId: pId };
        }
        aiReply = jsonCmd.message; // Use the AI's confirmation message
      }
    } catch (e) {
      // Not a JSON command, aiReply remains as a string
    }

    // Save user message and assistant reply to history
    conversation.messages.push({ role: "user", content: query });
    conversation.messages.push({ role: "assistant", content: aiReply });
    await conversation.save();

    return res.status(200).json({ 
      reply: aiReply, 
      actionPerformed: actionResult 
    });
  } catch (error) {
    console.error("AI chat error:", error.message);
    return res.status(500).json({ message: "AI chat failed", error: error.message });
  }
};

// ─── AI EMPLOYEE CHAT (ASSISTANT) ──────────────────────────────
// POST /api/ai/employee-chat
// Helps employees with their tasks using global context.
const employeeChat = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query) return res.status(400).json({ message: "query is required" });

    // Fetch assigned tasks for context
    const tasks = await Task.find({ assignedTo: userId }).populate("projectId", "title");
    const tasksBlock = tasks.length === 0 
      ? "No tasks assigned." 
      : tasks.map(t => `- Task: ${t.title} (Project: ${t.projectId?.title}) | Status: ${t.status}`).join("\n");

    // Fetch global history
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) conversation = await Conversation.create({ userId, messages: [] });

    const history = conversation.messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    const prompt = `
You are an AI Employee Assistant. Help the employee complete their tasks efficiently.
ASSIGNED TASKS:
${tasksBlock}

QUESTION: ${query}
`;

    const reply = await grokService.chat(prompt, history);

    // Save history
    conversation.messages.push({ role: "user", content: query });
    conversation.messages.push({ role: "assistant", content: reply });
    await conversation.save();

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Employee chat error:", error.message);
    return res.status(500).json({ message: "Employee chat failed", error: error.message });
  }
};

// ─── SELECT EMPLOYEES ─────────────────────────────────────────
// POST /api/ai/select-employees
// 1. Gets project details from DB
// 2. Gets all employees from DB
// 3. Sends to Grok → gets best matches back
// 4. Updates project with selected employees in DB
const selectEmployees = async (req, res) => {
  try {
    const { projectId } = req.body;

    // Get project from DB
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all employees from DB (only employees, not managers)
    const employees = await User.find({ role: "employee" });
    if (employees.length === 0) {
      return res.status(400).json({ message: "No employees found in system" });
    }

    // Send to Grok AI for selection
    const aiResult = await grokService.selectEmployees(project, employees);

    // Match Grok's selected IDs/names back to actual MongoDB user IDs
    const selectedIds = employees
      .filter((emp) => {
        const idStr = emp._id.toString();
        return aiResult.selectedEmployees.some(
          (selected) =>
            String(selected.id).toLowerCase() === idStr.toLowerCase() ||
            selected.name.toLowerCase() === emp.name.toLowerCase()
        );
      })
      .map((emp) => emp._id);

    // Save selected employees to the project in DB
    project.assignedEmployees = selectedIds;
    project.status = "active";
    await project.save();

    return res.status(200).json({
      message: "Employees selected successfully",
      aiResult,
      assignedEmployeeIds: selectedIds,
    });
  } catch (error) {
    console.error("Select employees error:", error.message);
    return res.status(500).json({ message: "AI selection failed", error: error.message });
  }
};

// ─── FORM TEAMS (SYSTEMATIC CREW) ──────────────────────────
// POST /api/ai/form-teams
const formTeams = async (req, res) => {
  try {
    const { requirements } = req.body;
    if (!requirements) {
      return res.status(400).json({ message: "requirements are required" });
    }

    const employees = await User.find({ role: "employee" }).select("name email skills experience bio pastProjects");
    const aiResult = await grokService.formTeams(requirements, employees);

    // Resolve IDs to full employee objects for the frontend
    const populatedTeams = {};
    const teamwork = aiResult.teams || {};
    
    // Some safety logic in case the AI returns names instead of IDs or a single string
    for (const [teamName, members] of Object.entries(teamwork)) {
      const memberIds = Array.isArray(members) ? members : [members];
      
      populatedTeams[teamName] = employees.filter(e => {
        const idStr = e._id.toString();
        // Check if memberIds contains the actual ID OR the name (fallback)
        return memberIds.some(m => 
          String(m).toLowerCase() === idStr.toLowerCase() || 
          String(m).toLowerCase() === e.name.toLowerCase()
        );
      });
    }

    return res.status(200).json({
      teams: populatedTeams,
      rationale: aiResult.rationale
    });
  } catch (error) {
    console.error("Form teams error:", error.message);
    return res.status(500).json({ message: "AI team formation failed", error: error.message });
  }
};

// ─── GENERATE WORKFLOW ────────────────────────────────────────
// POST /api/ai/generate-workflow
// 1. Gets project + assigned employees from DB
// 2. Sends to Grok → gets task list back
// 3. Saves each task to DB
const generateWorkflow = async (req, res) => {
  try {
    const { projectId } = req.body;

    // Get project with populated employee details
    const project = await Project.findById(projectId).populate(
      "assignedEmployees",
      "name skills"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.assignedEmployees.length === 0) {
      return res.status(400).json({
        message: "No employees assigned. Run employee selection first.",
      });
    }

    // Send to Grok AI for workflow generation
    const aiResult = await grokService.generateWorkflow(
      project,
      project.assignedEmployees
    );

    // Save each generated task to MongoDB
    const taskPromises = aiResult.tasks.map(async (taskData) => {
      // Find the employee by ID first, then fallback to name
      const assignedEmployee = project.assignedEmployees.find(
        (emp) => {
          const idStr = emp._id.toString();
          return (taskData.assignedToId && String(taskData.assignedToId).toLowerCase() === idStr.toLowerCase()) ||
                 (taskData.assignedToName && taskData.assignedToName.toLowerCase() === emp.name.toLowerCase());
        }
      );

      return Task.create({
        projectId: project._id,
        title: taskData.title,
        description: taskData.description,
        assignedTo: assignedEmployee ? assignedEmployee._id : null,
        estimatedDays: taskData.estimatedDays,
        priority: taskData.priority,
        status: "pending",
      });
    });

    const savedTasks = await Promise.all(taskPromises);

    return res.status(200).json({
      message: "Workflow generated successfully",
      aiSummary: aiResult.summary,
      totalEstimatedDays: aiResult.totalEstimatedDays,
      tasks: savedTasks,
    });
  } catch (error) {
    console.error("Generate workflow error:", error.message);
    return res.status(500).json({ message: "Workflow generation failed", error: error.message });
  }
};

// ─── GENERATE FEEDBACK ────────────────────────────────────────
// POST /api/ai/generate-feedback
// 1. Gets report + task + employee from DB
// 2. Sends to Grok → gets feedback back
// 3. Saves feedback to the report in DB
const generateFeedback = async (req, res) => {
  try {
    const { reportId } = req.body;

    // Get report with related task and employee details
    const report = await Report.findById(reportId)
      .populate("taskId")
      .populate("employeeId", "name email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Send to Grok AI for feedback
    const aiResult = await grokService.generateFeedback(
      report,
      report.taskId,
      report.employeeId
    );

    // Save AI feedback back to the report in DB
    report.aiFeedback = aiResult;
    report.status = aiResult.recommendation === "approve" ? "approved" : "needs_revision";
    await report.save();

    // Trigger notification to employee
    await sendNotification({
      recipientId: report.employeeId,
      senderId: req.user.id, // The manager
      type: report.status === "approved" ? "approved" : "revision",
      content: `Feedback received for: ${report.taskId?.title}. Recommendation: ${aiResult.recommendation}`,
      relatedId: report._id,
    });

    return res.status(200).json({
      message: "Feedback generated successfully",
      feedback: aiResult,
    });
  } catch (error) {
    console.error("Generate feedback error:", error.message);
    return res.status(500).json({ message: "Feedback generation failed", error: error.message });
  }
};

const generateManualEmail = async (req, res) => {
  try {
    const { content, tone } = req.body;
    if (!content) return res.status(400).json({ message: "content is required" });

    const email = await grokService.generateEmail(content, tone || "professional");

    return res.status(200).json({ email });
  } catch (error) {
    console.error("Generate email error:", error.message);
    return res.status(500).json({ message: "Email generation failed", error: error.message });
  }
};

// ─── GENERATE ENHANCED EMAIL ──────────────────────────────────
// POST /api/ai/generate-enhanced-email
const generateEnhancedEmail = async (req, res) => {
  try {
    const { projectName, recipients, instruction, tone, context } = req.body;
    
    const emailBody = await grokService.generateEmailEnhanced(
      projectName, 
      recipients, 
      instruction, 
      tone, 
      context
    );

    return res.status(200).json({ body: emailBody });
  } catch (error) {
    console.error("Enhanced email error:", error.message);
    return res.status(500).json({ message: "AI email generation failed", error: error.message });
  }
};

// GET /api/ai/employees
const getEmployees = async (req, res) => {
  try {
    // 1. Fetch all employees
    const employees = await User.find({ role: "employee" })
      .select("name email skills department bio experience pastProjects createdAt")
      .lean();

    // 2. To determine "Active" status, check if they are in the 'assignedEmployees' 
    // array of any project that is NOT 'completed'.
    const activeProjects = await Project.find({ status: { $ne: "completed" } })
      .select("assignedEmployees")
      .lean();
    
    const assignedIds = new Set();
    activeProjects.forEach(p => {
      p.assignedEmployees?.forEach(id => assignedIds.add(id.toString()));
    });

    const enrichedEmployees = employees.map(emp => {
      const isAssigned = assignedIds.has(emp._id.toString());
      return {
        ...emp,
        activeStatus: isAssigned ? "Active" : "Inactive",
        isAvailable: !isAssigned // Keep compatibility if needed
      };
    });

    return res.status(200).json({ employees: enrichedEmployees });
  } catch (error) {
    console.error("Get employees error:", error.message);
    return res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

module.exports = {
  selectEmployees,
  generateWorkflow,
  generateFeedback,
  chat,
  employeeChat,
  generateManualEmail,
  formTeams,
  generateEnhancedEmail,
  getEmployees,
};