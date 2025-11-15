import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PerformanceStats.css";

const BREAK_TYPES = [
  "Box Breathing",
  "PMR",
  "Mindful Stretching",
  "Guided Visualization",
];

const FOCUS_SESSION_TYPES = [
  "Dual N-Back",
  "Selective Pick",
  "Moving Object Tracking",
  "Sustained Attention",
];

function safeParseLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
function fmtDate(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function groupByCalendarWeek(sessions) {
  const map = new Map();
  for (const s of sessions) {
    const d = new Date(s.timestamp || 0);
    const y = d.getFullYear();
    const weekOfMonth = Math.floor((d.getDate() - 1) / 7) + 1;
    const month = d.toLocaleString([], { month: "short" });
    const label = `W${weekOfMonth} ${month}`;
    const key = `${y}-${d.getMonth()}-${weekOfMonth}`;
    const entry = map.get(key) || { focusList: [], postureList: [], label };
    const fPct = clamp(
      s?.focusStats?.percent ??
        ((s?.focusStats?.focused || 0) + (s?.focusStats?.unfocused || 0) > 0
          ? Math.round(
              (s.focusStats.focused /
                (s.focusStats.focused + s.focusStats.unfocused)) *
                100
            )
          : 0),
      0,
      100
    );
    const p10 = clamp((s?.postureAvg ?? 0) * 10, 0, 10);
    if (!Number.isNaN(fPct)) entry.focusList.push(fPct);
    if (!Number.isNaN(p10)) entry.postureList.push(p10);
    map.set(key, entry);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, v]) => ({
      label: v.label,
      focus: v.focusList.length ? avg(v.focusList) : 0,
      posture: v.postureList.length ? avg(v.postureList) : 0,
    }))
    .slice(-4);
}

function groupByLast7Days(sessions) {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString([], { weekday: "short" });
    const key = d.toDateString();
    days.push({ key, label, focusList: [], postureList: [] });
  }
  const idxByKey = new Map(days.map((d, i) => [d.key, i]));
  for (const s of sessions) {
    const d = new Date(s.timestamp || 0);
    const key = d.toDateString();
    if (!idxByKey.has(key)) continue;
    const i = idxByKey.get(key);
    const fPct = clamp(
      s?.focusStats?.percent ??
        ((s?.focusStats?.focused || 0) + (s?.focusStats?.unfocused || 0) > 0
          ? Math.round(
              (s.focusStats.focused /
                (s.focusStats.focused + s.focusStats.unfocused)) *
                100
            )
          : 0),
      0,
      100
    );
    const p10 = clamp((s?.postureAvg ?? 0) * 10, 0, 10);
    if (!Number.isNaN(fPct)) days[i].focusList.push(fPct);
    if (!Number.isNaN(p10)) days[i].postureList.push(p10);
  }
  return days.map((d) => ({
    label: d.label,
    focus: d.focusList.length ? avg(d.focusList) : 0,
    posture: d.postureList.length ? avg(d.postureList) : 0,
  }));
}

function SingleLineChart({
  data,
  maxY = 100,
  yLabel = "",
  lineKind = "focus",
  idSuffix = "",
}) {
  const W = 720;
  const H = 240;
  const PAD_L = 46;
  const PAD_R = 46;
  const PAD_T = 24;
  const PAD_B = 34;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const n = data.length || 0;
  const xFor = (i) =>
    n <= 1 ? PAD_L + innerW / 2 : PAD_L + (i * innerW) / (n - 1);
  const yFor = (v) =>
    PAD_T + innerH - (clamp(v, 0, maxY) / maxY) * innerH;
  const path = data
    .map((d, i) => `${i ? "L" : "M"} ${xFor(i)} ${yFor(d.value ?? 0)}`)
    .join(" ");
  const focusGradId = `psFocusGrad-${idSuffix}`;
  const postureGradId = `psPostureGrad-${idSuffix}`;
  return (
    <svg
      className="ps-chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={focusGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#8e44ad" />
        </linearGradient>
        <linearGradient id={postureGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#ff7ad9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} className="ps-chart-bg" />
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD_T + innerH * t;
        return (
          <line
            key={i}
            x1={PAD_L}
            y1={y}
            x2={W - PAD_R}
            y2={y}
            className="ps-grid"
          />
        );
      })}
      <text x={10} y={PAD_T + 10} className="ps-axis-label">
        {yLabel}
      </text>
      <text x={10} y={PAD_T + innerH} className="ps-axis-tick">
        0
      </text>
      <text x={10} y={PAD_T + innerH * 0.5} className="ps-axis-tick">
        {Math.round(maxY / 2)}
      </text>
      <text x={10} y={PAD_T + 12} className="ps-axis-tick">
        {maxY}
      </text>
      {data.map((d, i) => (
        <text
          key={i}
          x={xFor(i)}
          y={H - 10}
          className="ps-xlabel"
          textAnchor="middle"
        >
          {d.label}
        </text>
      ))}
      <path
        d={path}
        className="ps-line"
        style={{
          stroke: `url(#${lineKind === "focus" ? focusGradId : postureGradId})`,
        }}
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xFor(i)}
          cy={yFor(d.value ?? 0)}
          r="2.8"
          className={`ps-dot ${lineKind === "focus" ? "focus-dot" : "posture-dot"}`}
        />
      ))}
    </svg>
  );
}

export default function PerformanceStats() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const [sessions, setSessions] = useState([]);
  const [guidedBreaks, setGuidedBreaks] = useState([]);
  const [focusGuides, setFocusGuides] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);

  const loadLS = () => {
    setSessions(safeParseLS("sessions", []));
    setGuidedBreaks(safeParseLS("breaks", []));
    setFocusGuides(safeParseLS("focusGuides", []));
    setFocusSessions(safeParseLS("focusSessions", []));
  };

  useEffect(() => {
    loadLS();
    const onStorage = (e) => {
      if (
        ["sessions", "breaks", "focusGuides", "focusSessions"].includes(e.key)
      ) {
        loadLS();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const totalSessions = sessions.length;
  const trackingFocusCount = sessions.filter((s) =>
    /focus/i.test(s?.selectedOption || "")
  ).length;
  const focusSessionsCount =
    trackingFocusCount + (focusGuides?.length || 0) + (focusSessions?.length || 0);
  const postureSessions = sessions.filter((s) =>
    /posture/i.test(s?.selectedOption || "")
  ).length;
  const totalBreaks = guidedBreaks.length;

  const focusPercents = sessions
    .filter((s) => s?.focusStats)
    .map((s) =>
      clamp(
        s.focusStats.percent ??
          ((s.focusStats.focused || 0) + (s.focusStats.unfocused || 0) > 0
            ? Math.round(
                (s.focusStats.focused /
                  (s.focusStats.focused + s.focusStats.unfocused)) *
                  100
              )
            : 0),
        0,
        100
      )
    );
  const postureOutOf10 = sessions
    .filter((s) => typeof s?.postureAvg === "number")
    .map((s) => clamp(s.postureAvg * 10, 0, 10));

  const avgFocusPct = focusPercents.length
    ? Math.round(avg(focusPercents))
    : 0;
  const avgPosture10 = postureOutOf10.length
    ? avg(postureOutOf10).toFixed(1)
    : "0.0";

  const breakTally = BREAK_TYPES.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});
  for (const b of guidedBreaks) {
    const name = b?.type || b?.label;
    if (BREAK_TYPES.includes(name)) breakTally[name] += 1;
  }

  const focusTally = FOCUS_SESSION_TYPES.reduce(
    (acc, t) => ({ ...acc, [t]: 0 }),
    {}
  );
  for (const f of focusSessions) {
    let t = f?.type;
    if (t === "Multiple Object Tracking") t = "Moving Object Tracking";
    if (FOCUS_SESSION_TYPES.includes(t)) {
      focusTally[t] += 1;
    }
  }

  const coachingRows = sessions.map((s) => s?.coaching).filter(Boolean);
  const fatigueAvg = coachingRows.length
    ? avg(coachingRows.map((c) => c?.fatigueScore ?? 0)).toFixed(1)
    : null;
  const blinkAvg = coachingRows.length
    ? avg(coachingRows.map((c) => c?.blinkRateMin ?? 0)).toFixed(1)
    : null;
  const perclosAvg = coachingRows.length
    ? avg(coachingRows.map((c) => (c?.perclos ?? 0) * 100)).toFixed(1)
    : null;
  const stressAvg = coachingRows.length
    ? avg(coachingRows.map((c) => c?.stressScore ?? 0)).toFixed(1)
    : null;
  const yawnsAvg = coachingRows.length
    ? avg(coachingRows.map((c) => c?.yawnsMin ?? 0)).toFixed(2)
    : null;

  const weeklyMix = useMemo(() => groupByLast7Days(sessions), [sessions]);
  const monthlyMix = useMemo(() => groupByCalendarWeek(sessions), [sessions]);

  const weeklyFocus = weeklyMix.map((d) => ({ label: d.label, value: d.focus }));
  const weeklyPost = weeklyMix.map((d) => ({ label: d.label, value: d.posture }));
  const monthlyFocus = monthlyMix.map((d) => ({ label: d.label, value: d.focus }));
  const monthlyPost = monthlyMix.map((d) => ({ label: d.label, value: d.posture }));

  const recent = [...sessions].sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );

  return (
    <div className="ps-container">
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
          style={{
            position: "fixed",
            top: "30px",
            right: "30px",
            zIndex: 1000,
          }}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div
          className={`sidebar-tab ${
            location.pathname === "/dashboard" ? "active" : ""
          }`}
          onClick={() => {
            navigate("/dashboard");
            setIsSidebarOpen(false);
          }}
        >
          Home
        </div>
        <div
          className={`sidebar-tab ${
            location.pathname === "/profile" ? "active" : ""
          }`}
          onClick={() => {
            navigate("/profile");
            setIsSidebarOpen(false);
          }}
        >
          Profile
        </div>
        <div
          className={`sidebar-tab ${
            location.pathname === "/trackingsetup" ? "active" : ""
          }`}
          onClick={() => {
            navigate("/trackingsetup");
            setIsSidebarOpen(false);
          }}
        >
          Start Session
        </div>
        <div
          className={`sidebar-tab ${
            location.pathname === "/performancestats" ? "active" : ""
          }`}
          onClick={() => {
            navigate("/performancestats");
            setIsSidebarOpen(false);
          }}
        >
          Performance Stats
        </div>
        <div
          className={`sidebar-tab ${
            location.pathname === "/focusguide" ? "active" : ""
          }`}
          onClick={() => {
            navigate("/focusguide");
            setIsSidebarOpen(false);
          }}
        >
          Focus Guide
        </div>
        <div
          className={`sidebar-tab ${
            location.pathname === "/guidedbreaks" ? "active" : ""
          }`}
          onClick={() => {
            navigate("/guidedbreaks");
            setIsSidebarOpen(false);
          }}
        >
          Guided Breaks
        </div>
      </div>

      <header className="ps-header">
        <h1 className="ps-title">Performance Stats</h1>
        <p className="ps-subtitle">
          Your trends across focus, posture, breaks, and coaching.
        </p>
      </header>

      <section className="ps-kpis glass">
        <div className="kpi">
          <div className="kpi-title">Total Sessions</div>
          <div className="kpi-value">{totalSessions}</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Focus Sessions</div>
          <div className="kpi-value">{focusSessionsCount}</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Posture Sessions</div>
          <div className="kpi-value">{postureSessions}</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Breaks Taken</div>
          <div className="kpi-value">{totalBreaks}</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Avg Focus</div>
          <div className="kpi-value">{avgFocusPct}%</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Avg Posture</div>
          <div className="kpi-value">{avgPosture10}/10</div>
        </div>
      </section>

      <section className="ps-charts">
        <div className="chart-card glass">
          <div className="chart-head">
            <h3>Focus — Last 7 Days</h3>
            <p className="muted">Daily average (%)</p>
          </div>
          <SingleLineChart
            data={weeklyFocus}
            maxY={100}
            yLabel="Focus %"
            lineKind="focus"
            idSuffix="wfocus"
          />
        </div>
        <div className="chart-card glass">
          <div className="chart-head">
            <h3>Focus — Last 4 Weeks</h3>
            <p className="muted">Weekly average (%)</p>
          </div>
          <SingleLineChart
            data={monthlyFocus}
            maxY={100}
            yLabel="Focus %"
            lineKind="focus"
            idSuffix="mfocus"
          />
        </div>
        <div className="chart-card glass">
          <div className="chart-head">
            <h3>Posture — Last 7 Days</h3>
            <p className="muted">Daily average (/10)</p>
          </div>
          <SingleLineChart
            data={weeklyPost}
            maxY={10}
            yLabel="Posture /10"
            lineKind="posture"
            idSuffix="wpost"
          />
        </div>
        <div className="chart-card glass">
          <div className="chart-head">
            <h3>Posture — Last 4 Weeks</h3>
            <p className="muted">Weekly average (/10)</p>
          </div>
          <SingleLineChart
            data={monthlyPost}
            maxY={10}
            yLabel="Posture /10"
            lineKind="posture"
            idSuffix="mpost"
          />
        </div>
      </section>

      <section className="panel glass fullwidth tall-coaching">
        <h3>Advanced Coaching (Averages)</h3>
        {coachingRows.length === 0 ? (
          <p className="muted">
            No coaching data yet. Enable Advanced Coaching in TrackingSetup.
          </p>
        ) : (
          <div className="coach-grid tall">
            <div className="coach-item">
              <div className="coach-label">Fatigue Score</div>
              <div className="coach-value">{fatigueAvg}</div>
            </div>
            <div className="coach-item">
              <div className="coach-label">Blink Rate / min</div>
              <div className="coach-value">{blinkAvg}</div>
            </div>
            <div className="coach-item">
              <div className="coach-label">PERCLOS</div>
              <div className="coach-value">{perclosAvg}%</div>
            </div>
            <div className="coach-item">
              <div className="coach-label">Stress Score</div>
              <div className="coach-value">{stressAvg}</div>
            </div>
            <div className="coach-item">
              <div className="coach-label">Yawns / min</div>
              <div className="coach-value">{yawnsAvg}</div>
            </div>
          </div>
        )}
      </section>

      <section className="ps-two-col">
        <div className="panel glass stretch">
          <h3>Guided Breaks</h3>
          <div className="flat-list">
            {BREAK_TYPES.map((t) => (
              <div key={t} className="flat-row">
                <span className="flat-name">{t}</span>
                <span className="flat-count">{breakTally[t] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel glass stretch">
          <h3>Focus Sessions</h3>
          <div className="flat-list">
            {FOCUS_SESSION_TYPES.map((t) => (
              <div key={t} className="flat-row">
                <span className="flat-name">{t}</span>
                <span className="flat-count">{focusTally[t] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ps-history glass">
        <div className="history-head">
          <h3>All Sessions</h3>
          <p className="muted">Scroll to view your complete timeline</p>
        </div>

        {recent.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No sessions yet</div>
            <div className="empty-subtitle">
              Start a session to populate your stats.
            </div>
          </div>
        ) : (
          <div className="history-list">
            {recent.map((s, idx) => {
              const both =
                /focus/i.test(s?.selectedOption || "") &&
                /posture/i.test(s?.selectedOption || "");
              const focusOnly =
                /focus/i.test(s?.selectedOption || "") &&
                !/posture/i.test(s?.selectedOption || "");
              const postureOnly =
                /posture/i.test(s?.selectedOption || "") &&
                !/focus/i.test(s?.selectedOption || "");
              const fPct = clamp(s?.focusStats?.percent ?? 0, 0, 100);
              const p10 = clamp((s?.postureAvg ?? 0) * 10, 0, 10);
              const c = s?.coaching;

              return (
                <div key={idx} className="history-row">
                  <div className="history-left">
                    <div className="h-top">
                      <div className="h-when">{fmtDate(s.timestamp)}</div>
                      <div className="h-tags">
                        {focusOnly && <span className="tag">Focus</span>}
                        {postureOnly && <span className="tag">Posture</span>}
                        {both && (
                          <span className="tag tag-accent">Focus + Posture</span>
                        )}
                        {s?.additionalFeatures?.advancedCoaching && (
                          <span className="tag tag-coach">Advanced Coaching</span>
                        )}
                        {s?.selectedTime && <span className="tag">{s.selectedTime}</span>}
                      </div>
                    </div>
                    <div className="h-sub">{s?.selectedOption || "Session"}</div>
                  </div>

                  <div className="history-right">
                    <div className="chip">
                      <div className="chip-label">Focus</div>
                      <div className="chip-main">
                        <div className="chip-strong">
                          {focusOnly || both ? `${fPct}%` : "—"}
                        </div>
                        {(focusOnly || both) && (
                          <div className="chip-sub">
                            on: {Math.round(s?.focusStats?.focused || 0)}s · away: {Math.round(s?.focusStats?.unfocused || 0)}s
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="chip">
                      <div className="chip-label">Posture</div>
                      <div className="chip-main">
                        <div className="chip-strong">
                          {postureOnly || both ? `${p10.toFixed(1)}/10` : "—"}
                        </div>
                        {(postureOnly || both) && (
                          <div className="chip-sub">avg posture</div>
                        )}
                      </div>
                    </div>

                    <div className="chip coaching">
                      <div className="chip-label">Coaching</div>
                      <div className="chip-main coaching-badges">
                        {c ? (
                          <>
                            {"fatigueScore" in c && (
                              <span className="tag">
                                Fatigue {Number(c.fatigueScore).toFixed(1)}
                              </span>
                            )}
                            {"blinkRateMin" in c && (
                              <span className="tag">
                                Blink {Number(c.blinkRateMin).toFixed(1)}/min
                              </span>
                            )}
                            {"perclos" in c && (
                              <span className="tag">
                                PERCLOS {(Number(c.perclos) * 100).toFixed(1)}%
                              </span>
                            )}
                            {"stressScore" in c && (
                              <span className="tag">
                                Stress {Number(c.stressScore).toFixed(1)}
                              </span>
                            )}
                            {"yawnsMin" in c && (
                              <span className="tag">
                                Yawns {Number(c.yawnsMin).toFixed(2)}/min
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="tag">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
