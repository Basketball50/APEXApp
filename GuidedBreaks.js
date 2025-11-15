
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./GuidedBreaks.css";

export default function GuidedBreaks() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const openExtensionPopup = () => {
  };


  const logBreakAndGo = (label, to) => {
    try {
      const raw = localStorage.getItem("breaks");
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({
        label,
        timestamp: Date.now(),
        source: "guided-breaks",
      });
      localStorage.setItem("breaks", JSON.stringify(arr));
    } catch {}
    navigate(to);
  };

  return (
    <div
      className="guided-breaks"
      style={{
        backgroundColor: "black",
        backgroundImage: `url('/BreaksBackground.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        padding: "40px",
        color: "white",
      }}
    >
     
      <div className="dashboard-top-bar">
        <div
          className={`hamburger ${isSidebarOpen ? "open" : ""}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" ? setIsSidebarOpen(!isSidebarOpen) : null)}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

   
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div
          className={`sidebar-tab ${location.pathname === "/dashboard" ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          Home
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/profile" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          Profile
        </div>

        
        <div
          id="sidebar-start-session"
          className="sidebar-tab"
          onClick={() => navigate("/trackingsetup")}
        >
          Start Session
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/performancestats" ? "active" : ""}`}
          onClick={() => navigate("/performancestats")}
        >
          Performance Stats
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/focusguide" ? "active" : ""}`}
          onClick={() => navigate("/focusguide")}
        >
          Focus Guide
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/guidedbreaks" ? "active" : ""}`}
          onClick={() => navigate("/guidedbreaks")}
        >
          Guided Breaks
        </div>
      </div>

     
      <header className="gb-hero glass">
        <h1 className="gb-title">Guided Breaks</h1>
        <p className="gb-subtitle">
          Short science-backed micro-breaks to reset your mind, relax your body, and restore focus.
        </p>
        <div className="gb-hero-pills">
          <span className="pill pill-soft">2–5 min</span>
          <span className="pill pill-soft">Audio-friendly</span>
          <span className="pill pill-soft">Desk-ready</span>
        </div>
      </header>

      
      <section className="break-grid">
        
        <div
          className="break-card glass link-reset"
          role="button"
          tabIndex={0}
          onClick={() => logBreakAndGo("Box Breathing", "/boxbreathing")}
          onKeyDown={(e) => e.key === "Enter" && logBreakAndGo("Box Breathing", "/boxbreathing")}
        >
          <div className="break-icon">🫁</div>
          <div className="break-info">
            <h2>Box Breathing</h2>
            <p>
              Inhale • hold • exhale • hold—equal counts to calm your nervous
              system and recenter quickly.
            </p>
            <div className="break-meta">
              <span className="pill">~3 min</span>
              <span className="pill">Stress down</span>
            </div>
          </div>
        </div>

       
        <div
          className="break-card glass link-reset"
          role="button"
          tabIndex={0}
          onClick={() => logBreakAndGo("Progressive Muscle Relaxation", "/pmr")}
          onKeyDown={(e) => e.key === "Enter" && logBreakAndGo("Progressive Muscle Relaxation", "/pmr")}
        >
          <div className="break-icon">🧘‍♂️</div>
          <div className="break-info">
            <h2>Progressive Muscle Relaxation</h2>
            <p>
              Tense and release each muscle group to reduce tension and reset
              your baseline.
            </p>
            <div className="break-meta">
              <span className="pill">~4 min</span>
              <span className="pill">Full-body</span>
            </div>
          </div>
        </div>

        
        <div
          className="break-card glass link-reset"
          role="button"
          tabIndex={0}
          onClick={() => logBreakAndGo("Mindful Stretching", "/mindfulstretching")}
          onKeyDown={(e) => e.key === "Enter" && logBreakAndGo("Mindful Stretching", "/mindfulstretching")}
        >
          <div className="break-icon">🧍‍♀️</div>
          <div className="break-info">
            <h2>Mindful Stretching</h2>
            <p>
              Light neck, shoulder, and spine stretches with breath to improve
              posture and ease strain.
            </p>
            <div className="break-meta">
              <span className="pill">~5 min</span>
              <span className="pill">Posture+</span>
            </div>
          </div>
        </div>

        
        <div
          className="break-card glass"
          role="button"
          tabIndex={0}
          onClick={() => logBreakAndGo("Guided Visualization", "/guidedbreaks")}
          onKeyDown={(e) => e.key === "Enter" && logBreakAndGo("Guided Visualization", "/guidedbreaks")}
        >
          <div className="break-icon">🌄</div>
          <div className="break-info">
            <h2>Guided Visualization</h2>
            <p>
              Close your eyes and picture a calm scene. Visualization reduces
              anxiety and restores focus.
            </p>
            <div className="break-meta">
              <span className="pill">~3 min</span>
              <span className="pill">Calming</span>
            </div>
          </div>
        </div>
      </section>

   
      <footer className="gb-footer glass">
        <div className="footer-left">
          <div className="footer-title">Need a break later?</div>
          <div className="footer-subtitle">Start a session anytime to trigger a smart break.</div>
        </div>
        <button id="start-session-btn" className="btn primary" onClick={() => navigate("/trackingsetup")}>
          Start Session
        </button>
      </footer>
    </div>
  );
}

