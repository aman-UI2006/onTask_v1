// projects.js
// Standardized API calls with Dual Auth Support (Firebase + Google OAuth)

import axios from "axios";
import { auth } from "../firebase";

const BASE = "http://localhost:5000";

// Helper — Unified Auth Header
async function authHeader() {
  // 1. Try Firebase Token
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }
  
  // 2. Fallback to Google OAuth Token from localStorage
  const googleToken = localStorage.getItem("googleToken");
  if (googleToken) {
    return { Authorization: `Bearer ${googleToken}` };
  }

  return {};
}

// ── Projects ──────────────────────────────────────────────────

export async function fetchProjects() {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/projects`, { headers });
  return res.data.projects || [];
}

export async function fetchProjectById(id) {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/projects/${id}`, { headers });
  return res.data.project;
}

export async function createProject(data) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/projects`, data, { headers });
  return res.data.project;
}

export async function updateProject(id, data) {
  const headers = await authHeader();
  const res = await axios.put(`${BASE}/api/projects/${id}`, data, { headers });
  return res.data.project;
}

export async function deleteProject(id) {
  const headers = await authHeader();
  await axios.delete(`${BASE}/api/projects/${id}`, { headers });
}

// ── AI ────────────────────────────────────────────────────────

export async function aiSelectEmployees(projectId) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/ai/select-employees`, { projectId }, { headers });
  return res.data;
}

export async function aiGenerateWorkflow(projectId) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/ai/generate-workflow`, { projectId }, { headers });
  return res.data;
}

export async function aiFormTeams(requirements) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/ai/form-teams`, { requirements }, { headers });
  return res.data;
}

export async function aiGenerateEnhancedEmail(data) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/ai/generate-enhanced-email`, data, { headers });
  return res.data.body;
}

// ── Tasks ─────────────────────────────────────────────────────

export async function fetchTasksByProject(projectId) {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/tasks/project/${projectId}`, { headers });
  return res.data.tasks || [];
}

export async function fetchMyTasks() {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/tasks/my-tasks`, { headers });
  return res.data.tasks || [];
}

export async function updateTaskStatus(taskId, status) {
  const headers = await authHeader();
  const res = await axios.put(`${BASE}/api/tasks/${taskId}/status`, { status }, { headers });
  return res.data.task;
}

// ── Reports ───────────────────────────────────────────────────

export async function submitReport(data) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/reports`, data, { headers });
  return res.data.report;
}

export async function fetchMyReports() {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/reports/my-reports`, { headers });
  return res.data.reports || [];
}

export async function fetchReportsByProject(projectId) {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/reports/project/${projectId}`, { headers });
  return res.data.reports || [];
}

export async function addManagerComment(reportId, comment, status) {
  const headers = await authHeader();
  const res = await axios.put(`${BASE}/api/reports/${reportId}/comment`, { comment, status }, { headers });
  return res.data.report;
}

export async function sendProjectEmails(projectId) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/email/send-project-email`, { projectId }, { headers });
  return res.data;
}

export async function sendConsolidatedEmail({ recipients, subject, body }) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/email/send-consolidated`, { recipients, subject, body }, { headers });
  return res.data;
}

export async function uploadTranscript(projectId, file) {
  const headers = await authHeader();
  const formData = new FormData();
  formData.append("projectId", projectId);
  formData.append("transcript", file);
  const res = await axios.post(`${BASE}/api/transcripts/upload`, formData, { headers });
  return res.data;
}

export async function aiManagerChat(query, projectId) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/ai/chat`, { query, projectId }, { headers });
  return res.data.reply;
}

export async function verifyProjectAccess(projectId, accessCode) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/projects/verify-access`, { projectId, accessCode }, { headers });
  return res.data;
}

export async function searchProjects(query) {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/projects?search=${encodeURIComponent(query)}`, { headers });
  return res.data.projects || [];
}

export async function fetchEmployees() {
  const headers = await authHeader();
  const res = await axios.get(`${BASE}/api/auth/employees`, { headers });
  return res.data.employees || [];
}

export async function aiAllocateTasks(projectId) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/ai/allocate-tasks`, { projectId }, { headers });
  return res.data.allotment;
}

export async function commitTasks(projectId, taskAllotment) {
  const headers = await authHeader();
  const res = await axios.post(`${BASE}/api/ai/commit-tasks`, { projectId, taskAllotment }, { headers });
  return res.data.project;
}