import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Dashboard.css";

function StatCard({ title, value, hint }) {
  return (
    <div className="glass card stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

function formatWhen(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [focusGuides, setFocusGuides] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  const loadData = () => {
    try {
      const sess = JSON.parse(localStorage.getItem("sessions") || "[]");
      const brks = JSON.parse(localStorage.getItem("breaks") || "[]");
      const fgs = JSON.parse(localStorage.getItem("focusGuides") || "[]");
      const fxs = JSON.parse(localStorage.getItem("focusSessions") || "[]");
      setSessions(Array.isArray(sess) ? sess : []);
      setBreaks(Array.isArray(brks) ? brks : []);
      setFocusGuides(Array.isArray(fgs) ? fgs : []);
      setFocusSessions(Array.isArray(fxs) ? fxs : []);
    } catch {
      setSessions([]);
      setBreaks([]);
      setFocusGuides([]);
      setFocusSessions([]);
    }
  };

  useEffect(() => {
    loadData();
    const onStorage = (e) => {
      if (["sessions", "breaks", "focusGuides", "focusSessions"].includes(e.key)) {
        loadData();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const {
    totalSessions,
    breaksTaken,
    focusSessionsCount,
    avgFocusPercent,
    avgPostureScore,
    recentSessions,
    lastSessionWhen,
  } = useMemo(() => {
    const totalSessions = sessions.length;
    const breaksTaken = breaks.length;
    const focusSessionsFromTracking = sessions.filter((s) =>
      (s?.selectedOption || "").toLowerCase().includes("focus")
    ).length;
    const focusSessionsCount =
      focusSessionsFromTracking + (focusGuides?.length || 0) + (focusSessions?.length || 0);
    const focusPercents = sessions
      .filter((s) => (s?.selectedOption || "").toLowerCase().includes("focus"))
      .map((s) => s?.focusStats?.percent)
      .filter((p) => typeof p === "number" && !Number.isNaN(p));
    const avgFocusPercent =
      focusPercents.length > 0
        ? Math.round(
            focusPercents.reduce((a, b) => a + b, 0) / focusPercents.length
          )
        : null;
    const postureVals = sessions
      .map((s) => {
        const v = s?.postureAvg;
        if (typeof v !== "number" || Number.isNaN(v)) return null;
        return v <= 1 ? v * 10 : v;
      })
      .filter((v) => v != null);
    const avgPostureScore =
      postureVals.length > 0
        ? (postureVals.reduce((a, b) => a + b, 0) / postureVals.length).toFixed(1)
        : null;
    const recentSessions = [...sessions].reverse().slice(0, 5);
    const lastSessionWhen = sessions.length
      ? formatWhen(sessions[sessions.length - 1]?.timestamp)
      : "—";
    return {
      totalSessions,
      breaksTaken,
      focusSessionsCount,
      avgFocusPercent,
      avgPostureScore,
      recentSessions,
      lastSessionWhen,
    };
  }, [sessions, breaks, focusGuides, focusSessions]);

  return (
    <div
      className="dashboard-container dashboard-bg"
      style={{ backgroundImage: `url('/DashboardBackground.png')` }}
    >
      <div className="dashboard-top-bar">
        <div
          className={`hamburger ${isSidebarOpen ? "open" : ""}`}
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleSidebar();
          }}
        >
          <div></div><div></div><div></div>
        </div>
      </div>

      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div
          className={`sidebar-tab ${
            location.pathname === "/dashboard" || location.pathname === "/"
              ? "active"
              : ""
          }`}
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

      <main className="dashboard-main">
        <header className="dash-hero">
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            Track your posture & focus, review performance, and keep your streak alive.
          </p>
          <div className="dash-actions">
            <button
              id="start-session-btn"
              className="btn primary large"
              onClick={() => navigate("/trackingsetup")}
            >
              Start Session
            </button>
          </div>

          <div className="streak-row">
            <div className="pill pill-gradient">Current Streak: 0 days</div>
            <div className="pill pill-soft">Last Session: {lastSessionWhen}</div>
          </div>
        </header>

        {location.pathname === "/dashboard" || location.pathname === "/" ? (
          <>
            <section className="cards-grid">
              <StatCard
                title="Total Sessions"
                value={totalSessions || "—"}
                hint={totalSessions ? undefined : "Complete your first session to see stats."}
              />
              <StatCard
                title="Breaks Taken"
                value={breaksTaken || 0}
                hint="Includes Guided Breaks"
              />
              <StatCard
                title="Focus Sessions Complete"
                value={focusSessionsCount || 0}
                hint="Tracking + Focus Games"
              />
              <StatCard
                title="Focus Score (Avg)"
                value={avgFocusPercent != null ? `${avgFocusPercent}%` : "—"}
                hint={avgFocusPercent != null ? "Avg focus across sessions" : "No focus data yet"}
              />
              <StatCard
                title="Posture Score (Avg)"
                value={avgPostureScore != null ? `${avgPostureScore}/10` : "—"}
                hint={avgPostureScore != null ? "Avg posture across sessions" : "No posture data yet"}
              />
            </section>

            <section className="glass card recent-card">
              <div className="recent-head">
                <h2>Recent Activity</h2>
              </div>

              {([...sessions].reverse().slice(0,5)).length === 0 ? (
                <div className="recent-empty">
                  <div className="empty-title">No data yet</div>
                  <div className="empty-subtitle">
                    Start your first session to see performance summaries here.
                  </div>
                  <button
                    id="start-session-btn-2"
                    className="btn primary"
                    onClick={() => navigate("/trackingsetup")}
                  >
                    Start Session
                  </button>
                </div>
              ) : (
                <div className="recent-list">
                  {[...sessions].reverse().slice(0, 5).map((s, idx) => {
                    const hasFocus = (s?.selectedOption || "").toLowerCase().includes("focus");
                    const hasPosture = (s?.selectedOption || "").toLowerCase().includes("posture");
                    const focusP = s?.focusStats?.percent;
                    const posture10 =
                      typeof s?.postureAvg === "number"
                        ? s.postureAvg <= 1 ? +(s.postureAvg * 10).toFixed(1) : +s.postureAvg.toFixed(1)
                        : null;

                    return (
                      <div className="recent-row" key={idx}>
                        <div className="recent-meta">
                          <div className="recent-when">{formatWhen(s?.timestamp)}</div>
                          <div className="recent-tags">
                            {hasFocus && <span className="tag">Focus</span>}
                            {hasPosture && <span className="tag">Posture</span>}
                            <span className="tag-accent tag">Duration: {s?.selectedTime || "—"}</span>
                          </div>
                        </div>

                        <div className="recent-metrics">
                          {hasFocus && (
                            <div className="recent-chip">
                              <div className="chip-label">Focus</div>
                              <div className="chip-main">
                                <span className="chip-strong">{typeof focusP === "number" ? `${focusP}%` : "—"}</span>
                                <span className="chip-sub">
                                  On {Math.round(s?.focusStats?.focused || 0)}s · Away {Math.round(s?.focusStats?.unfocused || 0)}s
                                </span>
                              </div>
                            </div>
                          )}
                          {hasPosture && (
                            <div className="recent-chip">
                              <div className="chip-label">Posture</div>
                              <div className="chip-main">
                                <span className="chip-strong">
                                  {posture10 != null ? `${posture10}/10` : "—"}
                                </span>
                                <span className="chip-sub">Average posture score</span>
                              </div>
                            </div>
                          )}

                          {s?.coaching && (
                            <div className="recent-chip coaching">
                              <div className="chip-label">Advanced Coaching</div>
                              <div className="coaching-badges">
                                {"fatigueScore" in s.coaching && (
                                  <span className="badge">Fatigue {Math.round(s.coaching.fatigueScore)}/10</span>
                                )}
                                {"stressScore" in s.coaching && (
                                  <span className="badge">Stress {Math.round(s.coaching.stressScore)}/10</span>
                                )}
                                {"blinkRateMin" in s.coaching && (
                                  <span className="badge">Blinks {Math.round(s.coaching.blinkRateMin)}/min</span>
                                )}
                                {"perclos" in s.coaching && (
                                  <span className="badge">PERCLOS {(s.coaching.perclos * 100).toFixed(0)}%</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
