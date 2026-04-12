// EmployeeDashboard.jsx
// The main screen for employees.
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyTasks,
  updateTaskStatus,
  submitReport,
  fetchMyReports,
  searchProjects,
  verifyProjectAccess,
} from "../api/projects";
import NotificationCenter from "../components/NotificationCenter";
import EmployeeAnalyticsView from "../components/EmployeeAnalyticsView";
import EmployeeAI from "../components/EmployeeAI";
import EmployeeTimeline from "../components/EmployeeTimeline";

export default function EmployeeDashboard() {
  const { dbUser, logout } = useAuth();

  const [view, setView] = useState("home");
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskListSource, setTaskListSource] = useState("home");
  const [reportContent, setReportContent] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessModalProject, setAccessModalProject] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [accessModalError, setAccessModalError] = useState("");
  const [accessVerifying, setAccessVerifying] = useState(false);
  const [workspaceProject, setWorkspaceProject] = useState(null);

  useEffect(() => {
    loadTasks();
    loadReports();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchInput.trim()); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    searchProjects(debouncedQuery)
      .then((data) => { if (!cancelled) setSearchResults(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setSearchResults([]); })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchMyTasks();
      setTasks(data);
    } catch { setError("Failed to load tasks."); }
    finally { setLoading(false); }
  };

  const loadReports = async () => {
    try {
      const data = await fetchMyReports();
      setReports(data);
    } catch { /* silent */ }
  };

  const openTask = (task, fromView = "home") => {
    setSelectedTask(task);
    setTaskListSource(fromView);
    setReportContent("");
    setError("");
    setSuccess("");
    setView("task");
  };

  const goBackFromTask = () => {
    setView(taskListSource === "workspace" ? "workspace" : "home");
  };

  const openAccessModal = (project) => {
    setAccessModalProject(project);
    setAccessCode("");
    setAccessModalError("");
    setAccessModalOpen(true);
  };

  const closeAccessModal = () => {
    if (accessVerifying) return;
    setAccessModalOpen(false);
    setAccessModalProject(null);
    setAccessCode("");
    setAccessModalError("");
  };

  const handleEnterWorkspace = async (e) => {
    e.preventDefault();
    if (!accessModalProject?._id) return;
    setAccessModalError("");
    setAccessVerifying(true);
    try {
      const result = await verifyProjectAccess(accessModalProject._id, accessCode.trim());
      if (result.valid && result.project) {
        setWorkspaceProject(result.project);
        setAccessModalOpen(false);
        setAccessModalProject(null);
        setAccessCode("");
        setSearchInput("");
        setDebouncedQuery("");
        setSearchResults([]);
        setView("workspace");
      } else {
        setAccessModalError("❌ Invalid access code. Please check your email.");
      }
    } catch (err) {
      setAccessModalError("❌ Invalid access code. Please check your email.");
    } finally {
      setAccessVerifying(false);
    }
  };

  const projectStatusColor = (status) => {
    const map = { planning: "#888", active: "var(--primary)", review: "#f59e0b", completed: "#10b981", on_hold: "#a855f7" };
    return map[status] || "#888";
  };

  const taskBelongsToWorkspace = (task) => {
    if (!workspaceProject?._id) return false;
    const pid = task.projectId?._id ?? task.projectId;
    return String(pid) === String(workspaceProject._id);
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      setSuccess("Status updated.");
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
      if (selectedTask?._id === taskId) { setSelectedTask((prev) => ({ ...prev, status })); }
    } catch { setError("Failed to update status."); }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportContent.trim()) return setError("Report content cannot be empty.");
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("taskId", selectedTask._id);
      formData.append("content", reportContent);
      if (reportFile) formData.append("attachment", reportFile);
      await submitReport(formData);
      setSuccess("Report submitted successfully!");
      setReportContent("");
      setReportFile(null);
      await loadReports();
      await loadTasks();
      setSelectedTask((prev) => ({ ...prev, status: "completed" }));
    } catch { setError("Failed to submit report."); }
    finally { setLoading(false); }
  };

  const getReportForTask = (taskId) => {
    return reports.find((r) => r.taskId?._id === taskId || r.taskId === taskId);
  };

  const statusColor = (status) => {
    const map = { pending: "#888", in_progress: "var(--primary)", completed: "#10b981", needs_revision: "#f59e0b" };
    return map[status] || "#888";
  };

  const priorityColor = (priority) => {
    const map = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
    return map[priority] || "#888";
  };

  const statusOptions = ["pending", "in_progress", "completed", "needs_revision"];

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={styles.logo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={styles.brandName}>AI PM</span>
          <div style={{ marginLeft: "auto" }}>
            <NotificationCenter onSelect={(id, type) => { if (["feedback", "revision", "approved"].includes(type)) setView("report"); }} />
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button style={{ ...styles.navItem, ...(view === "home" ? styles.navItemActive : {}) }} onClick={() => setView("home")}>My Tasks</button>
          <button style={{ ...styles.navItem, ...(view === "timeline" ? styles.navItemActive : {}) }} onClick={() => setView("timeline")}>My Timeline</button>
          <button style={{ ...styles.navItem, ...(view === "analytics" ? styles.navItemActive : {}) }} onClick={() => setView("analytics")}>My Analytics</button>
        </nav>

        {dbUser?.skills?.length > 0 && (
          <div style={styles.skillsSection}>
            <p style={styles.skillsLabel}>My expertise</p>
            <div style={styles.skillsWrap}>
              {dbUser.skills.map((skill) => <span key={skill} style={styles.skillTag}>{skill}</span>)}
            </div>
          </div>
        )}

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{dbUser?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={styles.userName}>{dbUser?.name}</div>
              <div style={styles.userRole}>Employee</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </aside>

      <main style={styles.main}>
        {error && <div style={styles.errorBanner}>{error}</div>}
        {success && <div style={styles.successBanner}>{success}</div>}

        {view === "home" && (
          <div>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>My Tasks</h1>
              <span style={styles.muted}>{tasks.length} Active Assignments</span>
            </div>

            <div style={styles.searchSection}>
              <h2 style={styles.searchSectionTitle}>Search Projects</h2>
              <input type="text" style={styles.searchInput} placeholder="Type project name..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              {debouncedQuery.length >= 2 && (
                <div style={styles.searchResults}>
                  {searchResults.map((p) => (
                    <button key={p._id} style={styles.searchResultCard} onClick={() => openAccessModal(p)}>
                      <div style={styles.searchResultTop}>
                        <span style={styles.searchResultTitle}>{p.title}</span>
                        <span style={{ ...styles.statusBadge, background: projectStatusColor(p.status) + "22", color: projectStatusColor(p.status) }}>{p.status}</span>
                      </div>
                      <p style={styles.searchResultDesc}>{p.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? <p style={styles.muted}>Loading...</p> : (
              <div style={styles.taskList}>
                {tasks.map((task) => (
                  <div key={task._id} style={styles.taskCard} onClick={() => openTask(task, "home")}>
                    <div style={styles.taskTop}>
                      <span style={styles.taskTitle}>{task.title}</span>
                      <span style={{ ...styles.priorityBadge, background: `${priorityColor(task.priority)}22`, color: priorityColor(task.priority) }}>{task.priority}</span>
                      <span style={{ ...styles.statusBadge, background: `${statusColor(task.status)}22`, color: statusColor(task.status) }}>{task.status}</span>
                    </div>
                    <p style={styles.taskDesc}>{task.description}</p>
                    <div style={styles.taskMeta}>
                      <span style={styles.muted}>Project: {task.projectId?.title || "—"}</span>
                      {getReportForTask(task._id) && <span style={styles.reportedBadge}>✓ Report Submitted</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "timeline" && (
          <div>
            <div style={styles.pageHeader}><h1 style={styles.pageTitle}>Career Roadmap</h1><p style={styles.muted}>Professional Milestone Tracking</p></div>
            <EmployeeTimeline tasks={tasks} />
          </div>
        )}

        {view === "analytics" && <EmployeeAnalyticsView />}

        {view === "task" && selectedTask && (
          <div>
            <button style={styles.backBtn} onClick={goBackFromTask}>← Back to Overview</button>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>{selectedTask.title}</h1>
              <div style={styles.badgeRow}>
                <span style={{ ...styles.priorityBadge, background: `${priorityColor(selectedTask.priority)}22`, color: priorityColor(selectedTask.priority) }}>{selectedTask.priority}</span>
                <span style={{ ...styles.statusBadge, background: `${statusColor(selectedTask.status)}22`, color: statusColor(selectedTask.status) }}>{selectedTask.status}</span>
              </div>
            </div>
            <p style={styles.description}>{selectedTask.description}</p>
            <div style={styles.metaGrid}>
              <div style={styles.metaItem}><span style={styles.metaLabel}>Project</span><span style={styles.metaValue}>{selectedTask.projectId?.title}</span></div>
              <div style={styles.metaItem}><span style={styles.metaLabel}>Est. Days</span><span style={styles.metaValue}>{selectedTask.estimatedDays}</span></div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Update Status</h2>
              <div style={styles.statusBtnRow}>
                {statusOptions.map((s) => (
                  <button key={s} style={{ ...styles.statusOptionBtn, 
                    background: selectedTask.status === s ? `${statusColor(s)}22` : "transparent",
                    border: `1px solid ${selectedTask.status === s ? statusColor(s) : "#eee"}`,
                    color: selectedTask.status === s ? statusColor(s) : "#666"
                  }} onClick={() => handleStatusUpdate(selectedTask._id, s)}>{s}</button>
                ))}
              </div>
            </div>

            <div style={styles.reportSection}>
              {(() => {
                const r = getReportForTask(selectedTask._id);
                if (r) return (
                  <div style={styles.reportBox}>
                    <h2 style={styles.sectionTitle}>Your Report</h2>
                    <p style={styles.reportContent}>{r.content}</p>
                    {r.aiFeedback?.rating && (
                      <div style={styles.feedbackBox}>
                        <h3 style={styles.feedbackTitle}>AI Insight — Rating: {r.aiFeedback.rating}/10</h3>
                        <p style={styles.feedbackText}>{r.aiFeedback.detailedFeedback}</p>
                      </div>
                    )}
                  </div>
                );
                return (
                  <form onSubmit={handleSubmitReport} style={styles.reportForm}>
                    <h2 style={styles.sectionTitle}>Submit Work Report</h2>
                    <textarea style={styles.reportTextarea} value={reportContent} onChange={(e) => setReportContent(e.target.value)} placeholder="What did you accomplish?" rows={6} />
                    <input type="file" onChange={(e) => setReportFile(e.target.files[0])} style={styles.fileInput} />
                    <button type="submit" style={styles.primaryBtn} disabled={loading}>{loading ? "Submitting..." : "Submit Report"}</button>
                  </form>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      <EmployeeAI />

      {accessModalOpen && accessModalProject && (
        <div style={styles.modalOverlay} onClick={closeAccessModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{accessModalProject.title}</h2>
            <p style={styles.muted}>Enter the 8-digit access code sent to your email.</p>
            <form onSubmit={handleEnterWorkspace} style={styles.accessForm}>
              <input type="text" style={styles.accessInput} placeholder="PROJ-XXXX" value={accessCode} maxLength={9} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} />
              {accessModalError && <p style={{ color: "#ef4444", fontSize: "14px" }}>{accessModalError}</p>}
              <div style={styles.modalActions}>
                <button type="button" style={styles.ghostBtn} onClick={closeAccessModal}>Cancel</button>
                <button type="submit" style={styles.primaryBtn} disabled={accessVerifying}>Verify Code</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "var(--bg)", color: "var(--text-main)" },
  sidebar: { width: "280px", background: "#fff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", padding: "32px 0", position: "sticky", top: 0, height: "100vh" },
  sidebarBrand: { padding: "0 28px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" },
  logo: { width: "36px", height: "36px", background: "var(--primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(109,93,252,0.2)" },
  brandName: { fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px", color: "#111" },
  sidebarNav: { display: "flex", flexDirection: "column", gap: "6px", padding: "0 16px" },
  navItem: { padding: "14px 20px", border: "none", background: "transparent", color: "#666", fontSize: "15px", fontWeight: "600", cursor: "pointer", borderRadius: "14px", textAlign: "left", transition: "all 0.2s" },
  navItemActive: { background: "#f5f5ff", color: "var(--primary)" },
  skillsSection: { marginTop: "auto", padding: "28px", borderTop: "1px solid #f5f5f5" },
  skillsLabel: { fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#999", fontWeight: "800", marginBottom: "16px" },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: "8px" },
  skillTag: { background: "#f0f2f5", color: "#555", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" },
  sidebarFooter: { padding: "28px", background: "#fbfbfb", marginTop: "20px" },
  userInfo: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" },
  avatar: { width: "40px", height: "40px", borderRadius: "12px", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "18px" },
  userName: { fontSize: "15px", fontWeight: "700", color: "#111" },
  userRole: { fontSize: "12px", color: "#888" },
  logoutBtn: { width: "100%", padding: "12px", background: "transparent", border: "1px solid #eee", borderRadius: "12px", color: "#666", fontSize: "13px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" },
  main: { flex: 1, padding: "48px 60px", overflowY: "auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" },
  pageTitle: { fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", color: "#111", margin: 0 },
  muted: { color: "#888", fontSize: "15px" },
  searchSection: { marginBottom: "48px", padding: "32px", background: "#fff", border: "1px solid #eee", borderRadius: "24px", boxShadow: "var(--shadow)" },
  searchSectionTitle: { fontSize: "16px", fontWeight: "800", color: "#111", marginBottom: "16px" },
  searchInput: { width: "100%", background: "#f9fafb", border: "1px solid #eee", borderRadius: "14px", padding: "16px 20px", color: "#111", fontSize: "15px", outline: "none" },
  searchStatus: { color: "#666", fontSize: "14px", marginTop: "12px" },
  searchResults: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" },
  searchResultCard: { textAlign: "left", background: "#fff", border: "1px solid #eee", borderRadius: "16px", padding: "20px", cursor: "pointer", width: "100%", transition: "transform 0.2s" },
  searchResultTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  searchResultTitle: { fontSize: "17px", fontWeight: "700", color: "#111" },
  searchResultDesc: { fontSize: "14px", color: "#666", lineHeight: "1.6", margin: 0 },
  taskList: { display: "flex", flexDirection: "column", gap: "16px" },
  taskCard: { background: "#fff", border: "1px solid #f0f0f0", borderRadius: "24px", padding: "32px", cursor: "pointer", transition: "all 0.3s", boxShadow: "var(--shadow)" },
  taskTop: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  taskTitle: { fontSize: "20px", fontWeight: "700", color: "#111", flex: 1, letterSpacing: "-0.4px" },
  priorityBadge: { padding: "6px 14px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" },
  statusBadge: { padding: "6px 14px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" },
  taskDesc: { fontSize: "15px", color: "#666", lineHeight: "1.7", marginBottom: "24px", margin: 0 },
  taskMeta: { display: "flex", gap: "24px", borderTop: "1px solid #f9f9f9", paddingTop: "20px" },
  reportedBadge: { marginLeft: "auto", color: "var(--primary)", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" },
  description: { fontSize: "16px", lineHeight: "1.8", color: "#555", marginBottom: "40px" },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "48px", background: "#fbfbfb", padding: "24px", borderRadius: "20px", border: "1px solid #eee" },
  metaItem: { display: "flex", flexDirection: "column", gap: "6px" },
  metaLabel: { fontSize: "11px", color: "#999", textTransform: "uppercase", fontWeight: "800", letterSpacing: "1px" },
  metaValue: { fontSize: "16px", fontWeight: "700", color: "#111" },
  section: { marginBottom: "48px" },
  sectionTitle: { fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary)", fontWeight: "800", marginBottom: "20px" },
  statusBtnRow: { display: "flex", gap: "12px" },
  statusOptionBtn: { padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" },
  reportSection: { marginBottom: "48px" },
  reportForm: { display: "flex", flexDirection: "column", gap: "24px" },
  reportTextarea: { background: "#fafafa", border: "1px solid #eee", borderRadius: "20px", padding: "24px", color: "#444", fontSize: "15px", outline: "none", resize: "none", lineHeight: "1.7" },
  primaryBtn: { background: "#111", color: "#fff", border: "none", padding: "16px 32px", borderRadius: "16px", fontSize: "16px", fontWeight: "800", cursor: "pointer", display: "inline-block" },
  reportBox: { background: "#fbfbfb", border: "1px solid #eee", borderRadius: "24px", padding: "32px", marginBottom: "24px" },
  reportContent: { color: "#444", fontSize: "15px", lineHeight: "1.8", margin: 0 },
  feedbackBox: { background: "#f8faff", border: "1px solid #e1e8ff", borderRadius: "24px", padding: "32px" },
  managerComment: { background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "24px", padding: "32px", marginTop: "16px" },
  feedbackTitle: { fontSize: "16px", fontWeight: "800", color: "#111", marginBottom: "16px" },
  feedbackText: { fontSize: "14px", color: "#666", lineHeight: "1.7", marginBottom: "12px" },
  errorBanner: { background: "#fff5f5", border: "1px solid #feb2b2", color: "#e53e3e", padding: "14px 24px", borderRadius: "12px", marginBottom: "24px" },
  successBanner: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "14px 24px", borderRadius: "12px", marginBottom: "24px" },
  backBtn: { padding: "10px 20px", border: "1px solid #eee", borderRadius: "12px", background: "#fff", color: "#666", cursor: "pointer", fontWeight: "700", marginBottom: "16px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modalBox: { background: "#fff", borderRadius: "32px", padding: "48px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
  modalTitle: { fontSize: "24px", fontWeight: "800", color: "#111", margin: "0 0 12px" },
  accessInput: { fontSize: "24px", letterSpacing: "4px", padding: "20px", textAlign: "center", textTransform: "uppercase", background: "#f9fafb", border: "1px solid #eee", borderRadius: "16px", width: "100%", outline: "none", fontWeight: "800", color: "var(--primary)" },
  ghostBtn: { background: "transparent", color: "#666", border: "1px solid #eee", padding: "14px 24px", borderRadius: "14px", fontWeight: "700", cursor: "pointer" },
  fileInput: { width: "100%", padding: "12px", background: "#f9fafb", border: "1px solid #eee", borderRadius: "12px", fontSize: "14px", color: "#666" },
};
