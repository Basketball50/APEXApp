
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Profile.css";
import "./Dashboard.css"; 


import { auth } from "./firebase";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [fbUser, setFbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  
  const [status, setStatus] = useState({ type: "", text: "" });

  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u || null);
      setLoading(false);
      setStatus({ type: "", text: "" });
    });
    return () => unsub();
  }, []);

  const fullName = fbUser?.displayName || "—";
  const email = fbUser?.email || "—";

  const initials =
    fullName && fullName !== "—"
      ? fullName
          .split(" ")
          .slice(0, 2)
          .map((s) => s[0]?.toUpperCase())
          .join("")
      : email !== "—"
      ? email[0]?.toUpperCase()
      : "U";

  const requireUser = () => {
    if (!fbUser) {
      setStatus({ type: "error", text: "You’re logged out. Please sign in." });
      navigate("/auth");
      return false;
    }
    return true;
  };

  const clearStatusSoon = () =>
    setTimeout(() => setStatus({ type: "", text: "" }), 2500);


  const handleChangePassword = async () => {
    setStatus({ type: "", text: "" });
    if (!requireUser()) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus({ type: "error", text: "Please fill all password fields." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(fbUser, cred);
      await updatePassword(fbUser, newPassword);
      setStatus({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      clearStatusSoon();
    } catch (err) {
      setStatus({ type: "error", text: err?.message || "Could not update password." });
    }
  };

  const handleSendResetEmail = async () => {
    setStatus({ type: "", text: "" });
    if (!requireUser()) return;

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus({ type: "success", text: "Password reset email sent." });
      clearStatusSoon();
    } catch (err) {
      setStatus({ type: "error", text: err?.message || "Failed to send reset email." });
    }
  };

  const handleDeleteAccount = async () => {
    setStatus({ type: "", text: "" });
    if (!requireUser()) return;

    const ok = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!ok) return;

    try {
      if (currentPassword) {
        const cred = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(fbUser, cred);
      }
      await deleteUser(fbUser);
      setStatus({ type: "success", text: "Account deleted. Redirecting..." });
      navigate("/auth");
    } catch (err) {
      const needsReauth = (err?.code || "").includes("requires-recent-login");
      if (needsReauth && !currentPassword) {
        setStatus({
          type: "error",
          text: "Please enter your current password, then try deleting again.",
        });
      } else {
        setStatus({ type: "error", text: err?.message || "Failed to delete account." });
      }
    }
  };

  const TopBarAndSidebar = (
    <>
      <div className="dashboard-top-bar">
        <div
          className={`hamburger ${isSidebarOpen ? "open" : ""}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsSidebarOpen((v) => !v);
          }}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

     
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div
          className={`sidebar-tab ${location.pathname === "/dashboard" ? "active" : ""}`}
          onClick={() => {
            navigate("/dashboard");
            setIsSidebarOpen(false);
          }}
        >
          Home
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/profile" ? "active" : ""}`}
          onClick={() => {
            navigate("/profile");
            setIsSidebarOpen(false);
          }}
        >
          Profile
        </div>

        <div
          id="sidebar-start-session"
          className={`sidebar-tab ${location.pathname === "/trackingsetup" ? "active" : ""}`}
          onClick={() => {
            navigate("/trackingsetup");
            setIsSidebarOpen(false);
          }}
        >
          Start Session
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/performancestats" ? "active" : ""}`}
          onClick={() => {
            navigate("/performancestats");
            setIsSidebarOpen(false);
          }}
        >
          Performance Stats
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/focusguide" ? "active" : ""}`}
          onClick={() => {
            navigate("/focusguide");
            setIsSidebarOpen(false);
          }}
        >
          Focus Guide
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/guidedbreaks" ? "active" : ""}`}
          onClick={() => {
            navigate("/guidedbreaks");
            setIsSidebarOpen(false);
          }}
        >
          Guided Breaks
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div
        className="profile-container profile-bg"
        style={{ backgroundImage: "url('/ProfileBackground.png')" }}
      >
        {TopBarAndSidebar}
        <div className="profile-hero">
          <div className="profile-title gradient-text">Profile</div>
          <p className="profile-subtitle">Loading your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="profile-container profile-bg"
      style={{ backgroundImage: "url('/ProfileBackground.png')" }}
    >
      {TopBarAndSidebar}

     
      <div className="profile-hero">
        <div className="profile-title gradient-text">Profile</div>
        <p className="profile-subtitle">Manage your account, password, and security.</p>
      </div>

     
      {status.text ? (
        <div className={`profile-alert ${status.type === "error" ? "error" : "success"}`}>
          {status.text}
        </div>
      ) : null}

     
      <section className="profile-card">
        <div className="profile-card-header">
          <div className="avatar">{initials || "U"}</div>
          <div>
            <div className="card-name">{fullName}</div>
            <div className="card-email">{email}</div>
          </div>
        </div>
        <div className="profile-divider" />
        <div className="profile-card-grid">
          <div className="kv">
            <span className="kv-label">Status</span>
            <span className="kv-value">Signed in</span>
          </div>
          <div className="kv">
            <span className="kv-label">Auth Provider</span>
            <span className="kv-value">Firebase Email/Password</span>
          </div>
        </div>
      </section>

      
      <section className="profile-section glass">
        <h2 className="section-title">Change Password</h2>
        <div className="form-grid">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="button-row">
          <button className="btn primary" onClick={handleChangePassword}>
            Update Password
          </button>
          <button className="btn ghost" onClick={handleSendResetEmail}>
            Send Reset Email
          </button>
        </div>
      </section>

     
      <section className="profile-section glass danger">
        <div className="danger-header">
          <h2 className="section-title">Danger Zone</h2>
          <span className="pill pill-danger">Irreversible</span>
        </div>
        <p className="danger-text">
          Permanently delete your account and all associated data.
        </p>
        <div className="danger-grid">
          <input
            type="password"
            placeholder="Enter current password to confirm"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button className="btn danger-btn" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
