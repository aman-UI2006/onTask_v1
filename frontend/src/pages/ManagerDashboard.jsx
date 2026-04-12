import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  fetchProjects, 
  fetchProjectById, 
  fetchTasksByProject, 
  updateProject, 
  createProject, 
  aiSelectEmployees, 
  aiGenerateWorkflow, 
  sendProjectEmails, 
  uploadTranscript, 
  aiFormTeams, 
  fetchEmployees, 
  aiManagerChat 
} from "../api/projects";
import NotificationCenter from "../components/NotificationCenter";
import AnalyticsView from "../components/AnalyticsView";
import ReviewWorkView from "../components/ReviewWorkView";
import EmailAutomationView from "../components/EmailAutomationView";

// Professional Line Icons (SVG Paths)
const Icon = ({ name, size = 18, color = "currentColor", style }) => {
  const paths = {
    dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    analytics: "M18 20V10 M12 20V4 M6 20V14",
    plus: "M12 5v14 M5 12h14",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    review: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    chevronLeft: "M15 18l-6-6 6-6",
    bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0"
  };

  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" 
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      style={{ verticalAlign: "middle", ...style }}
    >
      <path d={paths[name] || ""} />
    </svg>
  );
};

export default function ManagerDashboard() {
  const { dbUser, logout } = useAuth();

  const [view, setView] = useState("home");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Clear notifications on tab/project change, and after timeout
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [view, selectedProject]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    deadline: "",
    transcript: null,
  });

  // Edit project modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    deadline: "",
    status: "planning",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Send emails + transcript
  const [emailSending, setEmailSending] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [transcriptUploading, setTranscriptUploading] = useState(false);
  const [transcriptNotice, setTranscriptNotice] = useState("");

  // AI chat (floating)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);

  // AI Crew Selection
  const [crewData, setCrewData] = useState(null); 
  const [crewRationale, setCrewRationale] = useState("");
  const [crewRequirements, setCrewRequirements] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [filterExp, setFilterExp] = useState(0);
  const [filterProjects, setFilterProjects] = useState(0);
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterSkills, setFilterSkills] = useState([]);
  const [allAvailableSkills, setAllAvailableSkills] = useState([]);
  const [activeSearchTab, setActiveSearchTab] = useState("general");

  const [showSearch, setShowSearch] = useState(false);
  const [showCrewSuggestions, setShowCrewSuggestions] = useState(false);
  const [targetTeam, setTargetTeam] = useState("");
  const [targetMid, setTargetMid] = useState(null);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState("all");
  const [employeeFilterDept, setEmployeeFilterDept] = useState("all");

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  useEffect(() => {
    if (searchQuery.length < 2) {
      setNameSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const all = await fetchEmployees();
        const filtered = all
          .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 5);
        setNameSuggestions(filtered);
      } catch {
        setNameSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [searchQuery]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const openProject = async (id) => {
    setView("detail");
    setLoading(true);
    try {
      const data = await fetchProjectById(id);
      setSelectedProject(data);
      
      // Auto-show crew if it's already generated
      if (data.crewData && data.crewData.teams) {
        setCrewData(data.crewData.teams);
        setCrewRationale(data.crewData.rationale || "");
        setShowCrewSuggestions(true);
      } else {
        setCrewData(null);
        setCrewRationale("");
        setShowCrewSuggestions(false);
      }
      
      const projTasks = await fetchTasksByProject(id);
      setTasks(projTasks);
    } catch (err) {
      setError("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  const openSearch = async (teamName, mid = null) => {
    setTargetTeam(teamName);
    setTargetMid(mid);
    setShowSearch(true);
    setLoading(true);
    try {
      const all = await fetchEmployees();
      const skills = new Set();
      all.forEach(e => e.skills?.forEach(s => skills.add(s)));
      setAllAvailableSkills(Array.from(skills).sort());
      setSearchResults(all);
    } catch {
      setError("Failed to load talent data.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterExp(0);
    setFilterProjects(0);
    setFilterAvailability("all");
    setFilterGender("all");
    setFilterSkills([]);
    setSearchQuery("");
    handleSearch();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("requiredSkills", form.requiredSkills);
      formData.append("deadline", form.deadline || "");
      if (form.transcript) formData.append("transcript", form.transcript);

      const data = await createProject(formData);
      setSuccess("Initiative launched. AI is synthesizing personnel...");
      
      // Auto-navigate to project detail where AI results will appear
      if (data.project && data.project._id) {
        openProject(data.project._id);
      } else {
        fetchProjects();
      }
      setCrewData(data.crewData?.teams || null);
      setCrewRationale(data.crewData?.rationale || "");
      setTasks([]);
      setForm({ title: "", description: "", requiredSkills: "", deadline: "", transcript: null });
      await loadProjects();
      setView("detail");
      if (data.crewData) setShowCrewSuggestions(true);
    } catch (err) {
      setError("Initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWorkflow = async () => {
    if (!selectedProject?._id) return;
    setAiLoading("workflow");
    try {
      const result = await aiGenerateWorkflow(selectedProject._id);
      setSuccess(`Workflow optimized: ${result.aiSummary}`);
      const projectTasks = await fetchTasksByProject(selectedProject._id);
      setTasks(projectTasks);
      setView("tasks");
    } catch (err) {
      setError("Workflow optimization failed.");
    } finally {
      setAiLoading("");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setEditSaving(true);
    try {
      const skillsArray = editForm.requiredSkills.split(",").map(s => s.trim()).filter(Boolean);
      const updated = await updateProject(selectedProject._id, {
        title: editForm.title,
        description: editForm.description,
        requiredSkills: skillsArray,
        deadline: editForm.deadline || null,
        status: editForm.status,
      });
      setSelectedProject(updated);
      await loadProjects();
      setEditModalOpen(false);
      setSuccess("Strategic parameters updated.");
    } catch (err) {
      setError("Update failed.");
    } finally {
      setEditSaving(false);
    }
  };

  const openEditModal = () => {
    if (!selectedProject) return;
    setEditForm({
      title: selectedProject.title || "",
      description: selectedProject.description || "",
      requiredSkills: (selectedProject.requiredSkills || []).join(", "),
      deadline: selectedProject.deadline ? new Date(selectedProject.deadline).toISOString().slice(0, 10) : "",
      status: selectedProject.status || "planning",
    });
    setEditModalOpen(true);
  };

  const handleSendProjectEmails = async () => {
    if (!selectedProject?._id) return;
    if (!selectedProject.assignedEmployees || selectedProject.assignedEmployees.length === 0) {
      setError("No employees committed. Synthesis must be finalized before dispatch.");
      return;
    }
    setEmailSending(true);
    try {
      await sendProjectEmails(selectedProject._id);
      setSuccess("Dispatch Briefs transmitted to assigned personnel.");
    } catch (err) {
      setError("Dispatch transmission failed.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleAiSelectPersonnel = async () => {
    if (!selectedProject?._id) return;
    setAiLoading("crew");
    setError("");
    try {
      // Use the structured requirement string for better AI results
      const requirements = `Project: ${selectedProject.title}. Description: ${selectedProject.description}. Skills: ${selectedProject.requiredSkills?.join(", ")}`;
      const result = await aiFormTeams(requirements);
      
      if (result && result.teams) {
        setCrewData(result.teams);
        setCrewRationale(result.rationale || "");
        setShowCrewSuggestions(true);
        setSuccess("Personnel architecture synthesized.");
      } else {
        setError("AI was unable to form specific units. Try manual assignment.");
      }
    } catch (err) {
      setError("Strategic synthesis offline. Check backend services.");
      console.error(err);
    } finally {
      setAiLoading("");
    }
  };

  const handleTranscriptUpload = async () => {
    if (!selectedProject?._id || !transcriptFile) return;
    setTranscriptUploading(true);
    try {
      await uploadTranscript(selectedProject._id, transcriptFile);
      setTranscriptNotice("Intelligence synchronized.");
      setTranscriptFile(null);
    } catch (err) {
      setError("Synchronization failed.");
    } finally {
      setTranscriptUploading(false);
    }
  };

  const handleFormTeams = async () => {
    if (!crewRequirements) return;
    setAiLoading("crew");
    try {
      const result = await aiFormTeams(crewRequirements);
      setCrewData(result.teams);
      setCrewRationale(result.rationale);
      setSuccess("Operational units synthesized.");
    } catch (err) {
      setError("Team synthesis failed.");
    } finally {
      setAiLoading("");
    }
  };

  const handleSaveCrew = async () => {
    if (!selectedProject || !crewData) return;
    setLoading(true);
    try {
      const allIds = [];
      Object.values(crewData).forEach(team => team.forEach(emp => allIds.push(emp._id || emp.id)));
      await updateProject(selectedProject._id, { 
        assignedEmployees: allIds,
        crewData: { teams: crewData, rationale: crewRationale },
        status: "active" 
      });
      setSuccess("Personnel assigned and activated.");
      const updated = await fetchProjectById(selectedProject._id);
      setSelectedProject(updated);
      loadProjects();
    } catch (err) {
      setError("Personnel assignment failed.");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async () => {
    setLoading(true);
    try {
      const all = await fetchEmployees();
      const filtered = all.filter(e => {
        const matchesQuery = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesExp = (Number(e.experience) || 0) >= Number(filterExp);
        const matchesProj = (e.pastProjects?.length || 0) >= Number(filterProjects);
        const matchesSkills = filterSkills.length === 0 || filterSkills.some(s => e.skills?.includes(s));
        return matchesQuery && matchesExp && matchesProj && matchesSkills;
      });
      setSearchResults(filtered);
    } catch {
       setError("Search failed.");
    } finally {
       setLoading(false);
    }
  };

  const selectEmployeeForCrew = (empId) => {
    const emp = searchResults.find(e => e._id === empId);
    if (!emp) return;
    const updated = { ...crewData };
    if (targetMid) {
      const idx = updated[targetTeam].findIndex(m => (m._id || m.id) === targetMid);
      updated[targetTeam][idx] = emp;
    } else {
      if (!updated[targetTeam].some(m => (m._id || m.id) === empId)) updated[targetTeam].push(emp);
    }
    setCrewData(updated);
    setShowSearch(false);
  };

  const dropFromTeam = (teamName, empId) => {
    const updated = { ...crewData };
    updated[teamName] = updated[teamName].filter(m => (m._id || m.id) !== empId);
    setCrewData(updated);
  };

  const dropWholeTeam = (teamName) => {
    const updated = { ...crewData };
    delete updated[teamName];
    setCrewData(updated);
  };

  const addNewTeam = () => {
    const name = prompt("Enter Unit Name:");
    if (name) setCrewData(prev => ({ ...(prev || {}), [name]: [] }));
  };

  const handleChatSend = async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: q }]);
    setChatLoading(true);
    try {
      const reply = await aiManagerChat(q, selectedProject?._id);
      setChatMessages(prev => [...prev, { role: "assistant", text: String(reply) }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Communication offline." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const priorityColor = (p) => {
    const map = { high: "#f43f5e", medium: "#f59e0b", low: "#10b981" };
    return map[p] || "#64748b";
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <span style={styles.brandName}>AiManager</span>
          <div style={{ marginLeft: "auto" }}>
            <NotificationCenter onSelect={(id, type) => {
              if (type === "submission") { setView("review"); setSelectedReportId(id); }
            }} />
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button style={{ ...styles.navItem, ...(view === "home" ? styles.navItemActive : {}) }} onClick={() => setView("home")}>
            <Icon name="dashboard" size={18} color={view === "home" ? UI.primary : UI.textMuted} /> Dashboard
          </button>
          <button style={{ ...styles.navItem, ...(view === "analytics" ? styles.navItemActive : {}) }} onClick={() => setView("analytics")}>
            <Icon name="analytics" size={18} color={view === "analytics" ? UI.primary : UI.textMuted} /> Intelligence
          </button>
          <button style={{ ...styles.navItem, ...(view === "create" ? styles.navItemActive : {}) }} onClick={() => setView("create")}>
            <Icon name="plus" size={18} color={view === "create" ? UI.primary : UI.textMuted} /> New Initiative
          </button>
          <button style={{ ...styles.navItem, ...(view === "email" ? styles.navItemActive : {}) }} onClick={() => setView("email")}>
            <Icon name="zap" size={18} color={view === "email" ? UI.primary : UI.textMuted} /> Automation
          </button>
          <button style={{ ...styles.navItem, ...(view === "review" ? styles.navItemActive : {}) }} onClick={() => setView("review")}>
            <Icon name="review" size={18} color={view === "review" ? UI.primary : UI.textMuted} /> Review Work
          </button>
          <button style={{ ...styles.navItem, ...(view === "employee_details" ? styles.navItemActive : {}) }} onClick={() => setView("employee_details")}>
            <Icon name="users" size={18} color={view === "employee_details" ? UI.primary : UI.textMuted} /> Human Capital
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{dbUser?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={styles.userName}>{dbUser?.name}</div>
              <div style={styles.userRole}>Project Executive</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={logout}>
            <Icon name="logout" size={14} color={UI.danger} style={{ marginRight: "8px" }} /> Sign Out
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {error && <div style={styles.errorBanner}>{error}</div>}
        {success && <div style={styles.successBanner}>{success}</div>}

        {view === "home" && (
          <div>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Strategic Overview</h1>
              <button style={styles.primaryBtn} onClick={() => setView("create")}>
                <Icon name="plus" size={16} color="white" style={{ marginRight: "10px" }} /> Initialize Project
              </button>
            </div>
            <div style={styles.projectGrid}>
              {projects.map((p, idx) => (
                <div key={`${p._id}-${idx}`} style={styles.projectCard} onClick={() => openProject(p._id)}>
                  <div style={styles.cardTop}>
                    <span style={styles.cardTitle}>{p.title}</span>
                    <span style={{ ...styles.statusBadge, background: p.status === 'active' ? '#f0fdf4' : '#f1f5f9', color: p.status === 'active' ? '#10b981' : '#64748b' }}>{p.status}</span>
                  </div>
                  <p style={styles.cardDesc}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "create" && (
          <div style={styles.formWrap}>
            <h1 style={styles.pageTitle}>New project initiative</h1>
            <form style={styles.form} onSubmit={handleCreate}>
              <div style={styles.field}><label style={styles.label}>Title</label><input style={styles.input} required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div style={styles.field}><label style={styles.label}>Description</label><textarea style={{...styles.input, height: "100px"}} required value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={styles.field}><label style={styles.label}>Competencies</label><input style={styles.input} value={form.requiredSkills} onChange={e => setForm({...form, requiredSkills: e.target.value})} /></div>
              <div style={styles.field}><label style={styles.label}>Deadline</label><input type="date" style={styles.input} value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
              <button type="submit" style={styles.primaryBtn} disabled={loading}>{loading ? "Initializing..." : "Begin Synthesis"}</button>
            </form>
          </div>
        )}

        {view === "detail" && selectedProject && (
          <div>
            <div style={styles.detailHeaderWrap}>
              <div>
                <button style={styles.backBtnDetail} onClick={() => setView("home")}><Icon name="chevronLeft" size={14} /> Back</button>
                <h1 style={styles.detailTitleMain}>{selectedProject.title}</h1>
              </div>
              <div style={styles.detailActionsGroup}>
                <button style={styles.ghostBtnRefined} onClick={openEditModal}><Icon name="edit" size={16} /> Edit</button>
                <button style={styles.ghostBtnRefined} onClick={handleSendProjectEmails} disabled={emailSending}>
                  {emailSending ? "Sending..." : "Dispatch Briefs"}
                </button>
                <button style={styles.primaryBtnRefined} onClick={handleGenerateWorkflow}><Icon name="zap" size={16} color="white" /> Optimize</button>
              </div>
            </div>
            <div style={styles.detailMainLayout}>
              <div style={styles.cardRefined}>
                <h3 style={styles.cardHeaderSmall}>Strategic Context</h3>
                <p style={styles.cardBodyText}>{selectedProject.description}</p>
                {showCrewSuggestions && crewData ? (
                  <div style={{ marginTop: "40px" }}>
                    <div style={styles.aiPanelHeader}>
                      <h3 style={styles.aiPanelTitle}><Icon name="zap" size={18} color={UI.primary} /> AI Recommendation</h3>
                      <button style={styles.aiTertiaryBtn} onClick={addNewTeam}>+ Add Unit</button>
                    </div>
                    <div style={styles.crewUnitsList}>
                      {Object.entries(crewData).map(([team, members]) => (
                        <div key={team} style={styles.crewUnitCard}>
                          <div style={styles.unitHeader}>
                            <span style={styles.unitNameText}>{team}</span>
                            <button style={styles.unitDropBtn} onClick={() => dropWholeTeam(team)}>Drop Component</button>
                          </div>
                          <div style={styles.unitMembersGrid}>
                            {members.map(m => (
                              <div key={`${team}-${m._id || m.id}`} style={styles.memberPod}>
                                <div style={{ flex: 1 }}>
                                  <div style={styles.memberNamePod}>{m.name || m.email}</div>
                                  <div style={styles.memberSubPod}>{m.department || (m.skills && m.skills[0]) || "Specialist"}</div>
                                </div>
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button style={styles.podActionBtn} onClick={() => openSearch(team, m._id || m.id)}>Swap</button>
                                  <button style={{...styles.podActionBtn, color: UI.danger}} onClick={() => dropFromTeam(team, m._id || m.id)}>Drop</button>
                                </div>
                              </div>
                            ))}
                            <div style={styles.addPodBtn} onClick={() => openSearch(team)}>+ Add Resource</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "32px", display: "flex", gap: "16px" }}>
                       <button style={styles.confirmBtn} onClick={handleSaveCrew}>Commit Personnel Structure</button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.synthesisLanding}>
                    <p style={{ color: UI.textMuted, fontSize: "14px", marginBottom: "20px" }}>No operational units have been assigned to this initiative yet.</p>
                    <button 
                      style={styles.primaryBtnRefined} 
                      onClick={handleAiSelectPersonnel}
                      disabled={aiLoading === "crew"}
                    >
                      {aiLoading === "crew" ? "Synthesizing..." : "Initialize Synthesis Personnel"}
                    </button>
                  </div>
                )}
              </div>
              <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                 <div style={styles.cardRefined}>
                 <h3 style={styles.cardHeaderSmall}>Personnel</h3>
                 <div style={styles.miniEmpList}>
                   {!selectedProject.assignedEmployees || selectedProject.assignedEmployees.length === 0 ? (
                     <div style={styles.emptySidebarText}>Planning mode: No personnel committed yet.</div>
                   ) : (
                     selectedProject.assignedEmployees.map((e, idx) => (
                       <div key={e._id || idx} style={styles.miniEmpItem}>
                         <div style={styles.miniEmpAvatar}>{e.name?.charAt(0) || "U"}</div>
                         <div style={{ overflow: "hidden" }}>
                           <div style={styles.miniEmpName}>{e.name || e.email}</div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
              </aside>
            </div>
          </div>
        )}

        {view === "tasks" && (
           <div>
             <h1 style={styles.pageTitle}>Operational Tasks</h1>
             {tasks.map(t => <div key={t._id} style={styles.taskCard}>{t.title}</div>)}
           </div>
        )}

        {view === "analytics" && <AnalyticsView projectId={selectedProject?._id} onBack={() => setView("detail")} />}
        {view === "review" && <ReviewWorkView initialReportId={selectedReportId} />}
        {view === "email" && <EmailAutomationView />}
        {view === "employee_details" && (
           <div style={styles.projectGrid}>
             {employees.filter(e => employeeFilterStatus === "all" || e.activeStatus === employeeFilterStatus).map((emp, idx) => (
                <div key={emp._id || idx} style={styles.employeeCardPremium}><h3 style={styles.empNameText}>{emp.name}</h3><p>{emp.department}</p></div>
             ))}
           </div>
        )}
      </main>

      {/* AI Chat Fabric */}
      <div style={styles.chatDock}>
        {chatOpen && (
          <div style={styles.chatPanel}>
            <div style={styles.chatPanelHeader}>Intelligence Liaison</div>
            <div ref={chatScrollRef} style={styles.chatMessages}>
              {chatMessages.map((m, i) => (
                <div key={i} style={m.role === "user" ? styles.chatMsgUser : styles.chatMsgAi}>{m.text}</div>
              ))}
            </div>
            <div style={styles.chatInputRow}>
              <input style={styles.chatInput} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChatSend()} />
            </div>
          </div>
        )}
        <button style={styles.chatFab} onClick={() => setChatOpen(!chatOpen)}>
          <Icon name="zap" size={24} color="white" />
        </button>
      </div>

      {/* Modal - Unified Edit */}
      {editModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.cardRefined}>
            <h2>Update Initiative</h2>
            <form onSubmit={handleSaveEdit}>
              <input style={styles.input} value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
              <button type="submit" style={styles.primaryBtnRefined}>Confirm Updates</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const UI = {
  primary: "#6366f1",
  primarySoft: "#6366f112",
  danger: "#f43f5e",
  success: "#10b981",
  warning: "#f59e0b",
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  sidebar: "#ffffff"
};

const styles = {
  page: { display: "flex", minHeight: "100vh", background: UI.bg, color: UI.text, fontFamily: "'Inter', sans-serif" },
  sidebar: { width: "280px", background: UI.sidebar, borderRight: `1px solid ${UI.border}`, display: "flex", flexDirection: "column", padding: "32px 20px", position: "fixed", height: "100vh", zIndex: 100 },
  sidebarBrand: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "44px" },
  logo: { width: "40px", height: "40px", background: UI.primary, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: "20px", fontWeight: "800", color: "#111", letterSpacing: "-0.5px" },
  sidebarNav: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  navItem: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: "transparent", border: "none", color: UI.textMuted, fontSize: "14px", fontWeight: "600", cursor: "pointer", textAlign: "left" },
  navItemActive: { background: UI.primarySoft, color: UI.primary },
  sidebarFooter: { marginTop: "auto", borderTop: `1px solid ${UI.border}`, paddingTop: "24px" },
  userInfo: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  avatar: { width: "40px", height: "40px", background: "#f1f5f9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" },
  userName: { fontSize: "14px", fontWeight: "700" },
  userRole: { fontSize: "11px", color: UI.textMuted },
  logoutBtn: { width: "100%", padding: "12px", background: "transparent", border: `1px solid ${UI.border}`, borderRadius: "10px", color: UI.danger, fontWeight: "600", cursor: "pointer" },
  
  main: { marginLeft: "280px", flex: 1, padding: "48px 64px" },
  pageHeader: { display: "flex", justifyContent: "space-between", marginBottom: "40px" },
  pageTitle: { fontSize: "32px", fontWeight: "850", letterSpacing: "-1.5px" },
  primaryBtn: { background: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center" },
  
  projectGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  projectCard: { background: UI.card, padding: "28px", borderRadius: "24px", border: `1px solid ${UI.border}`, cursor: "pointer" },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  cardTitle: { fontSize: "18px", fontWeight: "750", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardDesc: { 
    fontSize: "14px", 
    color: UI.textMuted, 
    lineHeight: "1.6", 
    display: "-webkit-box", 
    WebkitLineClamp: 3, 
    WebkitBoxOrient: "vertical", 
    overflow: "hidden",
    minHeight: "4.8em"
  },
  statusBadge: { fontSize: "10px", fontWeight: "800", textTransform: "uppercase", padding: "4px 8px", borderRadius: "6px" },
  
  detailHeaderWrap: { display: "flex", justifyContent: "space-between", marginBottom: "40px" },
  backBtnDetail: { background: "transparent", border: "none", color: UI.primary, fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
  detailTitleMain: { fontSize: "36px", fontWeight: "850", letterSpacing: "-1px" },
  detailActionsGroup: { display: "flex", gap: "12px" },
  ghostBtnRefined: { background: "#fff", border: `1px solid ${UI.border}`, padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
  primaryBtnRefined: { background: UI.primary, color: "white", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
  
  detailMainLayout: { display: "grid", gridTemplateColumns: "1fr 450px", gap: "40px" },
  cardRefined: { background: UI.card, padding: "32px", borderRadius: "28px", border: `1px solid ${UI.border}` },
  synthesisLanding: { 
    marginTop: "40px", 
    padding: "32px", 
    background: "#f8fafc", 
    borderRadius: "20px", 
    border: `1px dashed ${UI.border}`,
    textAlign: "center"
  },
  cardHeaderSmall: { fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: UI.textMuted, marginBottom: "16px" },
  cardBodyText: { fontSize: "16px", lineHeight: "1.7", color: "#334155" },
  
  aiPanelHeader: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  aiPanelTitle: { fontSize: "16px", fontWeight: "800" },
  aiTertiaryBtn: { background: "transparent", border: "none", color: UI.primary, fontWeight: "700" },
  crewUnitsList: { display: "flex", flexDirection: "column", gap: "20px" },
  crewUnitCard: { background: "#f8fafc", padding: "20px", borderRadius: "20px", border: `1px solid ${UI.border}` },
  unitHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: `1px solid ${UI.border}`, paddingBottom: "12px" },
  unitNameText: { fontSize: "16px", fontWeight: "700", color: UI.text },
  unitDropBtn: { background: "none", border: "none", color: UI.danger, cursor: "pointer", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  unitMembersGrid: { display: "flex", flexDirection: "column", gap: "8px" },
  memberPod: { 
    display: "flex", 
    alignItems: "center", 
    background: "#fff", 
    padding: "12px 16px", 
    borderRadius: "14px", 
    border: `1px solid ${UI.border}`,
    transition: "all 0.2s ease"
  },
  memberNamePod: { fontSize: "14px", fontWeight: "600", color: UI.text },
  memberSubPod: { fontSize: "11px", color: UI.textMuted, marginTop: "2px" },
  podActionBtn: { 
    background: "none", 
    border: "none", 
    color: UI.primary, 
    cursor: "pointer", 
    fontSize: "12px", 
    fontWeight: "600",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  addPodBtn: { 
    marginTop: "12px",
    padding: "12px",
    background: "#f8fafc",
    border: `1px dashed ${UI.border}`, 
    borderRadius: "12px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    cursor: "pointer",
    fontSize: "13px",
    color: UI.textMuted,
    fontWeight: "500"
  },
  confirmBtn: { width: "100%", marginTop: "24px", background: "#111", color: "white", padding: "14px", borderRadius: "12px", border: "none", fontWeight: "700" },
  
  miniEmpList: { marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  miniEmpItem: { 
    display: "flex", 
    alignItems: "center", 
    gap: "12px", 
    padding: "8px", 
    background: "#f8fafc", 
    borderRadius: "12px",
    border: "1px solid #f1f5f9"
  },
  miniEmpAvatar: { 
    width: "32px", 
    height: "32px", 
    borderRadius: "50%", 
    background: UI.primary, 
    color: "white", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontSize: "12px", 
    fontWeight: "bold" 
  },
  miniEmpName: { 
    fontSize: "13px", 
    fontWeight: "600", 
    color: UI.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  emptySidebarText: { fontSize: "13px", color: UI.textMuted, textAlign: "center", marginTop: "12px", fontStyle: "italic" },
  
  taskCard: { background: "#fff", padding: "20px", borderRadius: "16px", border: `1px solid ${UI.border}`, marginBottom: "12px", fontWeight: "700" },
  
  formWrap: { maxWidth: "600px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "700" },
  input: { padding: "12px", borderRadius: "10px", border: `1px solid ${UI.border}`, outline: "none" },
  
  errorBanner: { background: "#fef2f2", color: "#ef4444", padding: "16px", borderRadius: "12px", marginBottom: "24px", fontWeight: "600" },
  successBanner: { background: "#f0fdf4", color: "#10b981", padding: "16px", borderRadius: "12px", marginBottom: "24px", fontWeight: "600" },
  
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  employeeCardPremium: { background: "#fff", padding: "24px", borderRadius: "20px", border: `1px solid ${UI.border}` },
  empNameText: { fontWeight: "800", margin: 0 },

  chatDock: { position: "fixed", bottom: "30px", right: "30px", zIndex: 1000 },
  chatFab: { width: "56px", height: "56px", borderRadius: "16px", background: UI.text, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  chatPanel: { position: "absolute", bottom: "70px", right: 0, width: "340px", height: "480px", background: "#fff", borderRadius: "20px", boxShadow: "0 12px 32px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", border: `1px solid ${UI.border}`, overflow: "hidden" },
  chatPanelHeader: { padding: "16px", background: "#fafafa", borderBottom: `1px solid ${UI.border}`, fontWeight: "800", fontSize: "14px" },
  chatMessages: { flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" },
  chatMsgUser: { alignSelf: "flex-end", background: UI.primary, color: "#fff", padding: "10px 14px", borderRadius: "14px 14px 0 14px", fontSize: "13px" },
  chatMsgAi: { alignSelf: "flex-start", background: "#f1f5f9", color: "#333", padding: "10px 14px", borderRadius: "14px 14px 14px 0", fontSize: "13px" },
  chatInputRow: { padding: "16px", borderTop: `1px solid ${UI.border}` },
  chatInput: { width: "100%", padding: "10px", borderRadius: "10px", background: "#f8fafc", border: `1px solid ${UI.border}`, outline: "none" }
};
