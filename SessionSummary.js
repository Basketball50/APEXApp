import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SessionSummary.css";

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function SessionSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  const lastSession = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastSession");
      if (raw) return JSON.parse(raw);
    } catch {}
    return location.state || null;
  }, [location.state]);

  const handleReturn = () => navigate("/dashboard");

  if (!lastSession) {
    return (
      <div className="summary-page">
        <div className="summary-shell">
          <h1 className="summary-title">Session Summary</h1>
          <div className="empty-card glass">
            <div className="empty-title">No recent session found</div>
            <div className="empty-subtitle">
              Run a new session and you’ll see your posture and focus stats here.
            </div>
            <button onClick={handleReturn} className="return-button">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    selectedOption = "",
    postureAvg, 
    focusStats, 
    selectedTime,
    additionalFeatures, 
    coaching,         
  } = lastSession || {};

  const wantsFocus   = /focus/i.test(selectedOption || "");
  const wantsPosture = /posture/i.test(selectedOption || "");

  const postureScore10 =
    typeof postureAvg === "number" ? Math.round(postureAvg * 10) : null;
  const focusPercent =
    typeof focusStats?.percent === "number" ? focusStats.percent : null;

  
  const advancedEnabled = !!(
    additionalFeatures?.advancedCoaching ||
    additionalFeatures?.smartBreaks ||
    additionalFeatures?.stressFatigue ||
    additionalFeatures?.eyeBlink ||
    coaching
  );

  return (
    <div className="summary-page">
      <div className="summary-shell">
        <h1 className="summary-title">Session Summary</h1>

        
        <div className="meta-row">
          {selectedOption ? <span className="pill-pill">{selectedOption}</span> : null}
          {selectedTime ? (
            <span className="pill-pill soft">Duration: {selectedTime}</span>
          ) : null}
          {advancedEnabled && (
            <span className="pill-pill grad">Advanced Coaching</span>
          )}
        </div>

        <div className="summary-content">
         
          {!wantsFocus && wantsPosture && (
            <div className="card-row one">
              <div className="card glass">
                <div className="card-header">
                  <div className="card-title">Posture</div>
                  <div className="card-subtitle">
                    Average quality across the session
                  </div>
                </div>
                <div className="card-body">
                  <div className="focus-layout only-circle">
                    <div className="circle-wrap">
                      <div
                        className="circle"
                        style={{
                          ["--percent"]: `${((postureScore10 || 0) / 10) * 100}%`,
                        }}
                      >
                        <div className="circle-inner">
                          <span>
                            {postureScore10 != null ? `${postureScore10}/10` : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="circle-label">Average Posture</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

     
          {wantsFocus && !wantsPosture && (
            <div className="card-row one">
              <div className="card glass">
                <div className="card-header">
                  <div className="card-title">Focus</div>
                  <div className="card-subtitle">How steadily you stayed on task</div>
                </div>
                <div className="card-body">
                  <div className="focus-layout">
                    <div className="circle-wrap">
                      <div
                        className="circle"
                        style={{
                          ["--percent"]: `${focusPercent != null ? focusPercent : 0}%`,
                        }}
                      >
                        <div className="circle-inner">
                          <span>{focusPercent != null ? `${focusPercent}%` : "—"}</span>
                        </div>
                      </div>
                      <div className="circle-label">Average Focus</div>
                    </div>
                    <div className="side-stats">
                      <div className="kv">
                        <div className="kv-label">Focused time</div>
                        <div className="kv-value">
                          {formatHMS(focusStats?.focused || 0)}
                        </div>
                      </div>
                      <div className="kv">
                        <div className="kv-label">Away / distracted</div>
                        <div className="kv-value">
                          {formatHMS(focusStats?.unfocused || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          {wantsFocus && wantsPosture && (
            <div className="card-row two">
           
              <div className="card glass">
                <div className="card-header">
                  <div className="card-title">Focus</div>
                  <div className="card-subtitle">
                    Balance of focused vs. unfocused time
                  </div>
                </div>
                <div className="card-body">
                  <div className="focus-layout">
                    <div className="circle-wrap">
                      <div
                        className="circle"
                        style={{
                          ["--percent"]: `${focusPercent != null ? focusPercent : 0}%`,
                        }}
                      >
                        <div className="circle-inner">
                          <span>
                            {focusPercent != null ? `${focusPercent}%` : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="circle-label">Average Focus</div>
                    </div>
                    <div className="side-stats">
                      <div className="kv">
                        <div className="kv-label">Focused time</div>
                        <div className="kv-value">
                          {formatHMS(focusStats?.focused || 0)}
                        </div>
                      </div>
                      <div className="kv">
                        <div className="kv-label">Away / distracted</div>
                        <div className="kv-value">
                          {formatHMS(focusStats?.unfocused || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="card glass">
                <div className="card-header">
                  <div className="card-title">Posture</div>
                  <div className="card-subtitle">
                    Upright, balanced posture over the session
                  </div>
                </div>
                <div className="card-body">
                  <div className="focus-layout only-circle">
                    <div className="circle-wrap">
                      <div
                        className="circle"
                        style={{
                          ["--percent"]: `${((postureScore10 || 0) / 10) * 100}%`,
                        }}
                      >
                        <div className="circle-inner">
                          <span>
                            {postureScore10 != null ? `${postureScore10}/10` : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="circle-label">Average Posture</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          {advancedEnabled && (
            <div className="card-row one">
              <div className="card glass">
                <div className="card-header">
                  <div className="card-title">Advanced Coaching</div>
                  <div className="card-subtitle">
                    Signals from stress, fatigue, and eye behavior
                  </div>
                </div>
                <div className="card-body">
                  <div className="coaching-grid">
                    {coaching ? (
                      <>
                        {"fatigueScore" in coaching && (
                          <div className="coaching-kpi">
                            <div className="kpi-label">Fatigue</div>
                            <div className="kpi-value">
                              {typeof coaching.fatigueScore === "number"
                                ? coaching.fatigueScore.toFixed(1)
                                : "—"}
                              /10
                            </div>
                          </div>
                        )}

                        {"blinkRateMin" in coaching && (
                          <div className="coaching-kpi">
                            <div className="kpi-label">Blinks / min</div>
                            <div className="kpi-value">
                              {typeof coaching.blinkRateMin === "number"
                                ? coaching.blinkRateMin.toFixed(1)
                                : "—"}
                            </div>
                          </div>
                        )}

                        {"perclos" in coaching && (
                          <div className="coaching-kpi">
                            <div className="kpi-label">Eye closure (PERCLOS)</div>
                            <div className="kpi-value">
                              {typeof coaching.perclos === "number"
                                ? `${Math.round(coaching.perclos * 100)}%`
                                : "—"}
                            </div>
                          </div>
                        )}

                        {"yawnsMin" in coaching && (
                          <div className="coaching-kpi">
                            <div className="kpi-label">Yawns / min</div>
                            <div className="kpi-value">
                              {typeof coaching.yawnsMin === "number"
                                ? coaching.yawnsMin.toFixed(2)
                                : "—"}
                            </div>
                          </div>
                        )}

                        {"stressScore" in coaching && (
                          <div className="coaching-kpi">
                            <div className="kpi-label">Stress</div>
                            <div className="kpi-value">
                              {typeof coaching.stressScore === "number"
                                ? coaching.stressScore.toFixed(1)
                                : "—"}
                              /10
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {additionalFeatures?.advancedCoaching && (
                          <div className="badge">
                            Advanced Coaching signals were active this session.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bottom-actions">
          <button onClick={handleReturn} className="return-button">
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
