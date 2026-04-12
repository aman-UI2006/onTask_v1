// EmployeeProjectPage.jsx
// Employee view for a specific project with timeline, file uploads, and issue tracking.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function EmployeeProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [raisingIssue, setRaisingIssue] = useState(false);

  useEffect(() => {
    if (!projectId || !user) return;
    loadData();
  }, [projectId, user]);

  const getAuthHeaders = async () => {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const headers = await getAuthHeaders();
      
      console.log("[FRONTEND] Fetching project:", projectId);
      const projectRes = await axios.get(`${API_URL}/api/projects/${projectId}`, { headers });
      console.log("[FRONTEND] Project response:", projectRes.data);
      setProject(projectRes.data.project);
      
      // FIX: Fetch tasks from the TASKS endpoint, not from project
      console.log("[FRONTEND] Fetching tasks for project:", projectId);
      const tasksRes = await axios.get(`${API_URL}/api/tasks/project/${projectId}`, { headers });
      console.log("[FRONTEND] Tasks response:", tasksRes.data);
      console.log("[FRONTEND] Tasks count:", tasksRes.data.tasks?.length);
      
      const sortedTasks = (tasksRes.data.tasks || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setTasks(sortedTasks);
      
      const submissionsRes = await axios.get(`${API_URL}/api/submissions/my-submissions/${projectId}`, { headers });
      console.log("[FRONTEND] Submissions:", submissionsRes.data.submissions?.length);
      setSubmissions(submissionsRes.data.submissions || []);
      
      const issuesRes = await axios.get(`${API_URL}/api/issues/my-issues`, { headers, params: { projectId } });
      console.log("[FRONTEND] Issues:", issuesRes.data.issues?.length);
      setIssues(issuesRes.data.issues || []);
    } catch (err) {
      console.error("[FRONTEND] Failed to load project data:", err);
      console.error("[FRONTEND] Error response:", err.response?.data);
      setError("Failed to load project data.");
    } finally {
      setLoading(false);
    }
  };

  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !activeTaskId) return;
    try {
      setUploading(true);
      setError("");
      setSuccess("");
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("projectId", projectId);
      formData.append("taskId", activeTaskId);
      await axios.post(`${API_URL}/api/submissions/upload`, formData, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
      setSuccess("Work submitted successfully!");
      setUploadModalOpen(false);
      setUploadFile(null);
      setActiveTaskId(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueTitle.trim() || !activeTaskId) return;
    try {
      setRaisingIssue(true);
      setError("");
      const headers = await getAuthHeaders();
      await axios.post(`${API_URL}/api/issues/raise`, { projectId, taskId: activeTaskId, title: issueTitle, description: issueDesc }, { headers });
      setSuccess("Issue raised — your manager will review it.");
      setIssueModalOpen(false);
      setIssueTitle("");
      setIssueDesc("");
      setActiveTaskId(null);
      const issuesRes = await axios.get(`${API_URL}/api/issues/my-issues`, { headers, params: { projectId } });
      setIssues(issuesRes.data.issues || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to raise issue.");
    } finally {
      setRaisingIssue(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No deadline";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusColor = (status) => {
    const colors = { pending: "var(--text-secondary)", in_progress: "var(--accent-blue)", completed: "var(--accent-green)", needs_revision: "#f59e0b" };
    return colors[status] || "var(--text-secondary)";
  };

  const getSubmissionForTask = (taskId) => submissions.find((s) => s.taskId?._id === taskId || s.taskId === taskId);

  if (loading) return <div style={styles.center}><div style={{ color: "var(--accent-purple)" }}>Loading...</div></div>;
  if (error && !project) return <div style={styles.center}><div style={styles.errorBanner}>{error}</div></div>;
  if (!project) return null;

  return (
    <div style={styles.page}>
      <style>{`@keyframes confetti-fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } } .confetti-dot { position: absolute; width: 8px; height: 8px; border-radius: 50%; animation: confetti-fall 3s ease-in-out infinite; }`}</style>

      {project.allTasksCompleted && (
        <div style={styles.celebrationBanner}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="confetti-dot" style={{ left: `${(i * 5) % 100}%`, backgroundColor: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"][i % 5], animationDelay: `${(i * 0.15).toFixed(2)}s`, animationDuration: `${2.5 + (i % 3) * 0.5}s` }} />
          ))}
          <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🏆</div>
            <h2 style={{ fontSize: "30px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "8px" }}>Congratulations! You have completed all tasks for {project.title}!</h2>
            <p style={{ fontSize: "18px", color: "var(--bg-surface)" }}>All your work has been submitted successfully. Well done!</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "32px" }}>
        {error && <div style={styles.errorBanner}>{error}</div>}
        {success && <div style={styles.successBanner}>{success}</div>}

        <div style={{ marginBottom: "32px" }}>
          <button onClick={() => navigate("/tasks")} style={styles.backButton}>← My Projects</button>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "8px" }}>{project.title}</h1>
              {project.deadline && <p style={{ color: "var(--text-muted)", fontSize: "18px" }}>Due: {formatDate(project.deadline)}</p>}
            </div>
          </div>
          <div style={{ background: "var(--bg-surface)", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Progress</span>
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{completedTasksCount} of {totalTasksCount} tasks completed</span>
            </div>
            <div style={{ width: "100%", background: "var(--border-color)", borderRadius: "9999px", height: "16px", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(90deg, var(--accent-green) 0%, #059669 100%)", height: "100%", borderRadius: "9999px", transition: "width 0.5s ease", width: `${progressPercent}%` }} />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>{progressPercent.toFixed(0)}% complete</p>
          </div>
        </div>

        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "32px" }}>Task Timeline</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {tasks.map((task, index) => {
              const submission = getSubmissionForTask(task._id);
              const isCompleted = task.status === "completed";
              const isLocked = !task.isUnlocked;
              const isActive = task.isUnlocked && !isCompleted;
              
              // Determine node appearance based on state
              let nodeIcon = index + 1;
              let nodeBg = getStatusColor(task.status);
              let nodeBorder = "transparent";
              
              if (isLocked) {
                nodeIcon = "🔒";
                nodeBg = "var(--border-color)";
                nodeBorder = "var(--text-muted)";
              } else if (isCompleted) {
                nodeIcon = "✓";
                nodeBg = "var(--accent-green)";
              } else if (isActive) {
                nodeIcon = index + 1;
                nodeBg = "var(--accent-blue)";
                nodeBorder = "var(--accent-blue)";
              }
              
              return (
                <div key={task._id} style={{ position: "relative" }}>
                  {index < tasks.length - 1 && (
                    <div style={{ 
                      position: "absolute", 
                      left: "24px", 
                      top: "48px", 
                      width: "4px", 
                      height: "calc(100% + 24px)", 
                      backgroundColor: isCompleted ? "var(--accent-green)" : isLocked ? "var(--border-color)" : "var(--accent-blue)" 
                    }} />
                  )}
                  <div style={{ 
                    background: isLocked ? "var(--bg-subtle)" : "var(--bg-surface)", 
                    border: `1px solid ${isLocked ? "var(--border-color)" : isCompleted ? "var(--border-color)" : "var(--border-color)"}`, 
                    borderRadius: "12px", 
                    padding: "24px", 
                    marginLeft: "48px",
                    opacity: isLocked ? 0.6 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ 
                        flexShrink: 0, 
                        width: "48px", 
                        height: "48px", 
                        borderRadius: "50%", 
                        backgroundColor: nodeBg, 
                        border: nodeBorder !== "transparent" ? `2px solid ${nodeBorder}` : "none",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        color: "var(--text-primary)", 
                        fontWeight: "bold", 
                        fontSize: isLocked ? "20px" : "18px" 
                      }}>
                        {nodeIcon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                          <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--text-primary)", flex: 1 }}>{task.title}</h3>
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0, marginLeft: "12px" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600", backgroundColor: `${getStatusColor(task.status)}33`, color: getStatusColor(task.status) }}>
                              {task.status?.replace("_", " ")}
                            </span>
                            {isLocked && (
                              <span style={{ padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600", backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                                Locked
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.6" }}>{task.description}</p>
                        {task.deadline && <div style={{ display: "inline-block", background: "var(--border-color)", color: "#d1d5db", padding: "4px 12px", borderRadius: "9999px", fontSize: "14px", marginBottom: "16px" }}>Due {formatDate(task.deadline)}</div>}
                        {isCompleted && submission && (
                          <div style={{ marginTop: "16px", background: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-green)" }}>
                              <svg style={{ width: "20px", height: "20px" }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              <span style={{ fontWeight: "600" }}>Submitted:</span>
                              <a href={`${API_URL}${submission.fileUrl || submission.fileName}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-green)", textDecoration: "underline" }}>{submission.fileName || "Download file"}</a>
                            </div>
                          </div>
                        )}
                        {isActive && (
                          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                            <button 
                              onClick={() => { setActiveTaskId(task._id); setUploadModalOpen(true); }} 
                              style={{ padding: "8px 16px", border: "2px solid var(--accent-blue)", color: "var(--accent-blue)", borderRadius: "8px", fontWeight: "600", cursor: "pointer", background: "transparent" }}
                            >
                              Upload Work
                            </button>
                            <button 
                              onClick={() => { setActiveTaskId(task._id); setIssueModalOpen(true); }} 
                              style={{ padding: "8px 16px", border: "2px solid var(--accent-red)", color: "var(--accent-red)", borderRadius: "8px", fontWeight: "600", cursor: "pointer", background: "transparent" }}
                            >
                              Raise Issue
                            </button>
                          </div>
                        )}
                        {isLocked && (
                          <div style={{ marginTop: "16px" }}>
                            <button 
                              disabled 
                              style={{ padding: "8px 16px", border: "2px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", fontWeight: "600", cursor: "not-allowed", background: "transparent" }}
                            >
                              🔒 Locked - Complete Previous Task First
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "32px" }}>My Raised Issues</h2>
          {issues.length === 0 ? (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "32px", textAlign: "center" }}><p style={{ color: "var(--text-muted)" }}>No issues raised yet</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {issues.map((issue) => (
                <div key={issue._id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "var(--text-primary)", flex: 1 }}>{issue.title}</h3>
                    <span style={{ padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600", marginLeft: "12px", backgroundColor: issue.status === "resolved" ? "var(--bg-subtle)" : "var(--bg-subtle)", color: issue.status === "resolved" ? "var(--accent-green)" : "var(--accent-red)" }}>{issue.status}</span>
                  </div>
                  {issue.description && <p style={{ color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.6" }}>{issue.description}</p>}
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Raised: {new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {uploadModalOpen && (
        <div style={styles.modalOverlay} onClick={() => { setUploadModalOpen(false); setUploadFile(null); setActiveTaskId(null); }}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "24px" }}>Submit Work for Task</h2>
            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "14px", marginBottom: "8px" }}>Select File</label>
                <input type="file" accept="*" onChange={(e) => setUploadFile(e.target.files[0])} style={{ width: "100%", background: "var(--border-color)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px 16px", color: "var(--text-primary)", cursor: "pointer" }} required />
                {uploadFile && <p style={{ color: "var(--accent-green)", fontSize: "14px", marginTop: "8px" }}>Selected: {uploadFile.name}</p>}
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setUploadModalOpen(false); setUploadFile(null); setActiveTaskId(null); }} style={{ padding: "8px 24px", border: "1px solid var(--border-color)", color: "var(--text-muted)", borderRadius: "8px", cursor: "pointer", background: "transparent" }} disabled={uploading}>Cancel</button>
                <button type="submit" disabled={uploading || !uploadFile} style={{ padding: "8px 24px", background: "var(--accent-purple)", color: "var(--text-primary)", border: "none", borderRadius: "8px", fontWeight: "600", opacity: uploading || !uploadFile ? 0.5 : 1, cursor: uploading || !uploadFile ? "not-allowed" : "pointer" }}>{uploading ? "Uploading..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {issueModalOpen && (
        <div style={styles.modalOverlay} onClick={() => { setIssueModalOpen(false); setIssueTitle(""); setIssueDesc(""); setActiveTaskId(null); }}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "24px" }}>Raise an Issue / Doubt</h2>
            <form onSubmit={handleIssueSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "14px", marginBottom: "8px" }}>Issue Title *</label>
                <input type="text" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} style={{ width: "100%", background: "var(--border-color)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px 16px", color: "var(--text-primary)", fontSize: "14px", outline: "none" }} placeholder="Brief description of the issue" required />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "14px", marginBottom: "8px" }}>Description</label>
                <textarea value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} style={{ width: "100%", background: "var(--border-color)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px 16px", color: "var(--text-primary)", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "system-ui, sans-serif" }} placeholder="Provide more details about the issue..." rows={4} />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setIssueModalOpen(false); setIssueTitle(""); setIssueDesc(""); setActiveTaskId(null); }} style={{ padding: "8px 24px", border: "1px solid var(--border-color)", color: "var(--text-muted)", borderRadius: "8px", cursor: "pointer", background: "transparent" }} disabled={raisingIssue}>Cancel</button>
                <button type="submit" disabled={raisingIssue || !issueTitle.trim()} style={{ padding: "8px 24px", background: "var(--accent-red)", color: "var(--text-primary)", border: "none", borderRadius: "8px", fontWeight: "600", opacity: raisingIssue || !issueTitle.trim() ? 0.5 : 1, cursor: raisingIssue || !issueTitle.trim() ? "not-allowed" : "pointer" }}>{raisingIssue ? "Raising..." : "Raise Issue"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-family)" },
  center: { minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" },
  errorBanner: { background: "var(--bg-subtle)", border: "1px solid var(--accent-red)", color: "var(--accent-red)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" },
  successBanner: { background: "var(--bg-subtle)", border: "1px solid var(--accent-green)", color: "var(--accent-green)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" },
  celebrationBanner: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--accent-green) 0%, var(--accent-blue) 100%)", padding: "48px 32px" },
  backButton: { background: "transparent", border: "none", color: "var(--accent-blue)", fontSize: "14px", cursor: "pointer", padding: "0 0 8px", display: "block", marginBottom: "16px", transition: "var(--transition-fast)" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" },
  modalBox: { background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "448px", boxShadow: "var(--shadow-hover)" },
};