import React from "react";

const UI = {
  primary: "#6366f1",
  success: "#10b981",
  danger: "#ef4444",
  text: "#1e293b",
  textMuted: "#64748b",
  border: "#e2e8f0",
  glass: "rgba(255, 255, 255, 0.95)"
};

export default function EmployeeProfileModal({ employee, projects, onClose }) {
  if (!employee) return null;

  // Determine automatic status
  const isActive = projects.some(p => 
    p.status === "active" && 
    p.assignedEmployees && 
    p.assignedEmployees.some(emp => emp._id === employee._id)
  );

  const statusColor = isActive ? UI.success : UI.textMuted;
  const statusBg = isActive ? "#f0fdf4" : "#f1f5f9";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        
        <header style={styles.header}>
          <div style={styles.avatar}>
            {employee.name?.charAt(0) || "U"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.statusBadgeRow}>
                <h1 style={styles.name}>{employee.name}</h1>
                <span style={{ ...styles.badge, background: statusBg, color: statusColor }}>
                    <span style={{ ...styles.pulse, background: statusColor }} />
                    {isActive ? "ACTIVE" : "INACTIVE"}
                </span>
            </div>
            <p style={styles.subtext}>{employee.role?.toUpperCase()} &bull; {employee.department || "Consultant"}</p>
          </div>
        </header>

        <div style={styles.content}>
          <aside style={styles.leftCol}>
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Strategic Narrative</h3>
              <p style={styles.bio}>{employee.bio || "No biographical data available for this resource."}</p>
            </section>

            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Technical Core</h3>
              <div style={styles.skills}>
                {(employee.skills || []).map((s, i) => (
                  <span key={i} style={styles.skillPill}>{s}</span>
                ))}
              </div>
            </section>
          </aside>

          <main style={styles.rightCol}>
            <div style={styles.metricRow}>
                <div style={styles.metric}>
                    <div style={styles.metricValue}>{employee.experience || 0} Years</div>
                    <div style={styles.metricLabel}>Operational Exp</div>
                </div>
                <div style={styles.metric}>
                    <div style={styles.metricValue}>{(employee.pastProjects || []).length}</div>
                    <div style={styles.metricLabel}>Total Initiatives</div>
                </div>
            </div>

            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Project Lifecycle</h3>
              <div style={styles.projectList}>
                {(!employee.pastProjects || employee.pastProjects.length === 0) ? (
                  <p style={styles.muted}>No historical project data recorded.</p>
                ) : (
                  employee.pastProjects.map((p, i) => (
                    <div key={i} style={styles.projectItem}>
                      <div style={styles.pjDot} />
                      <div style={{ flex: 1 }}>
                        <div style={styles.pjTitle}>{p.title || "Unknown Initiative"}</div>
                        <div style={styles.pjStatus}>{p.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    animation: "fadeIn 0.2s ease-out"
  },
  modal: {
    background: UI.glass,
    width: "700px",
    maxWidth: "95vw",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    position: "relative",
    padding: "32px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    overflowY: "auto",
    maxHeight: "90vh"
  },
  closeBtn: {
    position: "absolute",
    top: "24px", right: "24px",
    background: "none", border: "none",
    fontSize: "24px", color: UI.textMuted,
    cursor: "pointer"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: `1px solid ${UI.border}`
  },
  avatar: {
    width: "80px", height: "80px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "32px", color: "white", fontWeight: "700",
    boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)"
  },
  statusBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "4px"
  },
  name: {
    fontSize: "26px", fontWeight: "800", color: UI.text,
    margin: 0, letterSpacing: "-0.5px"
  },
  badge: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "4px 10px", borderRadius: "20px",
    fontSize: "10px", fontWeight: "800", letterSpacing: "0.5px"
  },
  pulse: {
    width: "6px", height: "6px", borderRadius: "50%",
    animation: "pulse 1.5s infinite"
  },
  subtext: {
    fontSize: "13px", fontWeight: "600", color: UI.textMuted,
    margin: 0
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "40px"
  },
  leftCol: { display: "flex", flexDirection: "column", gap: "24px" },
  rightCol: { display: "flex", flexDirection: "column", gap: "24px" },
  section: { marginBottom: "8px" },
  sectionTitle: {
    fontSize: "12px", fontWeight: "800", color: UI.text,
    textTransform: "uppercase", letterSpacing: "1px",
    marginBottom: "12px", display: "block"
  },
  bio: {
    fontSize: "14px", lineHeight: "1.6", color: UI.textMuted,
    margin: 0, textAlign: "justify"
  },
  skills: { display: "flex", flexWrap: "wrap", gap: "8px" },
  skillPill: {
    background: "#f8fafc",
    border: `1px solid ${UI.border}`,
    padding: "4px 10px", borderRadius: "8px",
    fontSize: "12px", fontWeight: "600", color: UI.text
  },
  metricRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "16px",
    border: `1px solid ${UI.border}`
  },
  metric: { textAlign: "center" },
  metricValue: { fontSize: "18px", fontWeight: "800", color: UI.primary },
  metricLabel: { fontSize: "10px", fontWeight: "700", color: UI.textMuted, textTransform: "uppercase" },
  projectList: { display: "flex", flexDirection: "column", gap: "12px" },
  projectItem: {
    display: "flex", alignItems: "flex-start", gap: "12px"
  },
  pjDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: UI.primary, marginTop: "6px"
  },
  pjTitle: { fontSize: "13px", fontWeight: "700", color: UI.text },
  pjStatus: { fontSize: "11px", fontWeight: "600", color: UI.textMuted },
  muted: { fontSize: "13px", color: UI.textMuted },
};
