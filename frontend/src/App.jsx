// App.jsx
// The router lives here — maps URLs to page components.
// BrowserRouter enables URL-based navigation.
// ProtectedRoute (below) redirects if user isn't logged in.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages — we create these next
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

// ProtectedRoute — wraps pages that need login
// If still loading → show a spinner (don't redirect yet!)
// If not logged in → redirect to /login
// If wrong role → redirect to their correct dashboard
function ProtectedRoute({ children, requiredRole }) {
  const { user, dbUser, loading, isManager, authError, refreshProfile, logout } = useAuth();

  // Still checking auth state — don't redirect yet
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0f0f",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ color: "#6d5dfc", fontSize: "16px" }}>Loading...</div>
      </div>
    );
  }

  // Not logged in at all
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but server fetch failed (e.g. disk space error)
  if (authError) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0f0f", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "20px", textAlign: "center"
      }}>
        <h2 style={{ color: "#ef4444" }}>⚠️ Connection Error</h2>
        <p style={{ maxWidth: "400px", color: "#aaa", marginBottom: "20px" }}>
          {authError}. This often happens if the server is busy or the database link is interrupted.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => refreshProfile()}
            style={{
              padding: "10px 20px", background: "#6d5dfc", color: "#fff", border: "none",
              borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            Retry Connection
          </button>
          <button 
            onClick={() => logout()}
            style={{
              padding: "10px 20px", background: "transparent", color: "#888", border: "1px solid #444",
              borderRadius: "8px", cursor: "pointer"
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Logged in but dbUser not loaded yet (still attempting)
  if (!dbUser) return null;

  // Wrong role trying to access the wrong dashboard
  if (requiredRole && dbUser.role !== requiredRole) {
    return <Navigate to={isManager ? "/dashboard" : "/tasks"} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — anyone can visit */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected: managers only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: employees only */}
        <Route
          path="/tasks"
          element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown URL → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
