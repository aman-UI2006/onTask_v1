import { useState, useEffect } from "react";
import { fetchProjects, fetchReportsByProject, addManagerComment } from "../api/projects";
import axios from "axios";
import { auth } from "../firebase";

const BASE = import.meta.env.VITE_API_URL;

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const paths = {
    folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    check: "M20 6L9 17l-5-5",
    paperclip: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    chevronRight: "M9 18l6-6-6-6"
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
      <path d={paths[name] || ""} />
    </svg>
  );
};

export default function ReviewWorkView({ initialReportId }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [groupedReports, setGroupedReports] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [emailContent, setEmailContent] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        handleProjectSelect(data[0]);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setLoading(true);
    try {
      const reports = await fetchReportsByProject(project._id);
      const groups = {};
      reports.forEach(r => {
        const dept = r.employeeId?.department || "General";
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(r);
      });
      setGroupedReports(groups);
      setSelectedReport(null);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIFeedback = async () => {
    if (!selectedReport) return;
    setFeedbackLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.post(`${BASE}/api/ai/generate-feedback`, 
        { reportId: selectedReport._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedReport({ ...selectedReport, aiFeedback: res.data.feedback });
      setEmailContent(res.data.feedback.detailedFeedback);
    } catch (err) {
      console.error("AI feedback failed", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    try {
      await addManagerComment(selectedReport._id, "Approved via AI Feedback.", "completed");
      alert("Submission approved and employee notified!");
      handleProjectSelect(selectedProject);
    } catch (err) {
      alert("Failed to approve submission.");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.pageHeader}>
        <h1 style={styles.title}>Personnel Review</h1>
        <p style={styles.subtitle}>Analyzing submission quality and providing AI-guided strategic feedback.</p>
      </header>
      
      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <h3 style={styles.sidebarTitle}>Active Projects</h3>
            <div style={styles.projectList}>
              {projects.map(p => (
                <button 
                  key={p._id} 
                  style={{
                    ...styles.projectItem, 
                    background: selectedProject?._id === p._id ? "#6366f112" : "transparent", 
                    color: selectedProject?._id === p._id ? "#6366f1" : "#64748b",
                    borderColor: selectedProject?._id === p._id ? "#6366f1" : "#e2e8f0"
                  }}
                  onClick={() => handleProjectSelect(p)}
                >
                  <Icon name="folder" size={14} style={{ marginRight: "8px" }} />
                  {p.title}
                </button>
              ))}
            </div>
          </div>
          
          {selectedProject && (
            <div style={{ ...styles.sidebarSection, flex: 1, overflow: 'auto' }}>
              <h3 style={styles.sidebarTitle}>Submissions</h3>
              {Object.keys(groupedReports).length === 0 ? (
                <p style={styles.emptyNavText}>Standing by for submissions.</p>
              ) : Object.keys(groupedReports).map(team => (
                <div key={team} style={styles.teamGroup}>
                  <div style={styles.teamHeader}>{team} Team</div>
                  <div style={styles.empList}>
                    {groupedReports[team].map(r => (
                      <button 
                        key={r._id} 
                        style={{
                          ...styles.empItem, 
                          background: selectedReport?._id === r._id ? "#f8fafc" : "transparent",
                          color: selectedReport?._id === r._id ? "#0f172a" : "#64748b"
                        }}
                        onClick={() => setSelectedReport(r)}
                      >
                         <Icon name="chevronRight" size={12} color={selectedReport?._id === r._id ? "#6366f1" : "#cbd5e1"} style={{ marginRight: "8px" }} />
                        {r.employeeId?.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={styles.main}>
          {selectedReport ? (
            <div style={styles.reviewCard}>
              <div style={styles.cardHeader}>
                <div style={styles.headerTitleGroup}>
                   <span style={styles.taskLabel}>Operation Report</span>
                   <h2 style={styles.taskTitle}>{selectedReport.taskId?.title}</h2>
                </div>
                <div style={{
                  ...styles.priorityTag, 
                  background: selectedReport.taskId?.priority === 'high' ? '#fef2f2' : '#fffbeb', 
                  color: selectedReport.taskId?.priority === 'high' ? '#ef4444' : '#f59e0b',
                  border: `1px solid ${selectedReport.taskId?.priority === 'high' ? '#fee2e2' : '#fef3c7'}`
                }}>
                   {selectedReport.taskId?.priority} Priority
                </div>
              </div>

              <div style={styles.submitterInfo}>
                <div style={styles.avatarMini}>{selectedReport.employeeId?.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                   <div style={styles.submitterName}>{selectedReport.employeeId?.name}</div>
                   <div style={styles.submitterEmail}>{selectedReport.employeeId?.email}</div>
                </div>
                <div style={styles.deptBadge}>{selectedReport.employeeId?.department}</div>
              </div>
              
              <div style={styles.contentBox}>
                <h4 style={styles.contentBoxTitle}>Executive Summary</h4>
                <p style={styles.contentText}>{selectedReport.content}</p>
                {selectedReport.attachmentUrl && (
                    <a href={selectedReport.attachmentUrl} target="_blank" rel="noreferrer" style={styles.fileLink}>
                        <Icon name="paperclip" size={14} style={{ marginRight: "8px" }} />
                        View Attached Deliverables
                    </a>
                )}
              </div>

              <div style={styles.aiSection}>
                <div style={styles.aiHeader}>
                    <div style={styles.aiBrand}>
                      <Icon name="zap" size={20} color="#6366f1" />
                      <h3 style={styles.aiTitle}>Grok Analysis</h3>
                    </div>
                    {!selectedReport.aiFeedback && (
                        <button 
                          onClick={generateAIFeedback} 
                          disabled={feedbackLoading}
                          style={styles.aiBtn}
                        >
                          {feedbackLoading ? "Processing..." : "Generate Insights"}
                        </button>
                    )}
                </div>

                {selectedReport.aiFeedback && (
                  <div style={styles.feedbackContainer}>
                    <div style={styles.statsRow}>
                        <div style={styles.statCell}>
                            <span style={styles.statLabel}>Quality Rating</span>
                            <span style={styles.statVal}>{selectedReport.aiFeedback.rating}/10</span>
                        </div>
                        <div style={styles.statCell}>
                            <span style={styles.statLabel}>Recommendation</span>
                            <span style={{...styles.statVal, color: selectedReport.aiFeedback.recommendation === "approve" ? "#10b981" : "#f59e0b"}}>
                                {selectedReport.aiFeedback.recommendation?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    
                    <div style={styles.feedbackGrid}>
                       <div style={styles.feedbackItem}>
                          <h5 style={styles.feedbackLabel}>Identified Strengths</h5>
                          <p style={styles.feedbackText}>{selectedReport.aiFeedback.strengths}</p>
                       </div>
                       <div style={styles.feedbackItem}>
                          <h5 style={styles.feedbackLabel}>Growth Opportunities</h5>
                          <p style={styles.feedbackText}>{selectedReport.aiFeedback.improvements}</p>
                       </div>
                    </div>
                    
                    <div style={styles.emailPreview}>
                      <h4 style={styles.previewTitle}>Response Draft</h4>
                      <div style={styles.textareaWrap}>
                        <textarea 
                          style={styles.emailArea}
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                        />
                      </div>
                      <div style={styles.actionRow}>
                         <button style={styles.approveBtn} onClick={handleApprove}>Send Feedback & Approve</button>
                         <button style={styles.revisionBtn} onClick={() => alert("Revision requested.")}>Request Revision</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Icon name="file" size={80} color="#e2e8f0" />
              <h3 style={{ marginTop: "24px" }}>No Submission Selected</h3>
              <p style={{ color: "#64748b", maxWidth: "340px", margin: "12px auto" }}>Choose a personnel submission from the sidebar to begin deep analysis and quality review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const UI = {
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  primary: "#6366f1",
  success: "#10b981",
  card: "#ffffff"
};

const styles = {
  container: { padding: "48px 64px", background: UI.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  pageHeader: { marginBottom: "48px" },
  title: { fontSize: "32px", fontWeight: "850", letterSpacing: "-1.5px", color: UI.text, marginBottom: "8px" },
  subtitle: { color: UI.textMuted, fontSize: "15px", fontWeight: "500" },
  layout: { display: "flex", gap: "40px" },
  sidebar: { width: "320px", display: "flex", flexDirection: "column", gap: "24px" },
  sidebarSection: { background: UI.card, borderRadius: "24px", padding: "28px", border: `1px solid ${UI.border}` },
  sidebarTitle: { fontSize: "11px", color: UI.primary, textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800", marginBottom: "20px" },
  projectList: { display: "flex", flexDirection: "column", gap: "8px" },
  projectItem: { padding: "14px 18px", borderRadius: "12px", border: `1px solid ${UI.border}`, cursor: "pointer", fontSize: "14px", fontWeight: "700", textAlign: "left", display: "flex", alignItems: "center" },
  teamGroup: { marginBottom: "24px" },
  teamHeader: { fontSize: "11px", fontWeight: "800", color: UI.textMuted, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  empList: { display: "flex", flexDirection: "column", gap: "4px" },
  empItem: { display: "flex", alignItems: "center", padding: "12px 0", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", textAlign: "left", background: "transparent" },
  
  main: { flex: 1 },
  reviewCard: { background: UI.card, padding: "48px", borderRadius: "32px", border: `1px solid ${UI.border}` },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" },
  headerTitleGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  taskLabel: { fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: UI.primary, fontWeight: "800" },
  taskTitle: { fontSize: "28px", fontWeight: "850", color: UI.text, margin: 0, letterSpacing: "-1px" },
  priorityTag: { padding: "6px 14px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" },
  
  submitterInfo: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "44px", background: "#f8fafc", padding: "16px 20px", borderRadius: "16px", border: `1px solid ${UI.border}` },
  avatarMini: { width: "40px", height: "40px", borderRadius: "10px", background: UI.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" },
  submitterName: { fontSize: "15px", fontWeight: "750", color: UI.text },
  submitterEmail: { fontSize: "12px", color: UI.textMuted, fontWeight: "500" },
  deptBadge: { background: "#fff", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", border: `1px solid ${UI.border}`, color: UI.textMuted },
  
  contentBox: { background: "#fff", padding: "32px", borderRadius: "20px", border: `1px solid ${UI.border}`, marginBottom: "40px" },
  contentBoxTitle: { fontSize: "11px", fontWeight: "800", color: UI.primary, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" },
  contentText: { fontSize: "16px", lineHeight: "1.8", color: "#334155", margin: 0 },
  fileLink: { display: "inline-flex", alignItems: "center", marginTop: "24px", background: "#f1f5f9", color: UI.text, padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", textDecoration: "none" },
  
  aiSection: { background: "#fcfdff", borderRadius: "28px", padding: "40px", border: `1px solid ${UI.border}` },
  aiHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  aiBrand: { display: "flex", alignItems: "center", gap: "12px" },
  aiTitle: { fontSize: "18px", fontWeight: "800", color: UI.text, margin: 0 },
  aiBtn: { background: UI.primary, color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "750", cursor: "pointer", boxShadow: `0 8px 16px ${UI.primary}22` },
  
  feedbackContainer: { display: "flex", flexDirection: "column", gap: "32px" },
  statsRow: { display: "flex", gap: "48px", background: "#fff", padding: "24px 32px", borderRadius: "20px", border: `1px solid ${UI.border}` },
  statCell: { display: "flex", flexDirection: "column", gap: "6px" },
  statLabel: { fontSize: "10px", color: UI.textMuted, textTransform: "uppercase", fontWeight: "800", letterSpacing: "1px" },
  statVal: { fontSize: "20px", fontWeight: "850", color: UI.text },
  
  feedbackGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  feedbackItem: { background: "#fff", padding: "24px", borderRadius: "20px", border: `1px solid ${UI.border}` },
  feedbackLabel: { fontSize: "12px", fontWeight: "850", color: UI.primary, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  feedbackText: { fontSize: "15px", lineHeight: "1.7", color: "#475569", margin: 0 },
  
  emailPreview: { marginTop: "32px" },
  previewTitle: { fontSize: "15px", fontWeight: "800", color: UI.text, marginBottom: "16px" },
  textareaWrap: { background: "#fff", borderRadius: "16px", border: `1px solid ${UI.border}`, overflow: "hidden" },
  emailArea: { width: "100%", height: "200px", background: "transparent", border: "none", padding: "20px", color: "#334155", fontSize: "15px", lineHeight: "1.7", outline: "none", resize: "none" },
  
  actionRow: { display: "flex", gap: "12px", marginTop: "32px" },
  approveBtn: { flex: 2, background: "#0f172a", color: "white", border: "none", padding: "16px", borderRadius: "14px", fontWeight: "750", fontSize: "15px", cursor: "pointer" },
  revisionBtn: { flex: 1, background: "transparent", border: `1px solid ${UI.border}`, color: UI.textMuted, padding: "16px", borderRadius: "14px", fontWeight: "750", cursor: "pointer" },
  
  emptyState: { textAlign: "center", padding: "160px 0" },
  emptyNavText: { color: UI.textMuted, fontSize: "13px", textAlign: "center", marginTop: "24px" },
};
