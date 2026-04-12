import { useState, useEffect, useMemo } from "react";
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { fetchProjects, fetchTasksByProject } from "../api/projects";
import ChartErrorBoundary from "./ChartErrorBoundary";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#64748b'];

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const paths = {
    chevronLeft: "M15 18l-6-6 6-6",
    analytics: "M18 20V10 M12 20V4 M6 20V14",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z"
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
      <path d={paths[name] || ""} />
    </svg>
  );
};

export default function AnalyticsView({ projectId, onBack }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectId) setSelectedProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    if (selectedProjectId) loadProjectData(selectedProjectId);
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      const projectList = Array.isArray(data) ? data : [];
      setProjects(projectList);
      if (!selectedProjectId && projectList.length > 0) {
        setSelectedProjectId(projectList[0]._id);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const loadProjectData = async (id) => {
    setLoading(true);
    try {
      const taskData = await fetchTasksByProject(id);
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (err) {
      console.error("Failed to load project tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const uniqueEmployees = new Set(tasks.map(t => t.assignedTo?._id).filter(Boolean)).size;
    const workload = uniqueEmployees > 0 ? (total / uniqueEmployees).toFixed(1) : 0;
    
    const categoryMap = { 'Frontend/UI': 0, 'Backend/API': 0, 'DevOps/DB': 0, 'General': 0 };
    tasks.forEach(t => {
      const title = t.title.toLowerCase();
      if (title.includes('ui') || title.includes('ux') || title.includes('frontend')) categoryMap['Frontend/UI']++;
      else if (title.includes('api') || title.includes('backend') || title.includes('node')) categoryMap['Backend/API']++;
      else if (title.includes('db') || title.includes('mongo') || title.includes('deploy')) categoryMap['DevOps/DB']++;
      else categoryMap['General']++;
    });

    const categoryData = Object.keys(categoryMap)
      .filter(key => categoryMap[key] > 0)
      .map(key => ({ name: key, value: categoryMap[key] }));

    const resourceMap = {};
    tasks.forEach(t => {
      const name = t.assignedTo?.name || "Unassigned";
      resourceMap[name] = (resourceMap[name] || 0) + 1;
    });
    const resourceData = Object.keys(resourceMap).map(name => ({ name, tasks: resourceMap[name] }));

    return { total, completed, uniqueEmployees, workload, categoryData, resourceData };
  }, [tasks]);

  const risk = useMemo(() => {
    const score = metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0;
    if (score > 70) return { label: "EXCELLENT", color: "#10b981" };
    if (score > 30) return { label: "ON TRACK", color: "#6366f1" };
    return { label: "EARLY STAGE", color: "#64748b" };
  }, [metrics]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {onBack && (
            <button style={styles.backBtn} onClick={onBack}>
              <Icon name="chevronLeft" size={14} /> Back to Project
            </button>
          )}
          <h1 style={styles.title}>Project Intelligence</h1>
          <p style={styles.subtitle}>Analyzing operational DNA and resource velocity</p>
        </div>
        <select style={styles.select} value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Compiling project metrics...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={styles.emptyState}>No activity recorded for this initiative.</div>
      ) : (
        <div style={styles.content}>
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Total Task Surface</span>
              <span style={styles.statValue}>{metrics.total}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Personnel Reach</span>
              <span style={styles.statValue}>{metrics.uniqueEmployees} Units</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Workload Density</span>
              <span style={styles.statValue}>{metrics.workload} Avg</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>System Health</span>
              <span style={{ ...styles.statValue, color: risk.color }}>{risk.label}</span>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardHeader}>Technical Distribution</h3>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={metrics.categoryData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      {metrics.categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={styles.tooltip} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardHeader}>Resource Velocity</h3>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metrics.resourceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={styles.tooltip} />
                    <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>

            <div style={{ ...styles.card, gridColumn: "span 2" }}>
              <h3 style={styles.cardHeader}>Operational Timeline</h3>
              <div style={styles.timelineWrapper}>
                <div style={styles.timelineHorizontal}>
                  <div style={styles.timelineTrack}></div>
                  {tasks.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map((t, idx) => (
                    <div key={t._id} style={styles.timelineStep}>
                      <div style={{ 
                        ...styles.timelinePoint, 
                        background: t.status === 'completed' ? '#10b981' : '#f1f5f9',
                        color: t.status === 'completed' ? '#fff' : '#64748b',
                        border: t.status === 'completed' ? 'none' : '2px solid #e2e8f0'
                      }}>
                        {t.status === 'completed' ? '✓' : idx + 1}
                      </div>
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineTaskName}>{t.title}</div>
                        <div style={{ ...styles.timelineTaskStatus, color: t.status === 'completed' ? '#10b981' : '#94a3b8' }}>
                          {t.status?.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const UI = {
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  primary: "#6366f1"
};

const styles = {
  container: { padding: "48px 64px", background: UI.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" },
  title: { fontSize: "32px", fontWeight: "850", margin: 0, letterSpacing: "-1.5px", color: UI.text },
  subtitle: { color: UI.textMuted, fontSize: "15px", fontWeight: "500" },
  select: { padding: "12px 20px", borderRadius: "12px", border: `1px solid ${UI.border}`, fontWeight: "700", outline: "none", cursor: "pointer", background: "#fff" },
  backBtn: { background: "transparent", border: "none", color: UI.primary, fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 },
  
  content: { display: "flex", flexDirection: "column", gap: "32px" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" },
  statCard: { background: "#fff", padding: "32px", borderRadius: "24px", border: `1px solid ${UI.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
  statLabel: { fontSize: "11px", color: UI.textMuted, fontWeight: "800", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "1px" },
  statValue: { fontSize: "24px", fontWeight: "850", color: UI.text },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  card: { background: "#fff", padding: "32px", borderRadius: "28px", border: `1px solid ${UI.border}` },
  cardHeader: { fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: UI.textMuted, marginBottom: "24px", borderBottom: `1px solid #f1f5f9`, paddingBottom: "16px" },
  
  loadingState: { textAlign: "center", padding: "120px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #f1f5f9", borderTopColor: UI.primary, borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" },
  emptyState: { textAlign: "center", padding: "80px", background: "#fff", borderRadius: "24px", border: `1px solid ${UI.border}`, color: UI.textMuted },
  tooltip: { backgroundColor: "#fff !important", borderRadius: "12px", border: "none !important", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "700" },

  timelineWrapper: { overflowX: "auto", paddingBottom: "20px", marginTop: "10px" },
  timelineHorizontal: { display: "inline-flex", padding: "0 20px", minWidth: "100%", position: "relative", gap: "80px" },
  timelineTrack: { position: "absolute", top: "24px", left: "40px", right: "40px", height: "2px", background: "#f1f5f9" },
  timelineStep: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", minWidth: "180px", position: "relative", zIndex: 2 },
  timelinePoint: { width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800" },
  timelineContent: { textAlign: "center" },
  timelineTaskName: { fontSize: "14px", fontWeight: "750", color: UI.text, marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" },
  timelineTaskStatus: { fontSize: "10px", fontWeight: "850", textTransform: "uppercase", letterSpacing: "0.5px" }
};
