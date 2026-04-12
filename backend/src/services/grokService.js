// grokService.js
// This file handles ALL communication with the Grok API.
// No other file talks to Grok directly — everything goes through here.
// This makes it easy to swap AI providers later if needed.

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Base function — sends any prompt to Grok and returns the text response
// All other functions in this file use this as their foundation
// Shared HTTP call to Groq; `systemPrompt` controls JSON vs freeform output.
const callGrokWithSystem = async (prompt, systemPrompt, history = []) => {
  try {
    // Construct messages array with system prompt, history, and current prompt
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...history, // Add previous messages for context
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Grok API HTTP error:", response.status, JSON.stringify(data));
      throw new Error(`Grok API returned ${response.status}: ${JSON.stringify(data)}`);
    }

    if (!data.choices || !data.choices[0]) {
      console.error("Grok API unexpected response:", JSON.stringify(data));
      throw new Error(`Grok API unexpected response format: ${JSON.stringify(data)}`);
    }

    const msg = data.choices[0].message;
    const rawText =
      typeof msg?.content === "string"
        ? msg.content
        : Array.isArray(msg?.content)
          ? msg.content.map((p) => (p?.text != null ? p.text : "")).join("")
          : "";

    // Robust JSON cleaning:
    // 1. Remove markdown code blocks
    // 2. Remove any text BEFORE the first '{' and AFTER the last '}'
    let cleaned = String(rawText)
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (cleaned.includes("{") && cleaned.includes("}")) {
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned;
  } catch (error) {
    console.error("Grok API error:", error.message);
    throw new Error(`Failed to get response from Grok AI: ${error.message}`);
  }
};

const callGrok = async (prompt) => {
  return callGrokWithSystem(
    prompt,
    "You are an expert AI Project Manager. Always respond in valid JSON format only. No extra text, no markdown, no explanation — just raw JSON."
  );
};

// Freeform assistant replies (used by chat endpoints). Supports history.
const callGrokFreeform = async (prompt, history = []) => {
  return callGrokWithSystem(
    prompt,
    "You are an AI Manager Assistant. Answer in clear plain text. You may use short paragraphs or bullet lists when helpful. Do not wrap the entire answer in JSON unless the user explicitly asks for JSON.",
    history
  );
};

// ─── CHAT (CONTEXTUAL ASSISTANT) ─────────────────────────────
// Supports history for global memory.
const chat = async (prompt, history = []) => {
  return callGrokFreeform(prompt, history);
};

// ─── ACTIONABLE CHAT (MANAGER ONLY) ──────────────────────────
// AI can return structured commands to modify the database.
const callGrokActionable = async (prompt, history = []) => {
  const systemPrompt = `
You are an AI Manager Assistant with the power to modify project details, tasks, and employee assignments.
Analyze the manager's request. If they want to change something (e.g., a deadline, a task title, or assign someone), respond with a JSON object.
Otherwise, respond with a plain text message.

If it's a command, use this JSON format:
{
  "action": "update_task" | "update_project" | "update_workflow",
  "params": { ... },
  "message": "AI's confirmation message to the manager"
}

If it's just a question, respond with plain text.
`;
  return callGrokWithSystem(prompt, systemPrompt, history);
};

// ─── GENERATE EMAIL ──────────────────────────────────────────
// Generates professional emails based on context and selected tone.
const generateEmail = async (content, tone = "professional") => {
  const prompt = `
Generate a ${tone} email based on the following content:
"${content}"

Tone Guidelines:
- Professional: Clear, polite, and business-oriented.
- Strict: Direct, authoritative, and focused on accountability.
- Friendly: Warm, encouraging, and supportive.

Respond with ONLY the email subject and body in this JSON format:
{
  "subject": "Email Subject",
  "body": "Email Body Text"
}
`;
  const result = await callGrok(prompt);
  return JSON.parse(result);
};

// ─── SELECT EMPLOYEES ─────────────────────────────────────────
// Sends project requirements + employee list to Grok
// Grok returns which employees are best suited and why
const selectEmployees = async (project, employees) => {
  const employeeList = employees
    .map((e) => {
      const skills = Array.isArray(e.skills) ? e.skills.join(", ") : "None";
      return `- ID: ${e._id || e.id}, Name: ${e.name}, Skills: ${skills}, Department: ${e.department || "General"}`;
    })
    .join("\n");

  const prompt = `
You are an AI Project Manager selecting the best employees for a project.

Project Title: ${project.title}
Project Description: ${project.description}
Required Skills: ${project.requiredSkills.join(", ")}

Available Employees:
${employeeList}

Select the most suitable employees for this project based on skill match.
Return the EMP_ID for each selection.

Respond ONLY with this exact JSON format:
{
  "selectedEmployees": [
    {
      "id": "EMP_ID",
      "name": "employee name",
      "reason": "why they are a good fit in one sentence"
    }
  ],
  "summary": "one sentence summary of the selection decision"
}
`;

  const result = await callGrok(prompt);
  return JSON.parse(result);
};

// ─── GENERATE WORKFLOW ────────────────────────────────────────
// Sends project details to Grok
// Grok returns a structured task list with AI-generated deadlines
const generateWorkflow = async (project, employees) => {
  const employeeNames = employees.map((e) => e.name).join(", ");

  const prompt = `
You are an AI Project Manager creating a detailed task workflow.
Ensure tasks are specific, measurable, and tailored to the respective employee's skills.

Project Title: ${project.title}
Project Description: ${project.description}
Required Skills: ${project.requiredSkills.join(", ")}
Assigned Employees: ${employeeNames}
Project Deadline (Overall): ${project.deadline || "Not specified"}

Instructions:
1. Break the project into clearly defined tasks.
2. AI-generated deadlines: For each task, set a specific deadline date based on overall project timing.
3. Assign tasks based on matching employee skills.
4. Ensure descriptions are highly interpretable for employees (generalized but clear).

Respond ONLY with this exact JSON format:
{
  "tasks": [
    {
      "title": "task title",
      "description": "highly interpretable description",
      "assignedToId": "EMP_ID",
      "assignedToName": "employee name",
      "estimatedDays": 2,
      "deadline": "YYYY-MM-DD",
      "priority": "high"
    }
  ],
  "totalEstimatedDays": 10,
  "summary": "brief overview of the workflow strategy"
}

Priority must be one of: "high", "medium", "low"
`;

  const result = await callGrok(prompt);
  return JSON.parse(result);
};

// ─── FORM TEAMS (SYSTEMATIC CREW) ──────────────────────────
// Groups employees into specialized teams based on deep evaluation of history.
const formTeams = async (requirements, employees) => {
  const employeeList = employees
    .map((e) => {
      const skills = Array.isArray(e.skills) ? e.skills.join(", ") : "None";
      const pastProjs = Array.isArray(e.pastProjects) ? e.pastProjects.map((p) => p.title).join(", ") : "None";
      return `- ID: ${e._id || e.id}, Name: ${e.name}, Skills: ${skills}, Experience: ${e.experience || 0}yrs, Past Projects: ${pastProjs}, Bio: ${e.bio || "None"}`;
    })
    .join("\n");

  const prompt = `
You are an AI Project Manager forming a specialized crew.
Requirements: ${requirements}

Available Employees:
${employeeList}

TASK:
Analyze the requirements and available talent. Evaluate each employee based on:
1. Core Skills matching against requirements.
2. Total Years of Experience.
3. Relevant Past Projects worked.
4. Professional Bio/Summary.

Group the MOST APPROPRIATE employees into specialized teams (e.g., "Web Development Team", "Research & Design Team").
Only use employees provided in the list.

Respond ONLY with this exact JSON format:
{
  "teams": {
    "Team Name": ["employee_id1", "employee_id2"]
  },
  "rationale": "One specific sentence explaining the selection criteria."
}

IMPORTANT: Provide the actual employee IDs (A-Z0-9) as the array values, not their names.
`;

  const result = await callGrok(prompt);
  return JSON.parse(result);
};

// ─── GENERATE EMAIL (ENHANCED) ────────────────────────────────
const generateEmailEnhanced = async (projectName, recipients, instruction, tone, context) => {
  const recipientNames = recipients.map(r => r.name).join(", ");
  const prompt = `
Generate a ${tone} email for the project "${projectName}".
Recipients: ${recipientNames}
Instruction: ${instruction}

Project Context:
${context}

Tone Guidelines:
- Professional: Clear, polite, and business-oriented.
- Collaborative: Warm, encouraging, and team-focused.
- Motivator: Inspirational and high-energy.
- Strict: Direct and focused on accountability.
- Urgent: Fast-paced and task-critical.

Respond ONLY with the email body text. Do NOT include subject lines, preamble, or sign-offs like "Best regards". Just the core message body.
`;
  return await callGrokFreeform(prompt);
};

// ─── GENERATE FEEDBACK ────────────────────────────────────────
// Sends employee's report to Grok
// Grok returns professional feedback for the manager
const generateFeedback = async (report, task, employee) => {
  const prompt = `
You are an AI Project Manager reviewing an employee's task report.

Employee Name: ${employee.name}
Task Title: ${task.title}
Task Description: ${task.description}

Employee's Report:
${report.content}

Provide professional feedback on this report.

Respond ONLY with this exact JSON format:
{
  "rating": 8,
  "strengths": "what the employee did well",
  "improvements": "what could be better",
  "recommendation": "approve or needs revision",
  "detailedFeedback": "2-3 sentences of professional feedback"
}

Rating must be a number from 1 to 10.
Recommendation must be either "approve" or "needs revision".
`;

  const result = await callGrok(prompt);
  return JSON.parse(result);
};

module.exports = {
  // Exported so controllers can reuse the exact same Grok call logic.
  callGrok,
  callGrokFreeform,
  callGrokActionable,
  generateEmail,
  chat,
  selectEmployees,
  generateWorkflow,
  generateFeedback,
  formTeams,
  generateEmailEnhanced,
};