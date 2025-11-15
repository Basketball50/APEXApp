
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./SelectivePick.css";
import { useNavigate } from "react-router-dom";

const SESSION_SECONDS = 60;

const FALL_SPEED = 180;

const SPAWN_START_MS = 900;
const SPAWN_MIN_MS = 420;
const SPAWN_ACCEL_MS = 10;

const SEED_COUNT = 6;
const MAX_SHAPES = 32;

const SLIDES = [
  {
    title: "SelectivePick (Selective Attention)",
    text:
      "Shapes of different colors fall down the screen. Your task: click ONLY the WHITE TRIANGLES. Ignore everything else.",
  },
  {
    title: "How It Works",
    text:
      "Click a white triangle to gain a point. Clicking anything else deducts a point. Missing a white triangle subtracts a point. The number of shapes ramps up gradually.",
  },
  {
    title: "Get Started",
    text:
      "Press Continue (or Skip) to begin. After a 3–2–1 countdown, the game runs for 60 seconds.",
  },
];

const SHAPES = ["circle", "square", "triangle", "diamond", "pentagon", "star"];


const COLORS = [
  "#4facfe",  
  "#40a9ff",  
  "#3f68ff",  
  "#8e44ad", 
  "#b37feb",  
  "#ffffff",  
];

const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];


function logFocusSession(type, meta = {}) {
  try {
    const raw = localStorage.getItem("focusSessions");
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({
      type,
      timestamp: Date.now(),
      source: "focus-game",
      meta,
    });
    localStorage.setItem("focusSessions", JSON.stringify(arr));
  
    window.dispatchEvent(new StorageEvent("storage", { key: "focusSessions" }));
  } catch {}
}


function playHitSound(kind) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!playHitSound.ctx) {
      playHitSound.ctx = new AC();
    }
    const ctx = playHitSound.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    let freq = 600;
    let duration = 0.12;

    if (kind === "correct") {
      freq = 900;          
    } else if (kind === "wrong") {
      freq = 260;        
    } else if (kind === "miss") {
      freq = 400;         
    }

    osc.type = "sine";
    osc.frequency.value = freq;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
   
  }
}

export default function SelectivePick() {
  const navigate = useNavigate();


  const [step, setStep] = useState(0); 
  const [slideIndex, setSlideIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);


  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);


  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(0);
  const timerRef = useRef(null);
  const runningRef = useRef(false);
  const startedRef = useRef(false);


  const lastTimeRef = useRef(null);
  const spawnIntervalRef = useRef(SPAWN_START_MS);
  const spawnAccumMsRef = useRef(0);

  
  const speedMultiplierRef = useRef(1);

  
  const shapesRef = useRef([]);

  const setupCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    c.width = cssW;
    c.height = cssH;
    c.style.width = `${cssW}px`;
    c.style.height = `${cssH}px`;
    ctxRef.current = c.getContext("2d");
  }, []);

  useEffect(() => {
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setupCanvas]);

  const startCountdown = () => {
    setStep(1);
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(id);
          setStep(2);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (step !== 2) {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    setupCanvas();

    shapesRef.current = [];
    setScore(0);
    setMissed(0);
    setWrong(0);
    setTimeLeft(SESSION_SECONDS);

    lastTimeRef.current = null;
    spawnAccumMsRef.current = 0;
    spawnIntervalRef.current = SPAWN_START_MS;
    speedMultiplierRef.current = 1;

    for (let i = 0; i < SEED_COUNT; i++) spawnShape(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endSession();
          return 0;
        }
        const next = t - 1;
        
        const progress = 1 - next / SESSION_SECONDS;
        
        const multiplier = 1 + progress * 0.6;
        speedMultiplierRef.current = multiplier;
        return next;
      });
    }, 1000);

    runningRef.current = true;
    rafRef.current = requestAnimationFrame(loop);
   
  }, [step, setupCanvas]);

  const endSession = () => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStep(3);

    logFocusSession("Selective Pick", { score, missed, wrong, durationSec: SESSION_SECONDS });
  };

  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function buildShapePath(ctx, s, inflate = 0) {
    ctx.beginPath();
    const half = s.size / 2 + inflate;
    switch (s.type) {
      case "circle":
        ctx.arc(s.x, s.y, half, 0, Math.PI * 2);
        break;
      case "square":
        ctx.rect(s.x - half, s.y - half, half * 2, half * 2);
        break;
      case "triangle": {
        const size = s.size + inflate * 2;
        const hTri = (size * Math.sqrt(3)) / 2;
        ctx.moveTo(s.x, s.y - (2 / 3) * hTri);
        ctx.lineTo(s.x - size / 2, s.y + (1 / 3) * hTri);
        ctx.lineTo(s.x + size / 2, s.y + (1 / 3) * hTri);
        ctx.closePath();
        break;
      }
      case "diamond":
        ctx.moveTo(s.x, s.y - half);
        ctx.lineTo(s.x + half, s.y);
        ctx.lineTo(s.x, s.y + half);
        ctx.lineTo(s.x - half, s.y);
        ctx.closePath();
        break;
      case "pentagon": {
        const R = half;
        for (let i = 0; i < 5; i++) {
          const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const px = s.x + R * Math.cos(ang);
          const py = s.y + R * Math.sin(ang);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
      case "star": {
        const outer = half;
        const inner = half * 0.5;
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const ang = -Math.PI / 2 + (i * Math.PI) / 5;
          const px = s.x + r * Math.cos(ang);
          const py = s.y + r * Math.sin(ang);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
      default:
        ctx.arc(s.x, s.y, half, 0, Math.PI * 2);
    }
  }

  function spawnShape(isSeed = false) {
    const c = canvasRef.current;
    if (!c) return;
    if (shapesRef.current.length >= MAX_SHAPES) return;

    const w = c.width;
    const size = 22 + Math.random() * 26;

    const makeTarget = Math.random() < 0.34;

    let type, color, isTarget;
    if (makeTarget) {
      type = "triangle";
      color = "#ffffff";
      isTarget = true;
    } else {
      let attempts = 0;
      do {
        type = choice(SHAPES);
        color = choice(COLORS);
        attempts++;
      } while (type === "triangle" && color === "#ffffff" && attempts < 8);
      isTarget = false;
    }

    const x = Math.max(size, Math.min(w - size, Math.random() * w));
    const vy = FALL_SPEED * speedMultiplierRef.current;

    shapesRef.current.push({
      x,
      y: isSeed ? -Math.random() * 260 - size : -size,
      vy,
      size,
      type,
      color,
      isTarget,
      alive: true,
    });
  }

  const handlePointer = useCallback(
    (e) => {
      if (!runningRef.current || step !== 2) return;

      const c = canvasRef.current;
      const rect = c.getBoundingClientRect();
      const cx = "clientX" in e ? e.clientX : e.touches?.[0]?.clientX ?? 0;
      const cy = "clientY" in e ? e.clientY : e.touches?.[0]?.clientY ?? 0;
      const px = cx - rect.left;
      const py = cy - rect.top;

      const ctx = ctxRef.current;
      const arr = shapesRef.current;

      for (let i = arr.length - 1; i >= 0; i--) {
        const s = arr[i];
        if (!s.alive) continue;
        buildShapePath(ctx, s, 4);
        if (ctx.isPointInPath(px, py)) {
          s.alive = false;
          if (s.isTarget) {
            setScore((v) => v + 1);
            playHitSound("correct");
          } else {
            setScore((v) => v - 1);
            setWrong((w) => w + 1);
            playHitSound("wrong");
          }
          break;
        }
      }
    },
    [step]
  );

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onPointerDown = (e) => handlePointer(e);
    c.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      c.removeEventListener("pointerdown", onPointerDown);
    };
  }, [handlePointer]);

  function loop(nowMs) {
    if (!runningRef.current) return;

    const c = canvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const w = c.width;
    const h = c.height;

    if (lastTimeRef.current == null) lastTimeRef.current = nowMs;
    let dt = (nowMs - lastTimeRef.current) / 1000;
    if (dt > 0.05) dt = 0.05;
    lastTimeRef.current = nowMs;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    spawnAccumMsRef.current += dt * 1000;
    while (spawnAccumMsRef.current >= spawnIntervalRef.current) {
      spawnAccumMsRef.current -= spawnIntervalRef.current;
      spawnShape();
      spawnIntervalRef.current = Math.max(
        SPAWN_MIN_MS,
        spawnIntervalRef.current - SPAWN_ACCEL_MS
      );
    }

    const arr = shapesRef.current;
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = arr[i];
      if (!s.alive) {
        arr.splice(i, 1);
        continue;
      }

      s.y += s.vy * dt;

      buildShapePath(ctx, s, 0);

      
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.isTarget
        ? "rgba(255,255,255,0.85)"
        : "rgba(79,172,254,0.85)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.fill();

      
      if (s.isTarget) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.stroke();
      }

      
      ctx.shadowBlur = 0;

      if (s.y - s.size > h) {
        arr.splice(i, 1);
        if (s.isTarget) {
          setScore((v) => v - 1);
          setMissed((m) => m + 1);
          playHitSound("miss");
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  if (step === 0) {
    return (
      <div className="sp-container full-screen">
        <div className="instruction-box">
          <h2>{SLIDES[slideIndex].title}</h2>
          <p>{SLIDES[slideIndex].text}</p>
          <div className="button-row">
            {slideIndex < SLIDES.length - 1 ? (
              <button className="next-btn" onClick={() => setSlideIndex((s) => s + 1)}>
                Next
              </button>
            ) : (
              <button className="next-btn" onClick={startCountdown}>
                Continue
              </button>
            )}
            <button className="skip-btn" onClick={startCountdown}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="sp-container full-screen session-screen">
        <h1 className="countdown-go">{countdown > 0 ? countdown : "GO!"}</h1>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="sp-container full-screen">
        <canvas ref={canvasRef} className="sp-canvas" />
        <div className="sp-hud">
          <div className="sp-left">
            <span className="pill pill-gradient">Score: {score}</span>
            <span className="pill pill-soft">Wrong: {wrong}</span>
            <span className="pill pill-soft">Missed: {missed}</span>
          </div>
          <div className="sp-right">
            <span className="pill pill-soft">
              Time: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
            <button className="btn ghost" onClick={endSession}>End Session</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-container full-screen">
      <div className="session-complete">
        <h2>Session Complete</h2>
        <p>
          Final Score: <strong>{score}</strong> &nbsp;|&nbsp; Wrong: {wrong} &nbsp;|&nbsp; Missed: {missed}
        </p>
        <div className="done-actions">
          <button className="next-btn" onClick={() => navigate("/focusguide")}>
            Back to Focus Guide
          </button>
          <button className="skip-btn" onClick={() => setStep(1)}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
