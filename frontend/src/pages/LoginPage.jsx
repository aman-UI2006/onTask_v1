import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import DashboardIllustration from "../components/DashboardIllustration";

// BASE_URL for all API calls in this page
const API_BASE = "http://localhost:5000";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "employee";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gisStatus, setGisStatus] = useState("loading"); // loading, ready, error

  // Use CLIENT_ID placeholder as requested
  const GOOGLE_CLIENT_ID = "247709129581-71f9rdp47vur1ggd3ugr4432oic7dik9.apps.googleusercontent.com";

  useEffect(() => {
    // Check if script is already present
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      if (window.google) {
        initGoogle();
      } else {
        existingScript.onload = initGoogle;
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setGisStatus("error");
      console.error("Failed to load Google Identity Services script.");
    };
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, []);

  const initGoogle = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        itp_support: true,
        ux_mode: "popup" 
      });
      setGisStatus("ready");
    } else {
      setGisStatus("error");
    }
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError("");
    try {
      // Send token/credential to backend: POST http://localhost:5000/api/google-login
      const res = await axios.post(`${API_BASE}/api/google-login`, {
        token: response.credential
      });

      // Store user data and token in localStorage as session anchor
      localStorage.setItem("googleToken", response.credential);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate(res.data.user.role === "manager" ? "/dashboard" : "/tasks");
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleBtnClick = () => {
    if (gisStatus === "ready" && window.google) {
      setError("");
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn("Google Prompt not displayed:", reason);
          
          let userMessage = "Google sign-in is currently unavailable or suppressed by the browser.";
          if (reason === "request_denied") userMessage = "Google Sign-in denied. This usually means the current website URL is not authorized in the Google Cloud Console.";
          if (reason === "unregistered_origin") userMessage = "Origin not authorized. Please add your local URL (e.g., http://localhost:5173) to 'Authorized JavaScript origins' in the Google Cloud Console.";
          if (reason === "suppressed_by_user") userMessage = "Google Sign-in was dismissed. Please reload the page or clear cookies to try again.";
          if (reason === "opt_out_or_no_session") userMessage = "No Google session found. Please ensure you are logged into Google.";
          
          setError(`${userMessage} (Reason: ${reason})`);
        }
      });
    } else if (gisStatus === "loading") {
      setError("Google Login is still initializing. Please wait a moment.");
    } else {
      setError("Google Sign-in service failed to load. Please check your internet or browser settings.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Fetch the actual authoritative role from the backend
      const res = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      const actualRole = res.data.user.role;
      localStorage.setItem("user", JSON.stringify(res.data.user)); // Cache for UI

      // Authoritative redirect based on database role
      navigate(actualRole === "manager" ? "/dashboard" : "/tasks");
    } catch (err) {
      console.error("Login verification failed:", err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-frame">
        <div className="login-illustration slide-in-left">
          <DashboardIllustration />
        </div>

        <div className="login-form-container slide-in-right">
          <div className="login-form-card">
            <div style={styles.header}>
              <div style={styles.logo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <h1 style={styles.title}>Welcome to AI Project Manager</h1>
              <p style={styles.subtitle}>Sign in to your project workspace</p>
            </div>

            <div style={styles.trustBanner}>
              <LockIcon />
              <span>Your data is encrypted and secure</span>
            </div>

            <button style={styles.googleBtn} onClick={onGoogleBtnClick} disabled={loading}>
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine} />
            </div>

            <form onSubmit={handleLogin} style={styles.form}>
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
                  placeholder="Enter your password"
                  required
                  style={styles.input}
                />
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div style={styles.footer}>
              <span style={styles.footerText}>Don't have an account? </span>
              <span style={styles.link} onClick={() => navigate(`/register?role=${role}`)}>Register here</span>
            </div>

            <div style={styles.footerSmall}>
               <span style={styles.linkMinor} onClick={() => navigate("/")}>Back to home</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { textAlign: "center", marginBottom: "32px" },
  logo: {
    width: "48px",
    height: "48px",
    background: "#6366f1",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    boxShadow: "0 8px 16px rgba(99, 102, 241, 0.2)"
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-1px",
    margin: "0 0 8px",
    lineHeight: "1.2"
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0
  },
  trustBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#f0f9ff",
    color: "#0369a1",
    padding: "10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "24px",
    border: "1px solid #e0f2fe"
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "24px 0"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#f1f5f9"
  },
  dividerText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#334155" },
  input: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s"
  },
  error: { color: "#ef4444", fontSize: "13px", textAlign: "center", margin: 0 },
  submitBtn: {
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
  },
  footer: { textAlign: "center", marginTop: "24px" },
  footerSmall: { textAlign: "center", marginTop: "12px" },
  footerText: { color: "#64748b", fontSize: "13px" },
  link: { color: "#6366f1", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  linkMinor: { color: "#94a3b8", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }
};
