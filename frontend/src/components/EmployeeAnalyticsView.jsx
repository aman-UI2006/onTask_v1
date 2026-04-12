import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export default function EmployeeAnalyticsView() {
  const [stats, setStats] = useState({
    taskCompletion: [],
    skillDistribution: []
  });

  useEffect(() => {
    setStats({
      taskCompletion: [
        { month: "Jan", completed: 4 },
        { month: "Feb", completed: 7 },
        { month: "Mar", completed: 5 },
        { month: "Apr", completed: 9 },
      ],
      skillDistribution: [
        { name: "Frontend", value: 40 },
        { name: "Backend", value: 30 },
        { name: "DevOps", value: 15 },
        { name: "Testing", value: 15 },
      ]
    });
  }, []);

  const COLORS = ["var(--primary)", "#10b981", "#f59e0b", "#6366f1"];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Personal Performance</h1>
        <p style={styles.subtitle}>Insights into your work cycles and skill growth</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Activity Velocity</h3>
          <p style={styles.cardSubtitle}>Tasks completed over recent months</p>
          <div style={{ height: "300px", marginTop: "24px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.taskCompletion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f5f5ff' }}
                />
                <Bar dataKey="completed" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Impact Distribution</h3>
          <p style={styles.cardSubtitle}>How you contribute to project success</p>
          <div style={{ height: "300px", marginTop: "24px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.skillDistribution}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.skillDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.legend}>
            {stats.skillDistribution.map((s, i) => (
              <div key={i} style={styles.legendItem}>
                <span style={{...styles.dot, backgroundColor: COLORS[i % COLORS.length]}}></span>
                <span style={styles.legendText}>{s.name}</span>
                <span style={styles.legendValue}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px 0" },
  header: { marginBottom: "40px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#111", margin: "0 0 8px" },
  subtitle: { fontSize: "16px", color: "#666", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" },
  card: { background: "#fff", padding: "32px", borderRadius: "32px", border: "1px solid #eee", boxShadow: "var(--shadow)" },
  cardTitle: { fontSize: "18px", fontWeight: "800", color: "#111", margin: "0 0 4px" },
  cardSubtitle: { fontSize: "13px", color: "#888", fontWeight: "600", margin: 0 },
  legend: { marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  legendItem: { display: "flex", alignItems: "center", gap: "10px", background: "#f9fafb", padding: "12px 16px", borderRadius: "14px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  legendText: { fontSize: "13px", fontWeight: "700", color: "#444", flex: 1 },
  legendValue: { fontSize: "13px", fontWeight: "800", color: "#111" }
};
