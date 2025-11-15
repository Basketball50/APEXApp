
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./FocusGuide.css";

export default function FocusGuide() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="focus-guide-container"
      style={{ backgroundImage: "url('/FocusBackground.png')" }}
    >
      <div className="dashboard-top-bar">
        <div
          className={`hamburger ${isSidebarOpen ? "open" : ""}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation"
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" ? setIsSidebarOpen(!isSidebarOpen) : null
          }
        >
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>


      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div
          className={`sidebar-tab ${location.pathname === "/dashboard" ? "active" : ""}`}
          onClick={() => { navigate("/dashboard"); setIsSidebarOpen(false); }}
        >
          Home
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/profile" ? "active" : ""}`}
          onClick={() => { navigate("/profile"); setIsSidebarOpen(false); }}
        >
          Profile
        </div>

        <div
          id="sidebar-start-session"
          className={`sidebar-tab ${location.pathname === "/trackingsetup" ? "active" : ""}`}
          onClick={() => { navigate("/trackingsetup"); setIsSidebarOpen(false); }}
        >
          Start Session
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/performancestats" ? "active" : ""}`}
          onClick={() => { navigate("/performancestats"); setIsSidebarOpen(false); }}
        >
          Performance Stats
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/focusguide" ? "active" : ""}`}
          onClick={() => { navigate("/focusguide"); setIsSidebarOpen(false); }}
        >
          Focus Guide
        </div>

        <div
          className={`sidebar-tab ${location.pathname === "/guidedbreaks" ? "active" : ""}`}
          onClick={() => { navigate("/guidedbreaks"); setIsSidebarOpen(false); }}
        >
          Guided Breaks
        </div>
      </div>

      <header className="fg-hero glass">
        <h1 className="fg-title">Focus Guide</h1>
        <p className="fg-subtitle">
          Evidence-based drills to train attention systems—working memory, vigilance, and selective focus.
        </p>
        <div className="fg-hero-pills">
          <span className="pill pill-soft">Cognitive training</span>
          <span className="pill pill-soft">1–2 min</span>
          <span className="pill pill-soft">Desk-friendly</span>
        </div>
      </header>

      <section className="focus-grid">
        <Link to="/dualnback" className="focus-card glass link-reset">
          <div className="focus-icon">🧠</div>
          <div className="focus-info">
            <h2>Dual N-Back</h2>
            <p>
              Recall auditory + visual positions from <em>n</em> steps back to
              increase working memory and sustained attention.
            </p>
            <div className="focus-meta">
              <span className="pill">~2 min</span>
              <span className="pill">Working memory</span>
            </div>
          </div>
        </Link>

        <Link to="/selectivepick" className="focus-card glass link-reset">
          <div className="focus-icon">🔺</div>
          <div className="focus-info">
            <h2>Selective Pick</h2>
            <p>
              Click only the <strong>white triangles</strong> while ignoring other falling shapes and colors.
              Trains selective attention and response inhibition.
            </p>
            <div className="focus-meta">
              <span className="pill">~1 min</span>
              <span className="pill">Selective attention</span>
            </div>
          </div>
        </Link>

        <Link to="/multipleobject" className="focus-card glass link-reset">
          <div className="focus-icon">🎯</div>
          <div className="focus-info">
            <h2>Moving Object Tracking</h2>
            <p>
              Track a moving target while ignoring distractors to train
              selective and divided attention.
            </p>
            <div className="focus-meta">
              <span className="pill">~1 min</span>
              <span className="pill">Sustained Focus</span>
            </div>
          </div>
        </Link>

        <Link to="/sustainedattention" className="focus-card glass link-reset">
          <div className="focus-icon">⏱️</div>
          <div className="focus-info">
            <h2>Sustained Attention</h2>
            <p>
              Respond only to the target stimulus across long intervals to
              boost vigilance and reduce lapses.
            </p>
            <div className="focus-meta">
              <span className="pill">~2 min</span>
              <span className="pill">Vigilance</span>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
