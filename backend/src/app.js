// app.js
// Express app configuration.

const express = require("express");
const cors = require("cors");
const { router: authRoutes, googleLoginHandler } = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");
const reportRoutes = require("./routes/report.routes");
const aiRoutes = require("./routes/ai.routes");
const emailRoutes = require("./routes/email.routes");
const notificationRoutes = require("./routes/notification.routes");
const transcriptRoutes = require("./routes/transcript.routes");

const app = express();

// Allow multiple ports — Vite uses 5173, 5174, 5175
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running ✅" });
});

// Primary auth routes
app.use("/api/auth", authRoutes);

// Specific Google Login route as requested by user
app.post("/api/google-login", googleLoginHandler);

// Domain routes
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/transcripts", transcriptRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
