
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./SustainedAttention.css";


const SESSION_SECONDS = 120;


const GAP_MIN_MS = 1000;
const GAP_MAX_MS = 2200;
const STIM_ON_MS = 900; 


const TARGET_PROB = 0.24;
const DECOY_PROB = 0.28;

const SLIDES = [
  {
    title: "Sustained Attention",
    text:
      "Respond only to the target stimulus across longer intervals to boost vigilance and reduce lapses.",
  },
  {
    title: "How It Works",
    text:
      "A glowing bubble occasionally appears. Click it only when you see the word “TARGET.” Otherwise, do nothing.",
  },
  {
    title: "Scoring",
    text:
      "Hitting a target is +1. Missing a target is -1. Clicking a decoy (wrong one) is -1.",
  },
  {
    title: "Get Ready",
    text:
      "After the slideshow, there’s a 3–2–1 countdown, then a ~2 minute session.",
  },
];

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}


function playFeedbackSound(kind) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!playFeedbackSound.ctx) {
      playFeedbackSound.ctx = new AC();
    }
    const ctx = playFeedbackSound.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    let freq = 600;
    let duration = 0.12;

    if (kind === "correct") {
      freq = 900;          
    } else if (kind === "wrong") {
      freq = 280;          
    } else if (kind === "miss") {
      freq = 420;       
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

export default function SustainedAttention() {
  const navigate = useNavigate();


  const [phase, setPhase] = useState("slides");
  const [slideIndex, setSlideIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);

  
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [wrongTargetClicks, setWrongTargetClicks] = useState(0); 

  
  const [avgRtMs, setAvgRtMs] = useState(null);
  const rtSamplesRef = useRef([]);
  const targetShownAtRef = useRef(0);

  
  const [stimulus, setStimulus] = useState({
    kind: "none",
    x: 0.5,
    y: 0.5,
    key: 0,
  });

  
  const sessionTickRef = useRef(null);
  const nextSlotRef = useRef(null);
  const stimTimeoutRef = useRef(null);

  
  const armedRef = useRef(false);

  
  const loggedRef = useRef(false);

  
  const containerRef = useRef(null);

  
  useEffect(() => {
    return () => {
      clearInterval(sessionTickRef.current);
      clearTimeout(nextSlotRef.current);
      clearTimeout(stimTimeoutRef.current);
    };
  }, []);

  
  const startCountdown = () => {
    setCountdown(3);
    setPhase("countdown");
  };

  
  useEffect(() => {
    if (phase !== "countdown") return;
    let id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          id = null;
          beginSession();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (id) clearInterval(id);
    };
  }, [phase]);


  const beginSession = () => {
  
    setPhase("session");
    setTimeLeft(SESSION_SECONDS);
    setScore(0);
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setWrongTargetClicks(0);
    setAvgRtMs(null);
    rtSamplesRef.current = [];
    setStimulus({ kind: "none", x: 0.5, y: 0.5, key: 0 });
    armedRef.current = false;
    targetShownAtRef.current = 0;
    loggedRef.current = false;

    
    sessionTickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(sessionTickRef.current);
          endSession();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    scheduleNextSlot();
  };

  
  const endSession = () => {
    clearInterval(sessionTickRef.current);
    clearTimeout(nextSlotRef.current);
    clearTimeout(stimTimeoutRef.current);

    const arr = rtSamplesRef.current;
    const avg = arr.length
      ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
      : null;
    setAvgRtMs(avg);

    setPhase("done");

    
    if (loggedRef.current) return;
    loggedRef.current = true;

    try {
      const raw = localStorage.getItem("focusSessions");
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        type: "Sustained Attention",
        timestamp: Date.now(),
        stats: {
          score,
          hits,
          misses,
          falseAlarms,
          wrongTargetClicks,
          avgRtMs: avg,
          durationSec: SESSION_SECONDS,
        },
      });
      localStorage.setItem("focusSessions", JSON.stringify(list));
      
      window.dispatchEvent(
        new StorageEvent("storage", { key: "focusSessions" })
      );
    } catch {}
  };


  const placeStimulus = useCallback((kind) => {
    const el = containerRef.current;
    const margin = 100;
    const vw = el ? el.clientWidth : window.innerWidth;
    const vh = el ? el.clientHeight : window.innerHeight;

    const xPx = randRange(margin, Math.max(margin + 1, vw - margin));
    const yPx = randRange(margin + 40, Math.max(margin + 41, vh - margin));
    const nx = xPx / vw;
    const ny = yPx / vh;

    setStimulus((s) => ({ kind, x: nx, y: ny, key: s.key + 1 }));

    if (kind === "target") {
      armedRef.current = true;
      targetShownAtRef.current = performance.now();
    } else {
      armedRef.current = false;
      targetShownAtRef.current = 0;
    }

    clearTimeout(stimTimeoutRef.current);
    stimTimeoutRef.current = setTimeout(() => {
   
      if (kind === "target" && armedRef.current) {
        setMisses((m) => m + 1);
        setScore((s) => s - 1); 
        playFeedbackSound("miss");
      }
      setStimulus((s) => ({ ...s, kind: "none" }));
      armedRef.current = false;
      scheduleNextSlot();
    }, STIM_ON_MS);
  }, []);

  const scheduleNextSlot = useCallback(() => {
    clearTimeout(nextSlotRef.current);
    const wait = randRange(GAP_MIN_MS, GAP_MAX_MS);
    nextSlotRef.current = setTimeout(() => {
      const r = Math.random();
      if (r < TARGET_PROB) {
        placeStimulus("target");
      } else if (r < TARGET_PROB + DECOY_PROB) {
        placeStimulus("decoy");
      } else {
        
        scheduleNextSlot();
      }
    }, wait);
  }, [placeStimulus]);


  const handlePointerDown = (e) => {
    if (phase !== "session") return;
    const el = containerRef.current;
    const rect = el
      ? el.getBoundingClientRect()
      : {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const cx = stimulus.x * rect.width;
    const cy = stimulus.y * rect.height;
    const R = 56;
    const dx = px - cx;
    const dy = py - cy;
    const insideBubble = dx * dx + dy * dy <= R * R;

    if (stimulus.kind === "target") {
      if (insideBubble && armedRef.current) {
        
        armedRef.current = false;
        const rt = Math.max(
          0,
          performance.now() - (targetShownAtRef.current || performance.now())
        );
        rtSamplesRef.current.push(rt);
        setHits((h) => h + 1);
        setScore((s) => s + 1);
        playFeedbackSound("correct");

        clearTimeout(stimTimeoutRef.current);
        setStimulus((s) => ({ ...s, kind: "none" }));
        scheduleNextSlot();
      } else {
        
        setFalseAlarms((f) => f + 1);
        playFeedbackSound("wrong");
      }
      return;
    }

    if (stimulus.kind === "decoy") {
      if (insideBubble) {
       
        setWrongTargetClicks((w) => w + 1);
        setScore((s) => s - 1);
        playFeedbackSound("wrong");

        clearTimeout(stimTimeoutRef.current);
        setStimulus((s) => ({ ...s, kind: "none" }));
        scheduleNextSlot();
      } else {
        
        setFalseAlarms((f) => f + 1);
        playFeedbackSound("wrong");
      }
      return;
    }

    
    setFalseAlarms((f) => f + 1);
    playFeedbackSound("wrong");
  };

 
  if (phase === "slides") {
    return (
      <div className="sa-container full-screen" ref={containerRef}>
        <div className="instruction-box">
          <h2>{SLIDES[slideIndex].title}</h2>
          <p>{SLIDES[slideIndex].text}</p>
          <div className="button-row">
            {slideIndex < SLIDES.length - 1 ? (
              <button
                className="next-btn"
                onClick={() => setSlideIndex((i) => i + 1)}
              >
                Next
              </button>
            ) : (
              <button className="next-btn" onClick={startCountdown}>
                Continue
              </button>
            )}
            <button className="skip-btn" onClick={startCountdown}>
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="sa-container full-screen">
        <div className="overlay-panel">
          <h1 className="countdown-go">
            {countdown > 0 ? countdown : "GO!"}
          </h1>
        </div>
      </div>
    );
  }

  if (phase === "session") {
    const el = containerRef.current;
    const w = el?.clientWidth || window.innerWidth;
    const h = el?.clientHeight || window.innerHeight;
    const left = stimulus.x * w;
    const top = stimulus.y * h;

    const showBubble = stimulus.kind === "target" || stimulus.kind === "decoy";
    const isTarget = stimulus.kind === "target";

    return (
      <div
        className="sa-container full-screen session-screen"
        ref={containerRef}
        onPointerDown={handlePointerDown}
      >
        <div className="sa-hud">
          <span className="pill pill-gradient">Score: {score}</span>
          <span className="pill soft">Hits: {hits}</span>
          <span className="pill soft">Misses: {misses}</span>
          <span className="pill soft">Wrong Target: {wrongTargetClicks}</span>
          <span className="pill soft">False Alarms: {falseAlarms}</span>
          <span className="pill soft">
            Time: {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </span>
          <button className="btn ghost" onClick={endSession}>
            End
          </button>
        </div>

        {showBubble && (
          <div
            key={stimulus.key}
            className="target-bubble"
            style={{ left: `${left}px`, top: `${top}px` }}
          >
            <div className="glow" />
            {isTarget ? <div className="label">TARGET</div> : null}
          </div>
        )}

        <div className="sa-hint">Click only when you see TARGET</div>
      </div>
    );
  }


  return (
    <div className="sa-container full-screen">
      <div className="session-complete">
        <h2>Session Complete</h2>
        <p className="sa-results-line">
          Score: <strong>{score}</strong> &nbsp;|&nbsp; Hits: {hits} &nbsp;|&nbsp;
          Misses: {misses} &nbsp;|&nbsp; Wrong Target: {wrongTargetClicks} &nbsp;|&nbsp;
          False Alarms: {falseAlarms}
        </p>
        <p className="sa-results-line">
          Avg Reaction Time (targets):{" "}
          <strong>{avgRtMs !== null ? `${avgRtMs} ms` : "—"}</strong>
        </p>
        <div className="done-actions">
          <button
            className="next-btn"
            onClick={() => navigate("/focusguide")}
          >
            Back to Focus Guide
          </button>
          <button className="skip-btn" onClick={startCountdown}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

