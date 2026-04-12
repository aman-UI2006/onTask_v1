import { useState, useEffect } from "react";
import { fetchProjects, fetchTasksByProject, aiGenerateEnhancedEmail, sendConsolidatedEmail } from "../api/projects";

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const paths = {
    folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z"
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
      <path d={paths[name] || ""} />
    </svg>
  );
};

export default function EmailAutomationView() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedTeamsMap, setSelectedTeamsMap] = useState({}); // { [projId]: [teamNames] }
  const [selectedEmployeesMap, setSelectedEmployeesMap] = useState({}); // { [projId]: [empIds] }
  const [tone, setTone] = useState("Professional");
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedBody, setGeneratedBody] = useState("");
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const getTeamsForProject = (project) => {
    const emps = project.assignedEmployees || [];
    const teams = {};
    emps.forEach(e => {
      const dept = e.department || "General";
      if (!teams[dept]) teams[dept] = [];
      teams[dept].push(e);
    });
    return teams;
  };

  const handleProjectToggle = (id) => {
    if (selectedProjectIds.includes(id)) {
      setSelectedProjectIds(selectedProjectIds.filter(pid => pid !== id));
      const newTeamsMap = { ...selectedTeamsMap };
      const newEmpsMap = { ...selectedEmployeesMap };
      delete newTeamsMap[id];
      delete newEmpsMap[id];
      setSelectedTeamsMap(newTeamsMap);
      setSelectedEmployeesMap(newEmpsMap);
    } else {
      setSelectedProjectIds([...selectedProjectIds, id]);
    }
  };

  const handleTeamToggle = (projId, teamName, members) => {
    const currentTeams = selectedTeamsMap[projId] || [];
    const currentEmps = selectedEmployeesMap[projId] || [];
    const memberIds = members.map(m => m._id || m.id);

    if (currentTeams.includes(teamName)) {
      setSelectedTeamsMap({ ...selectedTeamsMap, [projId]: currentTeams.filter(t => t !== teamName) });
      setSelectedEmployeesMap({ ...selectedEmployeesMap, [projId]: currentEmps.filter(id => !memberIds.includes(id)) });
    } else {
      setSelectedTeamsMap({ ...selectedTeamsMap, [projId]: [...currentTeams, teamName] });
      setSelectedEmployeesMap({ ...selectedEmployeesMap, [projId]: [...new Set([...currentEmps, ...memberIds])] });
    }
  };

  const handleEmployeeToggle = (projId, empId) => {
    const currentEmps = selectedEmployeesMap[projId] || [];
    if (currentEmps.includes(empId)) {
      setSelectedEmployeesMap({ ...selectedEmployeesMap, [projId]: currentEmps.filter(id => id !== empId) });
    } else {
      setSelectedEmployeesMap({ ...selectedEmployeesMap, [projId]: [...currentEmps, empId] });
    }
  };

  const handleGenerate = async () => {
    if (!instruction || selectedProjectIds.length === 0) return;
    setLoading(true);
    try {
      let finalRecipients = [];
      let consolidatedContext = "";

      selectedProjectIds.forEach(pid => {
        const p = projects.find(proj => proj._id === pid);
        if (!p) return;

        const pEmpIds = selectedEmployeesMap[pid] || [];
        const pEmps = p.assignedEmployees || [];
        const targetEmps = pEmps.filter(e => pEmpIds.includes(e._id || e.id));

        if (targetEmps.length > 0) {
          finalRecipients = [...finalRecipients, ...targetEmps];
          consolidatedContext += `Project: ${p.title}. Target Recipients: ${targetEmps.map(e => e.name).join(", ")}. \nProject context: ${p.description}. \n`;
        }
      });

      if (finalRecipients.length === 0) {
        setLoading(false);
        return alert("Please select at least one employee.");
      }

      const uniqueRecipients = Array.from(new Map(finalRecipients.map(r => [r._id || r.id, r])).values());

      const result = await aiGenerateEnhancedEmail({
        projectName: "Selected Initiatives",
        recipients: uniqueRecipients,
        instruction,
        tone,
        context: consolidatedContext
      });
      setGeneratedBody(result);
      setRecipientEmails(uniqueRecipients.map(r => r.email).filter(Boolean));
    } catch (err) {
      console.error("AI generation failed", err);
      setError("AI generation failed. Please try again with different instructions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.pageHeader}>
        <h1 style={styles.title}>Email Automation</h1>
        <p style={styles.subtitle}>Directing specialized AI communication across multi-project units.</p>
      </header>
      
      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.layout}>
        <div style={styles.selectionArea}>
          <h3 style={styles.sectionTitle}>Select target audience</h3>
          {projects.length === 0 ? <p style={styles.muted}>No projects initialized.</p> : projects.map((p, idx) => (
            <div key={`${p._id}-${idx}`} style={styles.projectCard}>
              <div style={styles.projectHeader}>
                <input 
                  type="checkbox" 
                  checked={selectedProjectIds.includes(p._id)}
                  onChange={() => handleProjectToggle(p._id)}
                  style={styles.checkbox}
                />
                <div style={styles.projectInfo}>
                  <div style={styles.projLabel}>Strategic Initiative</div>
                  <strong style={styles.projectTitleText}>{p.title}</strong>
                  <span style={{
                    ...styles.statusBadge,
                    background: selectedProjectIds.includes(p._id) ? "#6366f115" : "#f1f5f9",
                    color: selectedProjectIds.includes(p._id) ? "#6366f1" : "#64748b"
                  }}>
                    {p.status}
                  </span>
                </div>
              </div>

              {selectedProjectIds.includes(p._id) && (
                <div style={styles.teamContainer}>
                  {Object.entries(getTeamsForProject(p)).map(([teamName, emps]) => (
                    <div key={teamName} style={styles.teamSelector}>
                      <label style={styles.teamLabel}>
                        <input 
                          type="checkbox"
                          checked={(selectedTeamsMap[p._id] || []).includes(teamName)}
                          onChange={() => handleTeamToggle(p._id, teamName, emps)}
                          style={styles.miniCheckbox}
                        />
                        <Icon name="folder" size={14} style={{ marginRight: "8px" }} />
                        <span style={styles.teamNameText}>{teamName} Team</span>
                      </label>
                      <div style={styles.empList}>
                        {emps.map(emp => (
                          <label key={emp._id || emp.id} style={{
                            ...styles.empLabel,
                            background: (selectedEmployeesMap[p._id] || []).includes(emp._id || emp.id) ? "#fcfdfe" : "#fff",
                            borderColor: (selectedEmployeesMap[p._id] || []).includes(emp._id || emp.id) ? "#6366f1" : "#e2e8f0"
                          }}>
                            <input 
                              type="checkbox"
                              checked={(selectedEmployeesMap[p._id] || []).includes(emp._id || emp.id)}
                              onChange={() => handleEmployeeToggle(p._id, emp._id || emp.id)}
                              style={styles.miniCheckbox}
                            />
                            {emp.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.controlsArea}>
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Composition Settings</h3>
            
            <label style={styles.label}>Strategic Tone</label>
            <select style={styles.input} value={tone} onChange={(e) => setTone(e.target.value)}>
              {["Professional", "Collaborative", "Motivator", "Strict", "Urgent"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <label style={styles.label}>Instruction for AI</label>
            <textarea 
              style={styles.area}
              placeholder="Define the core message (e.g. Schedule a cross-team review for the authentication module update)."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />

            <button 
              style={styles.primaryBtn}
              disabled={loading || selectedProjectIds.length === 0}
              onClick={handleGenerate}
            >
              <Icon name="zap" size={16} color="white" style={{ marginRight: "10px" }} />
              {loading ? "Analyzing Requirements..." : "Draft Consolidated Brief"}
            </button>

            {generatedBody && (
              <div style={styles.result}>
                <label style={styles.label}>Draft Preview</label>
                <textarea 
                  style={styles.preview}
                  value={generatedBody}
                  onChange={(e) => setGeneratedBody(e.target.value)}
                />
                <button 
                  style={{ ...styles.sendBtn, opacity: sending ? 0.7 : 1 }} 
                  onClick={async () => {
                    if (!generatedBody || recipientEmails.length === 0) return;
                    setSending(true);
                    try {
                      await sendConsolidatedEmail({
                        recipients: recipientEmails,
                        subject: `Operational Update: ${instruction.slice(0, 30)}...`,
                        body: generatedBody
                      });
                      alert("Intelligence Brief Dispatched.");
                      setGeneratedBody("");
                      setRecipientEmails([]);
                    } catch (err) {
                      alert("Dispatch failed.");
                    } finally {
                      setSending(false);
                    }
                  }}
                  disabled={sending}
                >
                  <Icon name="send" size={16} color="white" style={{ marginRight: "10px" }} />
                  {sending ? "Dispatching..." : "Confirm & Dispatch Brief"}
                </button>
              </div>
            )}
          </div>
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
  card: "#ffffff"
};

const styles = {
  container: { padding: "48px 64px", background: UI.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  pageHeader: { marginBottom: "48px" },
  title: { fontSize: "32px", fontWeight: "850", letterSpacing: "-1.5px", color: UI.text, marginBottom: "8px" },
  subtitle: { color: UI.textMuted, fontSize: "15px", fontWeight: "500" },
  layout: { display: "flex", gap: "48px" },
  selectionArea: { flex: 1.2 },
  controlsArea: { flex: 1 },
  sectionTitle: { fontSize: "11px", color: UI.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "24px", fontWeight: "800" },
  projectCard: { background: UI.card, borderRadius: "24px", padding: "32px", border: `1px solid ${UI.border}`, marginBottom: "20px" },
  projectHeader: { display: "flex", alignItems: "flex-start", gap: "20px" },
  checkbox: { width: "20px", height: "20px", accentColor: UI.primary, cursor: "pointer", marginTop: "4px" },
  miniCheckbox: { width: "16px", height: "16px", accentColor: UI.primary, cursor: "pointer" },
  projLabel: { fontSize: "10px", textTransform: "uppercase", color: UI.textMuted, marginBottom: "4px", fontWeight: "800", letterSpacing: "0.5px" },
  projectTitleText: { fontSize: "19px", fontWeight: "750", color: UI.text, letterSpacing: "-0.5px" },
  statusBadge: { margin: "0 12px", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase" },
  errorBox: { background: "#fef2f2", color: "#ef4444", padding: "16px 24px", borderRadius: "14px", marginBottom: "32px", fontSize: "14px", border: "1px solid #fee2e2", fontWeight: "600" },
  teamContainer: { marginTop: "24px", background: "#f8fafc", padding: "24px", borderRadius: "20px", border: `1px solid ${UI.border}` },
  teamSelector: { marginBottom: "20px" },
  teamLabel: { fontSize: "14px", display: "flex", alignItems: "center", color: UI.text, fontWeight: "700", marginBottom: "12px", gap: "2px" },
  teamNameText: { cursor: "pointer" },
  empList: { display: "flex", flexWrap: "wrap", gap: "10px", paddingLeft: "26px" },
  empLabel: { fontSize: "13px", background: "#fff", padding: "8px 16px", borderRadius: "10px", border: `1px solid ${UI.border}`, color: UI.text, display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" },
  muted: { color: UI.textMuted, fontSize: "15px" },

  card: { background: UI.card, padding: "40px", borderRadius: "32px", border: `1px solid ${UI.border}` },
  label: { display: "block", fontSize: "13px", fontWeight: "800", color: UI.text, marginBottom: "10px", marginTop: "24px", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "14px 18px", borderRadius: "14px", border: `1px solid ${UI.border}`, background: "#fcfdfe", fontSize: "15px", fontWeight: "600", outline: "none" },
  area: { width: "100%", height: "120px", padding: "18px", borderRadius: "16px", border: `1px solid ${UI.border}`, background: "#fcfdfe", fontSize: "15px", lineHeight: "1.6", outline: "none", resize: "none" },
  primaryBtn: { width: "100%", background: "#0f172a", color: "white", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "800", fontSize: "16px", marginTop: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  result: { marginTop: "40px", borderTop: `1px solid ${UI.border}`, paddingTop: "32px" },
  preview: { width: "100%", height: "300px", background: "#f8fafc", border: `1px solid ${UI.border}`, borderRadius: "16px", padding: "20px", color: UI.text, fontSize: "15px", lineHeight: "1.7", outline: "none", resize: "none" },
  sendBtn: { background: UI.primary, color: "white", border: "none", padding: "18px", borderRadius: "16px", fontWeight: "800", fontSize: "16px", marginTop: "20px", cursor: "pointer", width: "100%", boxShadow: `0 8px 16px ${UI.primary}22`, display: "flex", alignItems: "center", justifyContent: "center" }
};
