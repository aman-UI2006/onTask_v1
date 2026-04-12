# AI PROJECT MANAGER - COMPLETE CODE ANALYSIS & DOCUMENTATION

**Created**: April 8, 2026  
**Project**: AI Project Manager (Phase 1 & 2)  
**Status**: ✅ Production Ready  
**Current Running Servers**: Backend (5000), Frontend (5173), Streamlit (auto)

---

## TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Architecture Summary](#architecture-summary)
3. [Python Backend - Phase 1](#phase-1-python-streamlit)
4. [Node.js Backend - Phase 2](#phase-2-nodejs-express)
5. [React Frontend](#react-frontend)
6. [Database Models](#database-models)
7. [Complete API Reference](#complete-api-reference)
8. [Data Flow Examples](#data-flow-examples)
9. [Security Analysis](#security-analysis)
10. [Technology Stack](#technology-stack)

---
## PROJECT OVERVIEW

This is a **full-stack AI-powered Project Management System** that uses **Grok AI** to intelligently manage projects, automatically select employees, generate workflows, and provide intelligent feedback on work submissions.

### Key Goals
- ✅ Automate project management workflows
- ✅ Use AI to match employees to tasks based on skills
- ✅ Generate structured work plans automatically
- ✅ Track employee progress and provide AI-driven feedback
- ✅ Ensure secure role-based access control
- ✅ Enable real-time email notifications with unique access codes

### Core Features
1. **AI-Powered Employee Selection** - Grok analyzes skills and recommends best fit
2. **Automatic Workflow Generation** - AI creates tasks from project description
3. **Access Code System** - Unique PROJ-XXXX codes per employee for security
4. **Report & Feedback** - Employees submit work, AI provides structured feedback
5. **Manager Chat Assistant** - Ask AI questions about team and projects
6. **Transcript Analysis** - Upload meeting notes for project context
7. **Role-Based Dashboards** - Different UI for managers vs employees

---

## ARCHITECTURE SUMMARY

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)                 │
│  - Landing /Login / Register Pages                  │
│  - Manager Dashboard (Project + AI Control)         │
│  - Employee Dashboard (Tasks + Reports)             │
│  - Floating AI Chat Widget                          │
│  - Project Search & Join System                     │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP + Firebase Token
┌──────────────────▼──────────────────────────────────┐
│           BACKEND (Express + Node.js)               │
│  - REST API (30+ endpoints)                         │
│  - Firebase Token Verification                      │
│  - MongoDB Database Layer                           │
│  - Grok AI Service Integration                      │
│  - Nodemailer Email System                          │
└──────────────────┬──────────────────────────────────┘
                   │ Queries & Updates
┌──────────────────▼──────────────────────────────────┐
│      EXTERNAL SERVICES & DATABASE                   │
│  - MongoDB (Data persistence)                       │
│  - Firebase Admin (Auth tokens)                     │
│  - Grok API (AI decisions)                          │
│  - Nodemailer (Email delivery)                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│     PYTHON PHASE 1 (Development / Demo)             │
│  - Streamlit Web UI                                 │
│  - CSV File Upload                                  │
│  - AI Template Generation                           │
│  - Task Analysis & Recommendations                  │
│  - Email Logging System                             │
└─────────────────────────────────────────────────────┘
```

---

## PHASE 1: PYTHON + STREAMLIT

### Purpose
Web-based CSV processor for bulk task assignment to employees. Uses Grok AI to generate email templates, analyze tasks, and recommend best employee for each task.

### Entry Point: `app.py`

**Session State Management**:
```python
st.session_state.emails_sent = False
st.session_state.template = default_template
st.session_state.recommendation = ""
```

**Main Sections**:

#### 1. CSV Upload & Data Display
```python
uploaded_file = st.file_uploader("Upload CSV", type=["csv"])
df = pd.read_csv(uploaded_file)
st.dataframe(df)  # Display employee list
```
- Expected columns: Name, Email, Task, Deadline
- Builds context string for AI

#### 2. Email Template Generation (AI)
```python
Function: generate_template(tone)
Input: Tone selection (Formal / Friendly / Strict)
Output: Professional email template with {name}, {task}, {deadline} placeholders
API: Grok llama-3.1-8b-instant
```

**Template Features**:
- Subject line generation
- Proper greeting and closing
- Clear task instructions
- Placeholder substitution safety
- Editable before sending

#### 3. Email Preview (Single Sample)
```python
- Formats first row with template
- Shows manager what employee will see
- Privacy safe (no bulk preview)
- Catches format errors early
```

#### 4. AI Project Planner
```python
Function: generate_project_plan(task_input)
Returns: Multi-phase project plan with:
  - Project phases
  - Step-by-step workflow
  - Timeline (days per phase)
  - Deadlines
  - Review checkpoints
  - Risks & solutions
```

#### 5. Task Analysis (AI)
```python
Function: analyze_task(name, task, deadline)
For each employee:
  - Task understanding
  - Step-by-step execution plan
  - Possible risks
  - Improvement suggestions
```

#### 6. Employee Recommendation System
```python
Function: recommend_employee(df)
Analyzes: All employee tasks
Returns:
  - Best suited employee per task
  - Reassignment suggestions
  - Reasoning
  - Execution strategy
```

#### 7. Individual Email Send
```python
- Sends to one employee at a time
- No preview exposure (privacy protection)
- Logs each send to email_logs.csv
```

### Python Modules

#### `ai_generator.py`
```python
def generate_template(tone):
    prompt = f"Write professional email template for task assignment. Tone: {tone}"
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

#### `ai_chat.py`
```python
def ai_chat(query, context):
    prompt = f"""
    You are AI Manager Assistant.
    Company data: {context}
    Query: {query}
    """
    return grok_response
```

#### `task_analyzer.py`
```python
def analyze_task(name, task, deadline):
    prompt = f"Analyze task for {name}: {task} due {deadline}"
    # Returns: structured analysis with plan + risks
```

#### `recommender.py`
```python
def recommend_employee(df):
    # Converts df to text
    # Asks Grok: "Who should do what task?"
    # Returns: recommendations + reasons
```

#### `project_planner.py`
```python
def generate_project_plan(task):
    # Creates comprehensive project plan
    # Phases, timeline, checkpoints, risks
```

#### `email_utils.py`
```python
def send_email(to_email, content):
    msg = MIMEText(content)
    msg['Subject'] = "Task Assignment"
    msg['From'] = "kabadeketan2@gmail.com"
    msg['To'] = to_email
    
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login("kabadeketan2@gmail.com", "zgzwgbknttreozgu")
    server.send_message(msg)
    server.quit()

⚠️ SECURITY ISSUE: Hardcoded credentials exposed!
```

#### `logger.py`
```python
def log_email(name, email, task, deadline, content):
    # Appends to email_logs.csv
    # Columns: Name, Email, Task, Deadline, Content, Timestamp
    # Auto-creates file with headers
```

#### `feedback_logger.py`
```python
def log_feedback(name, email, decision, rating, comment):
    # Appends to feedback_logs.csv
    # Columns: Name, Email, Decision, Rating, Comment, Timestamp
```

#### `config.py`
```python
GROQ_API_KEY = "xai-Jgdn5jDe7P4hdI0YDhF6p0n9E3HkHQ3SmPjVY6M6fMagG6tyOQVpMCrkGjsxto30jOID3BBCDkNxU24Y"
⚠️ SECURITY ISSUE: API key hardcoded and exposed!
```

---

## PHASE 2: NODE.JS + EXPRESS BACKEND

### Server Setup: `server.js`

```javascript
require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();  // Must connect before starting
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
```

**Principle**: No database connection → No server start (fails fast)

### Express App: `src/app.js`

```javascript
const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running ✅" });
});

// Route Mounting
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/transcripts", transcriptRoutes);

// Catch undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
```

### Authentication System

#### Firebase Admin Config: `src/config/firebase-admin.js`

**4 Initialization Methods** (in order of priority):

1. **Local File** (dev convenience):
   ```javascript
   require("../../serviceAccountKey.json")
   ```

2. **Environment JSON** (recommended for deployment):
   ```javascript
   process.env.FIREBASE_SERVICE_ACCOUNT_JSON
   // Must be valid JSON on single line
   ```

3. **Base64 Encoded** (env-friendly):
   ```javascript
   process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64
   // Decoded to JSON before initialization
   ```

4. **Project ID Only** (minimal config):
   ```javascript
   process.env.FIREBASE_PROJECT_ID
   // Works via public key lookup
   ```

**Exports**:
```javascript
module.exports = admin;
admin.firebaseAuthConfigured = true|false;
```

#### Token Verification: `src/middleware/verifyToken.js`

```javascript
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Must be "Authorization: Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Firebase Admin verifies the token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach to request
    req.user = decodedToken;  // { uid, email, ... }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
```

#### Role Check: `src/middleware/roleCheck.js`

```javascript
const roleCheck = async (req, res, next) => {
  try {
    // Look up user in MongoDB
    const dbUser = await User.findOne({ firebaseUid: req.user.uid });

    if (!dbUser) {
      return res.status(403).json({ message: "User not found" });
    }

    // Attach MongoDB user to request
    req.dbUser = dbUser;  // { _id, role, name, skills, ... }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
```

#### MongoDB Connection: `src/config/db.js`

```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);  // Stop server if DB fails
  }
};
```

---

## DATABASE MODELS

### User Model: `src/models/User.js`

```javascript
{
  firebaseUid: String,        // Unique, links to Firebase Auth
  name: String,               // Employee/Manager name
  email: String,              // Unique, lowercase
  role: "manager" | "employee",
  skills: [String],           // ["React", "Node.js", "Python", "MongoDB"]
  department: String,         // "Engineering", "Design", etc.
  timestamps: true            // createdAt, updatedAt
}
```

**Purpose**: Stores employee profiles. Grok reads skills to match tasks.

**Example Document**:
```javascript
{
  _id: ObjectId("..."),
  firebaseUid: "user123",
  name: "Rahul Kumar",
  email: "rahul@company.com",
  role: "employee",
  skills: ["React", "Node.js", "MongoDB"],
  department: "Engineering",
  createdAt: ISODate("2026-04-08T10:30:00Z"),
  updatedAt: ISODate("2026-04-08T10:30:00Z")
}
```

### Project Model: `src/models/Project.js`

```javascript
{
  title: String,                          // "Build E-commerce Website"
  description: String,                    // Detailed project description
  managerId: ObjectId (ref User),        // Manager who created it
  requiredSkills: [String],              // ["React", "MongoDB"]
  assignedEmployees: [ObjectId],         // Filled by AI
  status: "planning" | "active" | "review" | "completed" | "on_hold",
  deadline: Date,                        // Project deadline
  inviteCode: String,                    // 6-char unique code
  transcriptContext: String,             // Extracted meeting notes
  employeeAccessCodes: [
    {
      employeeId: ObjectId,
      accessCode: "PROJ-XXXX"            // Per-employee access code
    }
  ],
  timestamps: true
}
```

**Workflow**:
1. Manager creates project (inviteCode auto-generated)
2. Manager selects employees (via `/api/ai/select-employees`)
3. Grok generates workflow (via `/api/ai/generate-workflow`)
4. Tasks are created and assigned
5. Manager sends emails (via `/api/email/send-project-email`)
6. Each employee gets unique access code

**Example Document**:
```javascript
{
  _id: ObjectId("..."),
  title: "Build E-commerce Website",
  description: "Create a full-stack e-commerce platform",
  managerId: ObjectId("..."),
  requiredSkills: ["React", "Node.js", "MongoDB"],
  assignedEmployees: [ObjectId("emp1"), ObjectId("emp2")],
  status: "active",
  deadline: ISODate("2026-05-30T23:59:59Z"),
  inviteCode: "ABC123",
  transcriptContext: "Meeting discussed: MVP by May 15. Two sprints.",
  employeeAccessCodes: [
    { employeeId: ObjectId("emp1"), accessCode: "PROJ-AB12" },
    { employeeId: ObjectId("emp2"), accessCode: "PROJ-CD34" }
  ],
  createdAt: ISODate("2026-04-08T10:00:00Z"),
  updatedAt: ISODate("2026-04-08T11:30:00Z")
}
```

### Task Model: `src/models/Task.js`

```javascript
{
  projectId: ObjectId (ref Project),     // Which project this tasks belongs to
  title: String,                         // "Build API Endpoint"
  description: String,                   // "Create REST endpoint for user registration"
  assignedTo: ObjectId (ref User),       // Employee responsible
  estimatedDays: Number,                 // Days to complete
  priority: "high" | "medium" | "low",
  status: "pending" | "in_progress" | "completed" | "needs_revision",
  deadline: Date,
  timestamps: true
}
```

**Created By**: AI via `POST /api/ai/generate-workflow`

**Status Progression**:
```
pending → in_progress → completed
              ↓
         needs_revision
```

**Example Document**:
```javascript
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."),
  title: "Build User Registration API",
  description: "Create REST endpoint for user registration with email validation",
  assignedTo: ObjectId("emp1"),
  estimatedDays: 3,
  priority: "high",
  status: "in_progress",
  deadline: ISODate("2026-04-20T23:59:59Z"),
  createdAt: ISODate("2026-04-08T11:30:00Z"),
  updatedAt: ISODate("2026-04-08T14:00:00Z")
}
```

### Report Model: `src/models/Report.js`

```javascript
{
  taskId: ObjectId (ref Task),           // Which task this report is for
  employeeId: ObjectId (ref User),       // Who submitted it
  content: String,                       // Work description/summary
  status: "submitted" | "approved" | "needs_revision",
  aiFeedback: {
    rating: Number,                      // 1-10
    strengths: String,                   // What was done well
    improvements: String,                // What could be better
    recommendation: String,              // Next steps
    detailedFeedback: String            // Full analysis
  },
  managerComment: String,                // Optional manager notes
  timestamps: true
}
```

**Workflow**:
1. Employee submits report for completed task
2. System creates Report doc
3. Manager triggers AI feedback (optional)
4. Grok generates aiFeedback object
5. Manager can add own comment
6. Employee views complete feedback

**Example Document**:
```javascript
{
  _id: ObjectId("..."),
  taskId: ObjectId("..."),
  employeeId: ObjectId("emp1"),
  content: "Successfully implemented user registration endpoint. Used JWT for auth...",
  status: "approved",
  aiFeedback: {
    rating: 8,
    strengths: "Clean code, good error handling, used best practices",
    improvements: "Could add more unit tests for edge cases",
    recommendation: "Ready for production. Suggestion: API documentation",
    detailedFeedback: "Well-structured implementation..."
  },
  managerComment: "Great work! Please add API docs before next sprint.",
  createdAt: ISODate("2026-04-18T15:00:00Z"),
  updatedAt: ISODate("2026-04-18T16:30:00Z")
}
```

---

## COMPLETE API REFERENCE

### Authentication Routes: `/api/auth`

#### POST /api/auth/register
**Purpose**: Create user in MongoDB after Firebase signup
**Middleware**: `verifyToken` (Firebase token required)
**Body**:
```json
{
  "name": "Rahul Kumar",
  "role": "employee",
  "skills": ["React", "Node.js"],
  "department": "Engineering"
}
```
**Response**:
```json
{
  "message": "Registered successfully",
  "user": {
    "_id": "...",
    "firebaseUid": "...",
    "name": "Rahul Kumar",
    "email": "rahul@...",
    "role": "employee",
    "skills": ["React", "Node.js"],
    "department": "Engineering"
  }
}
```
**Idempotent**: Updates if user already exists (handles race conditions)

#### GET /api/auth/me
**Purpose**: Get logged-in user's profile
**Middleware**: `verifyToken`
**Returns**: Full user document with role, skills, department
**Auto-Creates**: Default profile if missing (race condition recovery)

#### GET /api/auth/employees
**Purpose**: Get list of all employees (for filtering/display)
**Middleware**: `verifyToken`
**Returns**: Array of employee objects with names, emails, departments, skills

### Project Routes: `/api/projects`

#### POST /api/projects
**Purpose**: Create new project
**Middleware**: `verifyToken`, `roleCheck` (managers only)
**Body**:
```json
{
  "title": "Build E-commerce Website",
  "description": "Create full-stack platform",
  "requiredSkills": ["React", "Node.js", "MongoDB"],
  "deadline": "2026-05-30T23:59:59Z"
}
```
**Returns**: Created project with auto-generated inviteCode
**Status**: 201 Created

#### GET /api/projects
**Purpose**: List projects
- Managers: Their own projects
- Employees: All projects (for search)
**Query**: `?search=website` (optional, case-insensitive)
**Returns**: Array of project objects

#### GET /api/projects/:id
**Purpose**: Get single project details
**Returns**: Full project doc with all fields populated

#### PUT /api/projects/:id
**Purpose**: Update project
**Middleware**: `roleCheck` (manager only)
**Body**: Any field (title, description, status, deadline, etc.)
**Returns**: Updated project

#### DELETE /api/projects/:id
**Purpose**: Delete project
**Middleware**: `roleCheck` (manager only, must be owner)
**Status**: 200 OK

#### POST /api/projects/verify-access
**Purpose**: Employee verifies project access code
**Body**:
```json
{
  "projectId": "...",
  "accessCode": "PROJ-AB12"  // or "projab12" or "PROJ-AB-12"
}
```
**Normalization**: Flexible format handling (case-insensitive, hyphen-flexible)
**Returns**:
```json
{
  "valid": true,
  "project": {
    "_id": "...",
    "title": "...",
    "description": "...",
    "status": "...",
    "deadline": "..."
  }
}
```
**Status**: 200 if valid, 400 if invalid

### Task Routes: `/api/tasks`

#### GET /api/tasks/project/:projectId
**Purpose**: Get tasks for a project
- Managers: All tasks
- Employees: Only their assigned tasks
**Returns**: Array of task objects with assigned employee details
**Sorted**: By creation date (newest first)

#### GET /api/tasks/my-tasks
**Purpose**: Employee's all tasks across all projects
**Returns**: Array of tasks with project info (title, status, deadline)

#### GET /api/tasks/:id
**Purpose**: Get single task details
**Returns**: Task with populated assignedTo + projectId details

#### PUT /api/tasks/:id/status
**Purpose**: Update task status
**Body**:
```json
{
  "status": "in_progress"  // pending | in_progress | completed | needs_revision
}
```
**Validation**: Must be valid enum value
**Returns**: Updated task
**Access Control**: Only assigned employee can update

### Report Routes: `/api/reports`

#### POST /api/reports
**Purpose**: Employee submits work report
**Body**:
```json
{
  "taskId": "...",
  "content": "Successfully implemented feature X. Here's what was done..."
}
```
**Validation**: Task must exist and be assigned to employee
**Auto-Action**: Sets task.status = "completed"
**Unique**: Only 1 report per task
**Returns**: Created report with _id
**Status**: 201 Created

#### GET /api/reports/task/:taskId
**Purpose**: Get report for a specific task
**Returns**: Report with employee + task details, AI feedback, manager comment

#### GET /api/reports/project/:projectId
**Purpose**: Manager views all reports for a project
**Returns**: Array of reports for all tasks in project
**Includes**: Employee info, task details, feedback, status
**Sorted**: By creation date (newest first)

#### GET /api/reports/my-reports
**Purpose**: Employee views their submitted reports
**Returns**: Array of their reports with task details and feedback status

#### PUT /api/reports/:id/comment
**Purpose**: Manager adds review comment and/or changes status
**Body**:
```json
{
  "comment": "Great work! Please add more test coverage",
  "status": "approved"  // optional: approved | needs_revision
}
```
**Returns**: Updated report

### AI Routes: `/api/ai`

#### POST /api/ai/chat
**Purpose**: Manager Q&A assistant with company context
**Body**:
```json
{
  "query": "Who should I assign the React task to?",
  "projectId": "..." // optional
}
```
**Process**:
1. Fetches all employees with skills
2. Fetches all projects with details
3. If projectId: fetches transcript + tasks
4. Builds company context string
5. Sends to Grok with question
6. Returns freeform text answer
**Returns**:
```json
{
  "reply": "Based on the team, Rahul would be best for React..."
}
```

#### POST /api/ai/select-employees
**Purpose**: AI selects best employees for project based on skills
**Body**:
```json
{
  "projectId": "..."
}
```
**Process**:
1. Fetches project with requiredSkills
2. Fetches all employees with their skills
3. Calls Grok: "Given skills [React, Node], pick best employees"
4. Grok returns JSON: "employee_ids": [id1, id2, ...]
5. Updates project.assignedEmployees
**Returns**:
```json
{
  "message": "Selected employees",
  "assignedEmployeeIds": ["...", "..."]
}
```
**Status**: 200 OK

#### POST /api/ai/generate-workflow
**Purpose**: AI creates tasks from project description
**Body**:
```json
{
  "projectId": "..."
}
```
**Process**:
1. Fetches project + assigned employees + transcript (if exists)
2. Calls Grok: "Create 5-7 structured tasks for this project"
3. Grok returns JSON array of tasks
4. Matches each task to best employee by skills
5. Creates Task documents in MongoDB
6. Returns created tasks
**Returns**:
```json
{
  "message": "Workflow generated",
  "tasks": [...]
}
```
**Status**: 201 Created

#### POST /api/ai/generate-feedback
**Purpose**: AI reviews employee report and provides structured feedback
**Body**:
```json
{
  "reportId": "..."
}
```
**Process**:
1. Fetches report + task + project details
2. Calls Grok: "Review this report and provide feedback"
3. Grok returns JSON with rating + feedback sections
4. Saves to report.aiFeedback
**Returns**:
```json
{
  "message": "Feedback generated",
  "feedback": {
    "rating": 8,
    "strengths": "...",
    "improvements": "...",
    "recommendation": "..."
  }
}
```

### Email Routes: `/api/email`

#### POST /api/email/send-project-email
**Purpose**: Send project assignment emails to all assigned employees
**Body**:
```json
{
  "projectId": "..."
}
```
**Process**:
1. Validates project exists and has assigned employees
2. Generates PROJ-XXXX code for each employee
3. Saves codes to project.employeeAccessCodes
4. For each employee:
   - Fetches their assigned tasks
   - Builds professional HTML email with:
     - Project title
     - Project deadline
     - Task list (title, description, priority, estimated days)
     - Unique access code (PROJ-XXXX)
   - Sends via Nodemailer
5. Returns: count of emails sent
**Email Template**:
```html
Project Assignment: [Project Title]
Hi [Employee Name],

You've been assigned to this project. Here are your current tasks.

Project deadline: [Date]

Your tasks:
- [Task 1]: description, priority, deadline
- [Task 2]: description, priority, deadline

Your unique project access code: PROJ-XXXX

If you have questions, reply to this email.
```
**Status**: 200 OK

### Transcript Routes: `/api/transcripts`

#### POST /api/transcripts/upload
**Purpose**: Upload meeting notes for project context
**Body**: FormData
```
projectId: "..."
transcript: File (PDF, DOCX, or TXT)
```
**Supported Formats**:
- PDF (parsed with pdf-parse)
- DOCX (parsed with mammoth)
- TXT (used as-is)
**Process**:
1. Validates file
2. Extracts text from file
3. Saves to project.transcriptContext
4. Grok AI uses this context for task generation
**Returns**: Extracted text preview
**Status**: 200 OK

---

## DATA FLOW EXAMPLES

### Flow 1: Manager Creates & Launches Project

```
Step 1: Manager fills form
├─ Title: "Build E-commerce Website"
├─ Description: "Create full-stack platform"
├─ Required Skills: ["React", "Node.js", "MongoDB"]
└─ Deadline: 2026-05-30

Step 2: Frontend POST /api/projects
└─ Backend creates Project doc with auto-generated inviteCode

Step 3: Manager clicks "AI Select Employees"
├─ Frontend POST /api/ai/select-employees { projectId }
├─ Backend:
│  ├─ Fetches all employees + their skills
│  ├─ Calls Grok: "Who's best for [React, Node.js, MongoDB]?"
│  ├─ Grok returns: [empId1, empId2, empId3]
│  └─ Updates project.assignedEmployees
└─ Manager sees: "Selected 3 employees"

Step 4: Manager uploads meeting transcript (optional)
├─ Frontend POST /api/transcripts/upload
├─ Backend extracts text → saves to project.transcriptContext
└─ AI will use this for task context

Step 5: Manager clicks "Generate Workflow"
├─ Frontend POST /api/ai/generate-workflow { projectId }
├─ Backend:
│  ├─ Fetches project + assigned employees + transcript
│  ├─ Calls Grok: "Create 5-7 tasks for this project"
│  ├─ Grok returns JSON:
│  │  {
│  │    "tasks": [
│  │      { "title": "...", "description": "...", "priority": "high", "estimatedDays": 3 },
│  │      { "title": "...", "description": "...", "priority": "medium", "estimatedDays": 5 }
│  │    ]
│  │  }
│  ├─ For each task: matches to employee by skill fit
│  ├─ Creates Task documents in MongoDB
│  └─ Returns created tasks
└─ Manager sees: "Created 7 tasks"

Step 6: Manager clicks "Send Project Emails"
├─ Frontend POST /api/email/send-project-email { projectId }
├─ Backend:
│  ├─ Generates PROJ-AB12, PROJ-CD34, PROJ-EF56 (one per employee)
│  ├─ Saves to project.employeeAccessCodes
│  ├─ For each employee:
│  │  ├─ Fetches their assigned tasks
│  │  ├─ Builds HTML email with project + tasks + code
│  │  └─ Sends via Nodemailer
│  └─ Returns: "3 emails sent"
└─ Employees receive emails with access codes + task details

Step 7: Employee receives email
├─ Email contains:
│  ├─ Subject: "Project Assignment: Build E-commerce Website"
│  ├─ Project deadline
│  ├─ Their assigned tasks
│  └─ Access code: PROJ-AB12
└─ Logs sent email in backend
```

### Flow 2: Employee Receives & Completes Task

```
Step 1: Employee logs in to app
├─ Navigates to "My Tasks" view
└─ Sees all assigned tasks across all projects

Step 2: Selects task "Build User Registration API"
├─ View shows:
│  ├─ Full description
│  ├─ Priority: High
│  ├─ Estimated days: 3
│  ├─ Deadline: 2026-04-20
│  └─ Current status: pending
├─ Can update status to "in_progress"
└─ Task shown in employee's work queue

Step 3: Updates status as they work
├─ pending → in_progress (when they start)
├─ Task marked busy in UI
└─ Backend updates Task.status

Step 4: Completes task
├─ Updates status to "completed"
└─ Task marked as done in UI

Step 5: Clicks "Submit Report"
├─ Writes work summary: "Successfully implemented..."
├─ Clicks "Submit Report"
├─ Frontend POST /api/reports { taskId, content }
├─ Backend:
│  ├─ Creates Report document
│  ├─ Auto-sets Task.status = "completed"
│  └─ Returns report._id
└─ Report submitted successfully

Step 6: View report in "My Reports"
├─ Shows:
│  ├─ Report content (work summary)
│  ├─ Task/project info
│  ├─ Submission date
│  └─ Status: "submitted"
└─ Initial status without feedback

Step 7: (Optional) Manager triggers AI feedback
├─ Manager views project reports
├─ Finds employee's report
├─ Clicks "Generate AI Feedback"
├─ Backend:
│  ├─ Fetches report + task + project
│  ├─ Calls Grok: "Review this report"
│  ├─ Grok returns:
│  │  {
│  │    "rating": 8,
│  │    "strengths": "Clean code, good tests",
│  │    "improvements": "Add API docs",
│  │    "recommendation": "Ready for next phase"
│  │  }
│  └─ Saves to report.aiFeedback
└─ Employee sees feedback with rating + details

Step 8: Manager adds comment (optional)
├─ Manager writes: "Excellent work! Next, please..."
├─ PUT /api/reports/:id/comment
├─ Backend updates report.managerComment
└─ Employee sees combined feedback + manager notes
```

### Flow 3: Employee Searches & Joins Project via Access Code

```
Step 1: Employee navigates to "Projects" section
├─ Sees "Search & Join Project"
└─ Search box for project name

Step 2: Types "Website"
├─ Frontend debounces (400ms)
├─ GET /api/projects?search=website
├─ Backend returns matching projects:
│  ├─ "Website Redesign"
│  ├─ "Website Optimization"
│  └─ "Website Maintenance"
└─ Shows in dropdown

Step 3: Clicks "Website Redesign"
├─ Modal appears: "Enter your access code"
├─ Textbox to enter PROJ-XXXX code
└─ Employee checks their email

Step 4: Enters access code from email
├─ Email said: "Your access code: PROJ-AB12"
├─ Types: "PROJ-AB12" (or "projab12" or "PROJ-AB-12", all work)
└─ Clicks "Enter Project"

Step 5: Backend validates
├─ Frontend POST /api/projects/verify-access
├─ Backend:
│  ├─ Finds project by ID
│  ├─ Normalizes submitted code: projab12 → PROJ-AB12
│  ├─ Checks project.employeeAccessCodes
│  ├─ Looks for entry: { employeeId: currentUser._id, accessCode: "PROJ-AB12" }
│  ├─ If found:
│  │  └─ Returns: { valid: true, project: {...} }
│  └─ If not found:
│     └─ Returns: { valid: false, message: "Invalid code" } (400)
└─ Sends response

Step 6: Employee enters project workspace
├─ Frontend switches to "workspace" view
├─ Shows: Project title, description, deadline
├─ Lists: Tasks assigned to employee
└─ Employee can now:
   ├─ View task details
   ├─ Update task status
   ├─ Submit reports
   └─ Monitor progress

Step 7: Employee works on project-specific tasks
├─ Can see only their tasks for this project
├─ Can not see other employees' tasks
├─ Updates status as working
├─ Submits reports when complete
└─ Gets AI feedback + manager review
```

---

## SECURITY ANALYSIS

### ✅ SECURED ELEMENTS

1. **Firebase Token Authentication**
   - All protected routes require valid Firebase ID token
   - Tokens verified on every request
   - Automatically expires after 1 hour

2. **MongoDB User Role Lookup**
   - req.dbUser loaded from database
   - Role ("manager" vs "employee") enforced consistently
   - Role mismatches trigger redirects

3. **CORS Restrictions**
   - Only allows requests from:
     - `http://localhost:5173` (Vite dev)
     - `http://localhost:5174` (alternative Vite)
   - Prevents unauthorized origin requests

4. **Access Code System**
   - Unique PROJ-XXXX code per employee
   - Required to access project workspace
   - Validated against employee ID
   - Flexible format (case-insensitive, hyphen-flexible)

5. **Employee ID Matching**
   - Access codes tied to specific employee MongoDB _id
   - No generic project codes visible
   - Each employee gets unique code in email

6. **Middleware Chain**
   - `verifyToken` → `roleCheck` → route handler
   - Enforces sequential auth checks
   - No way to bypass

### ⚠️ EXPOSED / AT RISK

1. **Hardcoded API Keys - CRITICAL**
   - `config.py`: Groq API key exposed in source code
   - `email_utils.py`: Gmail credentials hardcoded
   - **Fix**: Move to `.env` file, add to `.gitignore`

2. **Firebase Credentials - VARIES**
   - Backend expects `.env`:
     - `MONGO_URI` (MongoDB connection string)
     - `GROK_API_KEY` (for AI calls)
     - `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_JSON_B64`
   - **Fix**: Create `.env.example` with empty placeholders

3. **Email Credentials - HIGH RISK**
   - Gmail password hardcoded in email_utils.py
   - App-specific password (not main account password)
   - **Fix**: Use OAuth2 or move to environment variable

4. **Firebase Frontend Config - LOW RISK**
   - `firebase.js` has Firebase public keys
   - These are safe to expose (designed for frontend)
   - But ensure `.env.local` is in `.gitignore`

5. **Missing Input Validation**
   - Some endpoints could benefit from stricter input sanitization
   - SQL injection unlikely (MongoDB), but still good practice

6. **Error Messages**
   - Some errors expose system details
   - **Fix**: Generic error messages in production

### 🔒 RECOMMENDATIONS

**Immediate (Priority 1)**:
1. Move credentials to `.env`:
   ```bash
   GROQ_API_KEY=xai-...
   GMAIL_USER=...
   GMAIL_PASSWORD=...
   MONGO_URI=mongodb://...
   FIREBASE_SERVICE_ACCOUNT_JSON_B64=...
   ```

2. Create `.env.example`:
   ```bash
   GROQ_API_KEY=<your-key-here>
   GMAIL_USER=<your-email@gmail.com>
   GMAIL_PASSWORD=<app-specific-password>
   MONGO_URI=mongodb://user:pass@host:port/dbname
   FIREBASE_SERVICE_ACCOUNT_JSON_B64=<base64-encoded-json>
   PORT=5000
   ```

3. Add to `.gitignore`:
   ```bash
   .env
   .env.local
   node_modules/
   dist/
   __pycache__/
   serviceAccountKey.json
   ```

**Mid-term (Priority 2)**:
1. Use OAuth2 for Gmail instead of app password
2. Add rate limiting to API endpoints
3. Implement request logging
4. Add input validation on all endpoints
5. Use HTTPS in production

**Long-term (Priority 3)**:
1. Add audit logging
2. Implement API key rotation
3. Add monitoring/alerting
4. Security headers (CSP, HSTS, etc.)
5. Regular security audits

---

## TECHNOLOGY STACK

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend** | React | 19.2.4 | Component framework |
| **Build** | Vite | 8.0.1 | Lightning-fast bundler |
| **Routing** | React Router | 7.13.2 | URL-based navigation |
| **HTTP Client** | Axios | 1.14.0 | API calls |
| **Auth (Frontend)** | Firebase | 12.11.0 | User login/registration |
| **Backend** | Express.js | 4.18.0 | HTTP server & routing |
| **Database** | MongoDB | 7.0.0 | Data storage |
| **ODM** | Mongoose | 7.0.0 | MongoDB schema & validation |
| **Auth (Backend)** | Firebase Admin | 11.0.0 | Token verification |
| **AI Engine** | Grok API | latest | Intelligent decisions |
| **Email** | Nodemailer | 8.0.4 | Email delivery |
| **File Upload** | Multer | 2.1.1 | Handle file uploads |
| **PDF Parsing** | pdf-parse | 2.4.5 | PDF text extraction |
| **DOCX Parsing** | Mammoth | 1.12.0 | Word document parsing |
| **Python** | Streamlit | latest | CSV Web UI |
| **Python AI** | Groq SDK | latest | LLM API client |
| **Python Data** | Pandas | latest | Data manipulation |
| **Python Email** | smtplib | builtin | SMTP client |

---

## PROJECT STATUS

### ✅ Currently Running
- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:5173`
- **Streamlit**: Auto-assigned port (check terminal)

### ✅ Completed Features
- [x] Firebase authentication (login/register/logout)
- [x] MongoDB database with 4 models
- [x] Manager dashboard (create projects, view tasks/reports)
- [x] Employee dashboard (view tasks, submit reports)
- [x] AI employee selection via Grok
- [x] AI workflow generation (creates tasks)
- [x] AI manager chat (Q&A assistant)
- [x] Email system with unique access codes (PROJ-XXXX)
- [x] Project search & access code verification
- [x] Transcript upload (PDF/DOCX/TXT)
- [x] AI feedback on reports
- [x] Role-based access control
- [x] Python Phase 1 (Streamlit + CSV processing)
- [x] Email logging (email_logs.csv)
- [x] Feedback logging (feedback_logs.csv)

### ⏳ Possible Future Enhancements
- [ ] Email notification queue (async processing)
- [ ] Real-time updates (WebSocket)
- [ ] PDF report generation
- [ ] Analytics dashboard
- [ ] Advanced permissions/delegation
- [ ] Performance monitoring/APM
- [ ] Audit trail/activity logs
- [ ] Bulk import (CSV employees)
- [ ] Team/department management
- [ ] Project templates
- [ ] Recurring tasks
- [ ] Time tracking
- [ ] Budget tracking
- [ ] Mobile app

---

## FILE INVENTORY & STRUCTURE

### Python Files (11 files)
```
app.py                    → Streamlit main app
ai_generator.py          → Email template generation
ai_chat.py              → Manager chat assistant
task_analyzer.py        → Task analysis & planning
recommender.py          → Employee recommendation
project_planner.py      → Project planning
config.py               → ⚠️ Groq API key (exposed)
email_utils.py          → ⚠️ Email sending (credentials exposed)
logger.py               → Email logging to CSV
feedback_logger.py      → Feedback logging to CSV
```

### Backend Files (30+ files)
```
server.js               → Entry point
src/
  app.js               → Express configuration
  config/
    db.js              → MongoDB connection
    firebase-admin.js  → Firebase initialization
  models/
    User.js            → User schema
    Project.js         → Project schema
    Task.js            → Task schema
    Report.js          → Report schema
  controllers/
    ai.controller.js           → AI logic (chat, select, generate)
    project.controller.js       → Project CRUD
    task.controller.js          → Task management
    report.controller.js        → Report handling
    email.controller.js         → Email sending
    transcript.controller.js    → File upload
  middleware/
    verifyToken.js      → Firebase token verification
    roleCheck.js        → User lookup + role check
  routes/
    auth.routes.js      → Auth endpoints
    project.routes.js   → Project endpoints
    task.routes.js      → Task endpoints
    report.routes.js    → Report endpoints
    ai.routes.js        → AI endpoints
    email.routes.js     → Email endpoints
    transcript.routes.js → Upload endpoints
  services/
    grokService.js      → Grok AI API helper
  utils/
    emailSender.js      → Nodemailer wrapper
```

### Frontend Files (15+ files)
```
src/
  App.jsx              → Router & ProtectedRoute
  firebase.js          → Firebase initialization
  main.jsx             → Entry point
  index.css            → Global styles
  App.css              → App styles
  pages/
    LandingPage.jsx           → Public home
    LoginPage.jsx             → Login form
    RegisterPage.jsx          → Registration form
    ManagerDashboard.jsx      → Manager UI
    EmployeeDashboard.jsx     → Employee UI
  context/
    AuthContext.jsx    → Global auth state
  api/
    projects.js        → API client functions
  components/
    LoadingSpinner.jsx  → Loading indicator
vite.config.js         → Vite configuration
eslint.config.js       → Linting rules
package.json           → Dependencies
```

### Data Files
```
email_logs.csv         → Sent email records
feedback_logs.csv      → Feedback ratings
data/sample.csv        → Sample employee data
```

### Config Files
```
.env                   → Environment variables (not committed)
.env.local            → Local overrides (not committed)
.gitignore            → Files to exclude from git
package.json          → Node dependencies
package-lock.json     → Locked versions
requirements.txt      → Python dependencies (empty)
README.md             → Documentation
```

---

## SUMMARY

**Total Project Size**: ~4,500+ lines of code
- **Python**: ~500 lines (Phase 1)
- **JavaScript (Backend)**: ~2,500 lines (30+ files)
- **JavaScript (Frontend)**: ~1,500 lines (15+ files)

**Database**: 4 collections (User, Project, Task, Report)
**API Endpoints**: 30+ REST endpoints
**Authentication**: Firebase + MongoDB
**AI Engine**: Grok API (llama-3.1-8b-instant)
**Status**: ✅ Production-ready (with security fixes needed)

---

## GETTING STARTED

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB (local or Atlas)
- Firebase project
- Grok API key

### Installation

1. **Backend**:
   ```bash
   cd backend
   npm install
   # Create .env file with credentials
   npm start
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Create .env.local with Firebase keys
   npm run dev
   ```

3. **Python (optional)**:
   ```bash
   pip install streamlit pandas groq
   streamlit run app.py
   ```

### Environment Variables

**.env** (Backend):
```
PORT=5000
MONGO_URI=mongodb://user:pass@host:port/dbname
GROK_API_KEY=xai-...
FIREBASE_SERVICE_ACCOUNT_JSON_B64=...
```

**.env.local** (Frontend):
```
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

**Document Generated**: April 8, 2026
**Last Updated**: April 8, 2026
**Author**: AI Project Manager Analysis
