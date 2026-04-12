import React, { useState } from "react";
import EmployeeProfileModal from "./EmployeeProfileModal";

const UI = {
  primary: "#6366f1",
  success: "#10b981",
  danger: "#ef4444",
  text: "#1e293b",
  textMuted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc"
};

const Icon = ({ name }) => {
  const paths = {
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

export default function HumanCapitalView({ employees, projects }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
                          (e.department && e.department.toLowerCase().includes(search.toLowerCase()));
    
    const isActive = projects.some(p => 
      p.status === "active" && p.assignedEmployees?.some(emp => emp._id === e._id)
    );
    
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && isActive) || 
                          (statusFilter === "inactive" && !isActive);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleArea}>
          <h1 style={styles.title}>Human Capital</h1>
          <p style={styles.subtitle}>Strategic personnel management and capacity oversight.</p>
        </div>
        
        <div style={styles.controls}>
          <div style={styles.searchWrap}>
            <Icon name="search" />
            <input 
              style={styles.searchInput} 
              placeholder="Search by name or department..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={styles.filterGroup}>
            {["all", "active", "inactive"].map(f => (
              <button 
                key={f}
                style={{
                  ...styles.filterBtn,
                  background: statusFilter === f ? UI.primary : "transparent",
                  color: statusFilter === f ? "white" : UI.textMuted,
                  borderColor: statusFilter === f ? UI.primary : UI.border
                }}
                onClick={() => setStatusFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={styles.grid}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>No personnel match your current parameters.</div>
        ) : (
          filtered.map(emp => {
            const isActive = projects.some(p => 
              p.status === "active" && p.assignedEmployees?.some(ae => ae._id === emp._id)
            );
            return (
              <div 
                key={emp._id} 
                style={styles.pod}
                onClick={() => setSelectedEmployee(emp)}
              >
                <div style={styles.podHeader}>
                   <div style={styles.avatarMini}>{emp.name.charAt(0)}</div>
                   <div style={styles.podStatus}>
                      <span style={{ 
                        ...styles.statusPulse, 
                        background: isActive ? UI.success : UI.textMuted 
                      }} />
                      {isActive ? "ACTIVE" : "AWAY"}
                   </div>
                </div>
                <h3 style={styles.podName}>{emp.name}</h3>
                <p style={styles.podDept}>{emp.department || "General Consultant"}</p>
                
                <p style={styles.podBio}>
                  {emp.bio ? (emp.bio.length > 80 ? emp.bio.substring(0, 80) + "..." : emp.bio) : "Precision operative with specialized technical core."}
                </p>

                <div style={styles.podSkills}>
                   {(emp.skills || []).slice(0, 3).map((s, i) => (
                     <span key={i} style={styles.podSkill}>{s}</span>
                   ))}
                   {(emp.skills || []).length > 3 && <span style={styles.podSkillMore}>+{(emp.skills || []).length - 3}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedEmployee && (
        <EmployeeProfileModal 
          employee={selectedEmployee} 
          projects={projects} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "10px 0"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "32px",
    gap: "20px",
    flexWrap: "wrap"
  },
  titleArea: { flex: 1 },
  title: { fontSize: "28px", fontWeight: "800", color: UI.text, margin: "0 0 6px" },
  subtitle: { fontSize: "14px", color: UI.textMuted, margin: 0 },
  controls: { display: "flex", gap: "16px", alignItems: "center" },
  searchWrap: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "white", padding: "10px 16px", borderRadius: "14px",
    border: `1px solid ${UI.border}`, width: "320px",
    color: UI.textMuted, boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  searchInput: {
    border: "none", outline: "none", width: "100%",
    fontSize: "14px", color: UI.text
  },
  filterGroup: {
    display: "flex", background: "white", padding: "4px",
    borderRadius: "14px", border: `1px solid ${UI.border}`,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  filterBtn: {
    padding: "8px 16px", borderRadius: "10px", border: "1px solid transparent",
    fontSize: "10px", fontWeight: "800", cursor: "pointer",
    transition: "all 0.2s"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px"
  },
  pod: {
    background: "white",
    padding: "24px",
    borderRadius: "20px",
    border: `1px solid ${UI.border}`,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    display: "flex", flexDirection: "column"
  },
  podHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "16px"
  },
  avatarMini: {
    width: "40px", height: "40px", borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px", color: "white", fontWeight: "700"
  },
  podStatus: {
    display: "flex", alignItems: "center", gap: "6px",
    fontSize: "9px", fontWeight: "800", color: UI.textMuted,
    letterSpacing: "0.5px"
  },
  statusPulse: {
    width: "6px", height: "6px", borderRadius: "50%"
  },
  podName: { fontSize: "18px", fontWeight: "800", color: UI.text, margin: "0 0 4px" },
  podDept: { fontSize: "12px", fontWeight: "600", color: UI.primary, margin: "0 0 12px" },
  podBio: { 
    fontSize: "13px", color: UI.textMuted, lineHeight: "1.5", 
    margin: "0 0 16px", flex: 1 
  },
  podSkills: { display: "flex", flexWrap: "wrap", gap: "6px" },
  podSkill: {
    background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px",
    fontSize: "10px", fontWeight: "700", color: UI.textMuted
  },
  podSkillMore: {
    fontSize: "10px", fontWeight: "800", color: UI.primary, alignSelf: "center"
  },
  empty: {
    gridColumn: "1 / -1", textAlign: "center", padding: "60px",
    color: UI.textMuted, fontSize: "14px"
  }
};
