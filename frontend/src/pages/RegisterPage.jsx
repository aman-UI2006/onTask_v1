// RegisterPage.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

const AVAILABLE_SKILLS = [
  "React", "Node.js", "MongoDB", "Python", "JavaScript",
  "TypeScript", "Express", "Firebase", "AWS", "Docker",
  "PostgreSQL", "MySQL", "GraphQL", "REST APIs", "UI/UX Design",
  "Machine Learning", "Data Analysis", "DevOps", "Testing", "Git",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "employee";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (role === "employee" && selectedSkills.length === 0) return setError("Please select at least one skill.");

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        { name, role, department, skills: role === "employee" ? selectedSkills : [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(role === "manager" ? "/dashboard" : "/tasks");
    } catch (err) {
      console.error("Register error:", err);
      setError("Registration failed. Email might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Left Side: Illustration ── */}
      <div style={styles.promoSide}>
        <div style={styles.promoContent}>
          <div style={styles.floatingBadges}>
            <div style={styles.floatBadge}>🚀 Get Started</div>
            <div style={styles.floatBadge}>✨ AI Enabled</div>
          </div>
          <img 
            src="/saas_login_illustration_1775945255442.png" 
            alt="SaaS Illustration" 
            style={styles.illustration}
          />
        </div>
      </div>

      {/* ── Right Side: Form ── */}
      <div style={styles.formSide}>
        <div style={styles.card}>
          <div style={styles.logoRow}>
            <div style={styles.logo}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
          </div>

          <h1 style={styles.title}>Join AI Project Manager</h1>
          <p style={styles.subtitle}>Create your {role} account to get started</p>

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aman Sharma"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                style={styles.input}
              />
            </div>

            {role === "employee" && (
              <div style={styles.field}>
                <label style={styles.label}>Your skills <span style={styles.labelHint}>— match projects</span></label>
                <div style={styles.skillsGrid}>
                  {AVAILABLE_SKILLS.map((skill) => {
                    const selected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        style={{
                          ...styles.skillBtn,
                          background: selected ? "var(--primary)" : "#f5f5f5",
                          color: selected ? "#fff" : "#666",
                          border: selected ? "none" : "1px solid #eee"
                        }}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div style={styles.footer}>
            <span style={styles.footerText}>Already have an account? </span>
            <span style={styles.link} onClick={() => navigate(`/login?role=${role}`)}>
              Sign in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", background: "#fff", fontFamily: "'Inter', sans-serif" },
  promoSide: { 
    flex: 1, background: "#f8fafd", display: "flex", 
    alignItems: "center", justifyContent: "center", padding: "60px",
    "@media (max-width: 900px)": { display: "none" } 
  },
  promoContent: { width: "100%", maxWidth: "540px", position: "relative" },
  floatingBadges: { position: "absolute", top: "-20px", left: "0", display: "flex", gap: "10px" },
  floatBadge: { 
    padding: "6px 12px", background: "#fff", borderRadius: "12px", 
    fontSize: "12px", fontWeight: "600", color: "var(--primary)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  illustration: { width: "100%", height: "auto", objectFit: "contain" },
  formSide: { flex: 1.2, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 60px" },
  card: { width: "100%", maxWidth: "500px" },
  logoRow: { marginBottom: "32px" },
  logo: {
    width: "48px", height: "48px", background: "var(--primary)",
    borderRadius: "14px", display: "flex", alignItems: "center",
    justifyContent: "center", boxShadow: "0 8px 16px rgba(109, 93, 252, 0.25)"
  },
  title: { fontSize: "28px", fontWeight: "800", color: "#111", marginBottom: "8px", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "#666", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#444" },
  labelHint: { fontSize: "11px", color: "#999", fontWeight: "400" },
  input: { 
    width: "100%", padding: "11px 16px", borderRadius: "12px", border: "1px solid #eee",
    background: "#f9f9f9", fontSize: "14px", outline: "none"
  },
  skillsGrid: { display: "flex", flexWrap: "wrap", gap: "6px" },
  skillBtn: { padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" },
  submitBtn: {
    width: "100%", padding: "14px", background: "#000", color: "#fff",
    border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700",
    cursor: "pointer", marginTop: "10px"
  },
  error: { color: "#f87171", fontSize: "13px", textAlign: "center", margin: 0 },
  footer: { textAlign: "center", marginTop: "24px" },
  footerText: { color: "#888", fontSize: "14px" },
  link: { color: "var(--primary)", fontWeight: "600", cursor: "pointer" }
};
