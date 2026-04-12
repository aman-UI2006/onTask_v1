import React, { useMemo } from "react";

export default function EmployeeTimeline({ tasks, accentColor = "var(--primary)" }) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Professional Roadmap</h2>
          <p style={styles.subtitle}>Your journey through project milestones</p>
        </div>
        <div style={styles.progressCard}>
          <div style={styles.progressInfo}>
            <span style={styles.progressValue}>{completionRate}%</span>
            <span style={styles.progressLabel}>Approved</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${completionRate}%`, background: accentColor }}></div>
          </div>
        </div>
      </div>

      <div style={styles.timelineWrapper}>
        <div style={styles.verticalLine}></div>
        <div style={styles.items}>
          {sortedTasks.map((task, idx) => {
            const isCompleted = task.status === 'completed';
            return (
              <div key={task._id} style={styles.item}>
                <div style={{ 
                  ...styles.dot, 
                  background: isCompleted ? '#10b981' : '#fff',
                  border: `2px solid ${isCompleted ? '#10b981' : '#ddd'}`,
                  color: isCompleted ? '#fff' : '#999'
                }}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div style={styles.content}>
                  <div style={styles.taskTitle}>{task.title}</div>
                  <p style={styles.taskDesc}>{task.description}</p>
                  <div style={styles.meta}>
                    <span style={{ 
                      ...styles.statusTag, 
                      background: isCompleted ? '#f0fdf4' : '#f9fafb',
                      color: isCompleted ? '#10b981' : '#666'
                    }}>
                      {isCompleted ? 'Manager Approved' : task.status?.replace('_', ' ')}
                    </span>
                    <span style={styles.date}>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {sortedTasks.length === 0 && (
             <div style={styles.empty}>No milestones tracked yet. Check back after project assignments.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", background: "#fff", borderRadius: "32px", border: "1px solid #eee", boxShadow: "var(--shadow)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "60px" },
  title: { fontSize: "24px", fontWeight: "800", color: "#111", margin: "0 0 8px" },
  subtitle: { fontSize: "14px", color: "#666", margin: 0 },
  progressCard: { background: "#f8faff", padding: "24px", borderRadius: "20px", border: "1px solid #e1e8ff", width: "240px" },
  progressInfo: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" },
  progressValue: { fontSize: "24px", fontWeight: "800", color: "var(--primary)" },
  progressLabel: { fontSize: "12px", color: "#666", fontWeight: "600" },
  progressBarBg: { height: "8px", background: "#eef1f6", borderRadius: "4px", overflow: "hidden" },
  progressBarFill: { height: "100%", transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" },
  
  timelineWrapper: { position: "relative", paddingLeft: "15px" },
  verticalLine: { position: "absolute", top: "10px", bottom: "10px", left: "28px", width: "2px", background: "#f0f0f0" },
  items: { display: "flex", flexDirection: "column", gap: "40px" },
  item: { display: "flex", gap: "32px", position: "relative", zIndex: 2 },
  dot: { 
    width: "32px", height: "32px", borderRadius: "50%", 
    display: "flex", alignItems: "center", justifyContent: "center", 
    fontSize: "12px", fontWeight: "800", flexShrink: 0,
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)"
  },
  content: { background: "#fff", padding: "24px 32px", borderRadius: "24px", border: "1px solid #f0f0f0", flex: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" },
  taskTitle: { fontSize: "18px", fontWeight: "700", color: "#111", marginBottom: "8px" },
  taskDesc: { fontSize: "14px", color: "#666", lineHeight: "1.6", marginBottom: "16px", margin: 0 },
  meta: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statusTag: { padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700" },
  date: { fontSize: "12px", color: "#999", fontWeight: "600" },
  empty: { color: "#999", fontStyle: "italic", padding: "80px 0", textAlign: "center" }
};
