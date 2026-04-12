// LandingPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ParticleBackground from "../components/ParticleBackground";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();

  const handleManagerClick = () => {
    if (user && dbUser?.role === "manager") navigate("/dashboard");
    else navigate("/login?role=manager");
  };

  const handleEmployeeClick = () => {
    if (user && dbUser?.role === "employee") navigate("/tasks");
    else navigate("/login?role=employee");
  };

  return (
    <div style={styles.page}>
      {/* ── Background ── */}
      <ParticleBackground />

      {/* ── Navbar ── */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <div style={styles.logo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <span style={styles.brandName}>AI Project Manager</span>
        </div>

        <div style={styles.navLinks}>
          <span style={styles.navLink}>Features</span>
          <span style={styles.navLink}>Company</span>
        </div>

        <button 
          style={styles.navBtn} 
          onClick={() => navigate(user ? (dbUser?.role === "manager" ? "/dashboard" : "/tasks") : "/login")}
        >
          {user ? "Go to Dashboard" : "Sign in"}
        </button>
      </nav>

      {/* ── Hero section ── */}
      <main style={styles.hero}>
        <div style={styles.badge}>
          <span style={styles.sparkle}>✨</span> Next-generation AI-powered management
        </div>

        <h1 style={styles.heading}>
          Manage projects smarter<br />
          <span style={styles.headingAccent}>with AI at the helm.</span>
        </h1>

        <p style={styles.subtext}>
          From intuitive employee matching to robust workflow generation. 
          Let AI handle the heavy lifting while you focus on what matters most.
        </p>

        <div style={styles.btnRow}>
          <button style={styles.primaryBtn} onClick={handleManagerClick}>
            Login as Project Head
          </button>
          <button style={styles.secondaryBtn} onClick={handleEmployeeClick}>
            Employee Dashboard
          </button>
        </div>
      </main>

      {/* ── Feature Cards ── */}
      <div style={styles.featuresSection}>
        <div style={styles.featureCard}>
          <h3 style={styles.featureTitle}>Intelligent</h3>
          <p style={styles.featureText}>AI-driven employee selection logic matching right people to projects.</p>
        </div>
        <div style={styles.featureCard}>
          <h3 style={styles.featureTitle}>Automated</h3>
          <p style={styles.featureText}>Task workflows are instantly generated, tracked, and synchronized.</p>
        </div>
        <div style={styles.featureCard}>
          <h3 style={styles.featureTitle}>Real-time</h3>
          <p style={styles.featureText}>Live project tracking and dynamic deadline adaptation systems.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  nav: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 80px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(252, 252, 252, 0.8)",
    backdropFilter: "blur(10px)",
  },
  navBrand: { display: "flex", alignItems: "center", gap: "10px" },
  logo: {
    width: "36px",
    height: "36px",
    background: "var(--primary)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(109, 93, 252, 0.3)",
  },
  brandName: { color: "#1a1a1a", fontWeight: "700", fontSize: "16px", letterSpacing: "-0.5px" },
  navLinks: { display: "flex", gap: "40px" },
  navLink: { color: "#666", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "color 0.2s" },
  navBtn: { 
    background: "#000", color: "#fff", border: "none", padding: "10px 24px", 
    borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer",
    transition: "transform 0.2s"
  },
  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 24px 60px",
    textAlign: "center",
    zIndex: 2,
  },
  badge: {
    background: "#fff",
    border: "1px solid #eee",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#a855f7",
    marginBottom: "36px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sparkle: { color: "#ffaa00" },
  heading: {
    fontSize: "72px",
    fontWeight: "800",
    color: "#111",
    lineHeight: "1.05",
    letterSpacing: "-3px",
    marginBottom: "24px",
  },
  headingAccent: {
    background: "linear-gradient(90deg, #6d5dfc 0%, #a855f7 50%, #ec4899 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtext: {
    fontSize: "19px",
    color: "#666",
    maxWidth: "540px",
    lineHeight: "1.6",
    fontWeight: "450",
    marginBottom: "48px",
  },
  btnRow: { display: "flex", gap: "16px" },
  primaryBtn: {
    background: "#111", color: "#fff", border: "none", padding: "18px 36px",
    borderRadius: "16px", fontSize: "16px", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)", transition: "transform 0.2s"
  },
  secondaryBtn: {
    background: "#f3f4f6", color: "#111", border: "none", padding: "18px 36px",
    borderRadius: "16px", fontSize: "16px", fontWeight: "600", cursor: "pointer",
    transition: "background 0.2s"
  },
  featuresSection: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    width: "100%",
    maxWidth: "1100px",
    padding: "0 40px 100px",
    zIndex: 2,
  },
  featureCard: {
    background: "#fff",
    padding: "48px 32px",
    borderRadius: "24px",
    border: "1px solid #f0f0f0",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
    transition: "transform 0.3s",
  },
  featureTitle: { color: "var(--primary)", fontSize: "24px", fontWeight: "800", marginBottom: "16px" },
  featureText: { color: "#666", fontSize: "15px", lineHeight: "1.6", fontWeight: "450" },
};