// AcceptInvitePage.jsx
// Public page that handles invite links from emails.
// Validates the token and redirects to login/register if not authenticated.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    validateInvite();
  }, []);

  const validateInvite = async () => {
    try {
      // Get token and projectId from URL query params
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const projId = params.get("projectId");

      if (!token || !projId) {
        setError("Invalid invite link. Missing required parameters.");
        setLoading(false);
        return;
      }

      // Call backend to validate the invite
      const response = await axios.get(
        `${API_URL}/api/invite/accept`,
        { params: { token, projectId: projId } }
      );

      if (response.data.valid) {
        setValid(true);
        setProjectTitle(response.data.projectTitle);
        setProjectId(projId);

        // Store projectId for after login/register
        localStorage.setItem("pendingProjectId", projId);

        // If already logged in, redirect immediately
        if (user) {
          navigate(`/employee/project/${projId}`);
        }
      } else {
        setError(response.data.message || "This invite link has expired or is invalid.");
      }
    } catch (err) {
      console.error("Invite validation failed:", err);
      setError(
        err.response?.data?.message ||
        "This invite link has expired or is invalid. Contact your manager for a new invite."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ color: "var(--accent-blue)", fontSize: "16px" }}>Validating invite...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="card" style={{ width: "100%", maxWidth: "480px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h2 className="h4" style={{ marginBottom: "12px" }}>Invalid or Expired Invite</h2>
          <p className="text-secondary" style={{ marginBottom: "24px" }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!valid) return null;

  // If user is logged in, they're being redirected, show loading
  if (user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ color: "var(--accent-blue)", fontSize: "16px" }}>Redirecting to project...</div>
      </div>
    );
  }

  // Not logged in - show login/register options
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "480px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
        <h2 className="h4" style={{ marginBottom: "12px" }}>You've Been Invited!</h2>
        <p style={{ color: "var(--accent-blue)", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>{projectTitle}</p>
        <p className="text-secondary" style={{ marginBottom: "24px" }}>
          You've been invited to join this project. Please login or create an account to continue.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login?role=employee")}
          >
            Login to my account
          </button>
          <button
            className="btn"
            style={{ border: "1px solid var(--accent-blue)", color: "var(--accent-blue)", background: "transparent" }}
            onClick={() => navigate("/register?role=employee")}
          >
            Create new account
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <span
            className="text-small"
            style={{ color: "var(--accent-blue)", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/")}
          >
            Back to home
          </span>
        </div>
      </div>
    </div>
  );
}

