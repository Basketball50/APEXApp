
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./MultipleObject.css";

const SESSION_SECONDS = 60;

const SLIDES = [
  { title: "Moving Object Tracking", text: "Track the highlighted dot among many moving distractors. Keep your gaze soft and stay locked on your target." },
  { title: "How It Works", text: "At the start, one dot is highlighted in cyan—this is your target. Keep tracking it while all dots move and bounce." },
  { title: "Session", text: "The session lasts 60 seconds. Dots get faster as time passes. You can end early with the End Session button." },
];

function logFocusSession(type, meta = {}) {
  try {
    const raw = localStorage.getItem("focusSessions");
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ type, timestamp: Date.now(), source: "focus-game", meta });
    localStorage.setItem("focusSessions", JSON.stringify(arr));
    window.dispatchEvent(new StorageEvent("storage", { key: "focusSessions" }));
  } catch {}
}

export default function MultipleObject() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("slides"); 
  const [slideIndex, setSlideIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [progressPct, setProgressPct] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  const runningRef = useRef(false);
  const objsRef = useRef([]);
  const targetIndexRef = useRef(-1);
  const partsRef = useRef([]);

  const timerIntervalRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const sessionStartMsRef = useRef(0);

  useEffect(() => {
    const setSize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
  }, []);

  const setupSession = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.width / dpr;
    const H = c.height / dpr;

    const count = 26;
    const objs = [];
    for (let i = 0; i < count; i++) {
      const base = 2.2 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      objs.push({
        x: Math.random() * (W - 36) + 18,
        y: Math.random() * (H - 36) + 18,
        vx0: Math.cos(angle) * base,
        vy0: Math.sin(angle) * base,
        r: 10 + Math.random() * 4,
      });
    }

    const idx = (Math.random() * count) | 0;

    const parts = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      sz: 1 + Math.random() * 2,
      a: 0.04 + Math.random() * 0.08,
    }));

    objsRef.current = objs;
    targetIndexRef.current = idx;
    partsRef.current = parts;
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    setCountdown(3);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          startSession();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    };
  }, [phase]);

  const drawFrame = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = c.width / dpr;
    const H = c.height / dpr;

    const elapsed = Math.max(0, Date.now() - sessionStartMsRef.current);
    const p = Math.min(1, elapsed / (SESSION_SECONDS * 1000));
    const speedGain = 3.0;
    const speedScale = 1 + p * speedGain;

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "rgba(10,14,28,1)");
    g.addColorStop(1, "rgba(8,8,14,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const gap = 64;
    ctx.beginPath();
    for (let x = 0; x <= W; x += gap) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += gap) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    const parts = partsRef.current;
    for (let i = 0; i < parts.length; i++) {
      const pz = parts[i];
      pz.x += pz.dx;
      pz.y += pz.dy;
      if (pz.x < -10) pz.x = W + 10;
      if (pz.x > W + 10) pz.x = -10;
      if (pz.y < -10) pz.y = H + 10;
      if (pz.y > H + 10) pz.y = -10;

      ctx.fillStyle = `rgba(255,255,255,${pz.a})`;
      ctx.fillRect(pz.x, pz.y, pz.sz, pz.sz);
    }

    const objs = objsRef.current;
    const tIdx = targetIndexRef.current;

    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];

      const dx = o.vx0 * speedScale;
      const dy = o.vy0 * speedScale;

      o.x += dx;
      o.y += dy;

      if (o.x < o.r) { o.x = o.r; o.vx0 = Math.abs(o.vx0); }
      if (o.x > W - o.r) { o.x = W - o.r; o.vx0 = -Math.abs(o.vx0); }
      if (o.y < o.r) { o.y = o.r; o.vy0 = Math.abs(o.vy0); }
      if (o.y > H - o.r) { o.y = H - o.r; o.vy0 = -Math.abs(o.vy0); }

      const isTarget = i === tIdx;

      ctx.save();
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      if (isTarget) {
        ctx.fillStyle = "rgba(79,172,254,0.95)";
        ctx.shadowColor = "rgba(79,172,254,0.85)";
        ctx.shadowBlur = 20;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.shadowColor = "rgba(255,255,255,0.5)";
        ctx.shadowBlur = 10;
      }
      ctx.fill();
      ctx.restore();

      if (isTarget) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r + 6, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(79,172,254,0.95)";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r + 12, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(79,172,254,0.28)";
        ctx.stroke();
      }
    }

    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(drawFrame);
    }
  }, []);

  const finishSession = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    setPhase("done");
    logFocusSession("Moving Object Tracking", { durationSec: SESSION_SECONDS });
  }, []);

  const startSession = useCallback(() => {
    setPhase("session");
    setTimeLeft(SESSION_SECONDS);
    setProgressPct(0);

    setupSession();
    sessionStartMsRef.current = Date.now();

    runningRef.current = true;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          finishSession();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const totalMs = SESSION_SECONDS * 1000;
    const start = Date.now();
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const el = Date.now() - start;
      setProgressPct(Math.min(100, (el / totalMs) * 100));
    }, 100);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawFrame);
  }, [setupSession, drawFrame, finishSession]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  return (
    <div className="mot-container">
      <canvas ref={canvasRef} className="mot-canvas" />

      {phase === "slides" && (
        <div className="overlay-panel">
          <div className="instruction-box">
            <h2>{SLIDES[slideIndex].title}</h2>
            <p>{SLIDES[slideIndex].text}</p>
            <div className="button-row">
              {slideIndex < SLIDES.length - 1 ? (
                <button className="next-btn" onClick={() => setSlideIndex((i) => i + 1)}>
                  Next
                </button>
              ) : (
                <button className="next-btn" onClick={() => setPhase("countdown")}>
                  Continue
                </button>
              )}
              <button className="skip-btn" onClick={() => setPhase("countdown")}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "countdown" && (
        <div className="overlay-panel">
          <h1 className="countdown-go">{countdown > 0 ? countdown : "GO!"}</h1>
        </div>
      )}

      {phase === "session" && (
        <>
          <div className="hud top">
            <span className="pill soft">Target: 1</span>
            <span className="pill soft">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
            <button className="end-btn" onClick={finishSession} aria-label="End Session" title="End Session">
              End Session
            </button>
          </div>

          <div className="progress-wrapper fixed">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="progress-text">{Math.round(progressPct)}%</div>
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="overlay-panel">
          <div className="session-complete">
            <h2>Session Complete</h2>
            <p>Great work staying locked on your target through increasing speeds!</p>
            <div className="done-actions">
              <button
                className="next-btn"
                onClick={() => {
                  setProgressPct(0);
                  setTimeLeft(SESSION_SECONDS);
                  setSlideIndex(0);
                  setPhase("slides");
                }}
              >
                Restart
              </button>
              <button className="skip-btn" onClick={() => navigate("/focusguide")}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
