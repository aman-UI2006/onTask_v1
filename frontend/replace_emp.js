import fs from 'fs';
import path from 'path';

const filePath = 'D:/team_velora/new_tech/Ai_project_manager_complete/frontend/src/pages/EmployeeDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const newStyles = `const styles = {
  page: { minHeight: "100vh", display: "flex", fontFamily: "var(--font-family)", color: "var(--text-primary)", zIndex: 1 },
  sidebar: { width: "220px", minHeight: "100vh", background: "var(--bg-surface)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 },
  sidebarBrand: { display: "flex", alignItems: "center", gap: "10px", padding: "0 20px 24px", borderBottom: "1px solid var(--border-color)" },
  logo: { width: "32px", height: "32px", background: "var(--accent-blue)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  brandName: { color: "var(--text-primary)", fontWeight: "600", fontSize: "15px" },
  skillsSection: { padding: "16px 20px", borderTop: "1px solid var(--border-color)", marginTop: "12px" },
  skillsLabel: { fontSize: "11px", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: "6px" },
  skillTag: { background: "var(--bg-subtle)", color: "var(--text-secondary)", fontSize: "11px", padding: "3px 8px", borderRadius: "12px", border: "1px solid var(--border-color)" },
  sidebarFooter: { padding: "16px 20px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto" },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent-green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", flexShrink: 0 },
  userName: { fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" },
  userRole: { fontSize: "11px", color: "var(--text-secondary)" },
  logoutBtn: { background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-secondary)", padding: "8px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", width: "100%", transition: "var(--transition-fast)" },
  main: { flex: 1, padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px" },
  pageTitle: { fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" },
  muted: { color: "var(--text-secondary)", fontSize: "14px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" },
  errorBanner: { background: "#fef2f2", border: "1px solid var(--accent-red)", color: "var(--accent-red)", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px" },
  emptyState: { textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  emptyText: { color: "var(--text-primary)", fontSize: "16px", fontWeight: "500" },
  projectsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" },
  projectCard: { background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "var(--shadow-soft)", transition: "var(--transition-fast)" },
  projectHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" },
  projectTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", margin: 0, flex: 1 },
  statusBadge: { fontSize: "11px", padding: "4px 12px", borderRadius: "20px", fontWeight: "500", flexShrink: 0 },
  projectDesc: { fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  deadlineText: { fontSize: "13px", color: "var(--text-muted)", margin: 0 },
  progressSection: { display: "flex", flexDirection: "column", gap: "8px" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: "12px", color: "var(--text-secondary)" },
  progressCount: { fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" },
  progressTrack: { width: "100%", background: "var(--bg-subtle)", borderRadius: "9999px", height: "8px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "9999px", transition: "width 0.5s ease" },
  completedBadge: { background: "#f0fdf4", border: "1px solid #10b981", color: "#10b981", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center" },
  openButton: { background: "#0f0f0f", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginTop: "auto", transition: "var(--transition-fast)" },
};
`;

const splitIndex = content.indexOf('const styles = {');
if (splitIndex !== -1) {
  content = content.substring(0, splitIndex) + newStyles;
  fs.writeFileSync(filePath, content, 'utf8');
}
