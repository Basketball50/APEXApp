
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DualNBack.css";

const LETTER_POOL = "BCDFGHJKLMNPQRSTVWXYZ".split("");

function randInt(max) { return Math.floor(Math.random() * max); }
function randomLetter() { return LETTER_POOL[randInt(LETTER_POOL.length)]; }
function randomPosition() { return randInt(9); }

function logFocusSession(type, meta = {}) {
  try {
    const raw = localStorage.getItem("focusSessions");
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ type, timestamp: Date.now(), source: "focus-game", meta });
    localStorage.setItem("focusSessions", JSON.stringify(arr));
    window.dispatchEvent(new StorageEvent("storage", { key: "focusSessions" }));
  } catch {}
}

export default function DualNBack() {
  const navigate = useNavigate();

  const [step, setStep] = useState("setup"); 
  const [nBack, setNBack] = useState(2);
  const [trials, setTrials] = useState(20);
  const [intervalMs, setIntervalMs] = useState(2500);
  const [countdown, setCountdown] = useState(3);

  const stimuliRef = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progressPct, setProgressPct] = useState(0);
  const userResponsesRef = useRef({});
  const intervalIdRef = useRef(null);
  const countdownIdRef = useRef(null);

  const [stats, setStats] = useState({
    posHits: 0, posFalseAlarms: 0, posMisses: 0, posExpected: 0,
    letterHits: 0, letterFalseAlarms: 0, letterMisses: 0, letterExpected: 0,
  });

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const generateStimuli = (count) => {
    const arr = [];
    for (let i = 0; i < count; i++) arr.push({ position: randomPosition(), letter: randomLetter() });
    return arr;
  };

  const startCountdown = () => {
    setCountdown(3);
    setStep("countdown");
    countdownIdRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(countdownIdRef.current); startRun(); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const startRun = () => {
    stimuliRef.current = generateStimuli(trials);
    userResponsesRef.current = {};
    setStats({
      posHits: 0, posFalseAlarms: 0, posMisses: 0, posExpected: 0,
      letterHits: 0, letterFalseAlarms: 0, letterMisses: 0, letterExpected: 0,
    });
    setProgressPct(0);
    setCurrentIndex(0);
    setStep("running");

    intervalIdRef.current = setInterval(() => {
      const i = currentIndexRef.current;
      if (i >= 0) evaluateIndex(i);

      const next = i + 1;
      if (next >= trials) {
        clearInterval(intervalIdRef.current);
        setProgressPct(100);
        setStep("done");
        setCurrentIndex(trials - 1);
       
        logFocusSession("Dual N-Back", {
          nBack, trials,
          pos: { hits: stats.posHits, misses: stats.posMisses, fa: stats.posFalseAlarms, expected: stats.posExpected },
          letter: { hits: stats.letterHits, misses: stats.letterMisses, fa: stats.letterFalseAlarms, expected: stats.letterExpected },
        });
        return;
      }
      setCurrentIndex(next);
      setProgressPct(Math.round(((next + 1) / trials) * 100));
    }, intervalMs);
  };

  const evaluateIndex = (i) => {
    const stimuli = stimuliRef.current;
    if (!stimuli || i < 0 || i >= stimuli.length) return;

    const resp = userResponsesRef.current[i] || { pos: false, letter: false };
    const expectedPos = i >= nBack && stimuli[i].position === stimuli[i - nBack].position;
    const expectedLetter = i >= nBack && stimuli[i].letter === stimuli[i - nBack].letter;

    setStats((prev) => {
      const next = { ...prev };
      if (expectedPos) next.posExpected += 1;
      if (expectedLetter) next.letterExpected += 1;

      if (resp.pos) { expectedPos ? next.posHits += 1 : next.posFalseAlarms += 1; }
      else if (expectedPos) { next.posMisses += 1; }

      if (resp.letter) { expectedLetter ? next.letterHits += 1 : next.letterFalseAlarms += 1; }
      else if (expectedLetter) { next.letterMisses += 1; }

      return next;
    });
  };

  const handleResponse = (type) => {
    if (step !== "running") return;
    const i = currentIndexRef.current;
    if (i < 0) return;
    if (!userResponsesRef.current[i]) userResponsesRef.current[i] = { pos: false, letter: false };
    if (type === "pos") { if (!userResponsesRef.current[i].pos) userResponsesRef.current[i].pos = true; }
    if (type === "letter") { if (!userResponsesRef.current[i].letter) userResponsesRef.current[i].letter = true; }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (step !== "running") return;
      const key = e.key.toLowerCase();
      if (key === "f" || key === "d" || key === "arrowleft") handleResponse("pos");
      else if (key === "j" || key === "k" || key === "arrowright") handleResponse("letter");
      else if (key === " ") handleResponse("pos");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (countdownIdRef.current) clearInterval(countdownIdRef.current);
    };
  }, []);

  const handleEnd = () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    const cur = currentIndexRef.current;
    if (cur >= 0) evaluateIndex(cur);
    setStep("done");
   
    logFocusSession("Dual N-Back", {
      nBack, trials,
      pos: { hits: stats.posHits, misses: stats.posMisses, fa: stats.posFalseAlarms, expected: stats.posExpected },
      letter: { hits: stats.letterHits, misses: stats.letterMisses, fa: stats.letterFalseAlarms, expected: stats.letterExpected },
      endedEarly: true,
    });
  };

  const expectedPos = stats.posExpected;
  const posHits = stats.posHits;
  const expectedLetter = stats.letterExpected;
  const letterHits = stats.letterHits;

  const posAccuracy = expectedPos > 0 ? Math.round((posHits / expectedPos) * 100) : 0;
  const letterAccuracy = expectedLetter > 0 ? Math.round((letterHits / expectedLetter) * 100) : 0;

  const renderGrid = (activePos) => {
    const cells = [];
    for (let i = 0; i < 9; i++) {
      const active = i === activePos;
      cells.push(<div key={i} className={`grid-cell ${active ? "active" : ""}`}></div>);
    }
    return <div className="grid">{cells}</div>;
  };

  const currStim = currentIndex >= 0 && stimuliRef.current ? stimuliRef.current[currentIndex] : null;
  const displayLetter = currStim ? currStim.letter : "";
  const displayPos = currStim ? currStim.position : null;

  return (
    <div className="dual-container">
      {step === "setup" && (
        <div className="setup-panel">
          <h1 className="dual-title">Dual N-Back Training</h1>
          <p className="dual-desc">
            Test and train your working memory by remembering both the position (grid) and the letter. Respond when the current stimulus matches the one {nBack}-back.
          </p>

          <div className="setup-row">
            <label>
              N:{" "}
              <select value={nBack} onChange={(e) => setNBack(Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>

            <label>
              Trials:{" "}
              <select value={trials} onChange={(e) => setTrials(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </label>

            <label>
              Speed:
              <select value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))}>
                <option value={2000}>2.0 s</option>
                <option value={2500}>2.5 s</option>
                <option value={3000}>3.0 s</option>
              </select>
            </label>
          </div>

          <div className="setup-actions">
            <button className="dual-btn ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button className="dual-btn gradient" onClick={startCountdown}>
              Start (3-2-1)
            </button>
          </div>

          <div className="hint">
            Controls: press <span className="kbd">F</span> for Position, <span className="kbd">J</span> for Letter.
          </div>
        </div>
      )}

      {step === "countdown" && (
        <div className="countdown-screen">
          <div className="count-number">{countdown > 0 ? countdown : "GO!"}</div>
        </div>
      )}

      {step === "running" && (
        <div className="running-screen">
          <div className="top-row">
            <div className="trial-info">
              Trial: <strong>{Math.min(currentIndex + 1, trials)}/{trials}</strong>
            </div>
            <div className="n-info">N-back: <strong>{nBack}</strong></div>
            <div className="progress-info">{Math.round(progressPct)}%</div>
          </div>

          <div className="play-area">
            <div className="grid-area">{renderGrid(displayPos)}</div>
            <div className="letter-area">
              <div className="letter-box">{displayLetter}</div>
            </div>
          </div>

          <div className="response-row">
            <button className="response-btn pos" onClick={() => handleResponse("pos")}>
              Position
            </button>
            <button className="response-btn letter" onClick={() => handleResponse("letter")}>
              Letter
            </button>
          </div>

          <div className="bottom-bar">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="stats-mini">
              <div>Pos: {posHits}/{expectedPos} ({posAccuracy}%)</div>
              <div>Let: {letterHits}/{expectedLetter} ({letterAccuracy}%)</div>
            </div>

            <div className="session-controls">
              <button className="dual-btn ghost" onClick={handleEnd}>
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="results-screen">
          <h2>Session Results</h2>

          <div className="results-grid">
            <div className="result-card">
              <h3>Position</h3>
              <p>Matches (expected): <strong>{stats.posExpected}</strong></p>
              <p>Hits: <strong>{stats.posHits}</strong></p>
              <p>Misses: <strong>{stats.posMisses}</strong></p>
              <p>False Alarms: <strong>{stats.posFalseAlarms}</strong></p>
              <p>Accuracy: <strong>{posAccuracy}%</strong></p>
            </div>

            <div className="result-card">
              <h3>Letter</h3>
              <p>Matches (expected): <strong>{stats.letterExpected}</strong></p>
              <p>Hits: <strong>{stats.letterHits}</strong></p>
              <p>Misses: <strong>{stats.letterMisses}</strong></p>
              <p>False Alarms: <strong>{stats.letterFalseAlarms}</strong></p>
              <p>Accuracy: <strong>{letterAccuracy}%</strong></p>
            </div>
          </div>

          <div className="result-actions">
            <button className="dual-btn gradient" onClick={() => {
              setStep("setup");
              setTimeout(() => startCountdown(), 100);
            }}>
              Repeat
            </button>

            <button className="dual-btn ghost" onClick={() => navigate("/focusguide")}>
              Back to Focus Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
