
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PMR.css";

const PARTS = [
  { part: "Toes", tense: "Curl them tightly.", relax: "Release and relax toes." },
  { part: "Feet", tense: "Scrunch feet, press into the floor.", relax: "Release pressure and relax feet." },
  { part: "Calves", tense: "Pull toes toward your head (dorsiflex).", relax: "Let calves relax." },
  { part: "Shins", tense: "Point toes away (plantarflex).", relax: "Release and relax shins." },
  { part: "Thighs", tense: "Straighten legs, tighten front thighs.", relax: "Relax thigh muscles." },
  { part: "Hamstrings", tense: "Press heels down, tighten backs of thighs.", relax: "Release and relax hamstrings." },
  { part: "Glutes", tense: "Squeeze your buttocks together.", relax: "Relax glutes." },
  { part: "Lower abdomen", tense: "Tighten your core/stomach muscles.", relax: "Relax your abdomen." },
  { part: "Chest", tense: "Expand chest with deep breath.", relax: "Release and relax chest." },
  { part: "Upper back", tense: "Pinch shoulder blades together.", relax: "Relax upper back." },
  { part: "Lower back", tense: "Gently arch against floor/chair.", relax: "Relax lower back." },
  { part: "Hands", tense: "Clench fists tightly.", relax: "Release and relax hands." },
  { part: "Forearms", tense: "Flex wrists up/down.", relax: "Relax forearms." },
  { part: "Biceps", tense: "Bend elbows, tighten arms.", relax: "Relax biceps." },
  { part: "Triceps", tense: "Straighten arms, push down.", relax: "Relax triceps." },
  { part: "Shoulders", tense: "Shrug shoulders toward ears.", relax: "Relax shoulders." },
  { part: "Neck", tense: "Gently push head back/forward.", relax: "Relax neck." },
  { part: "Jaw", tense: "Clench teeth lightly.", relax: "Relax jaw." },
  { part: "Mouth/Lips", tense: "Press lips together or stretch wide.", relax: "Relax lips." },
  { part: "Tongue", tense: "Press tongue to roof of mouth.", relax: "Relax tongue." },
  { part: "Eyes", tense: "Squeeze eyes shut tightly.", relax: "Relax eyes." },
  { part: "Eyebrows/Forehead", tense: "Raise brows high as if surprised.", relax: "Relax forehead/eyebrows." },
  { part: "Scalp", tense: "Imagine tightening scalp.", relax: "Relax scalp." },
];

const TENSE_MS = 5000;   
const RELAX_MS = 10000;  

export default function PMR() {
  const navigate = useNavigate();

  
  const [step, setStep] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);

  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("Tense"); 
  const [visible, setVisible] = useState(true);

  
  const [progressPct, setProgressPct] = useState(0); 
  const [phasePct, setPhasePct] = useState(0);      
  const [phaseSecLeft, setPhaseSecLeft] = useState(0);

  
  const [countdown, setCountdown] = useState(3);

  
  const phaseTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const phaseIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const sessionStartRef = useRef(null);
  const phaseStartRef = useRef(null);
  const phaseDurationRef = useRef(TENSE_MS);

  const totalMs = PARTS.length * (TENSE_MS + RELAX_MS);

  
  useEffect(() => {
    return () => clearAllTimers();
   
  }, []);

 
  function clearAllTimers() {
    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }

  function startCountdown() {
    setStep(1);
    setCountdown(3);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          startSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function startSession() {
    clearAllTimers();
    setStep(2);
    setCurrentIndex(0);
    setPhase("Tense");
    setVisible(true);
    setProgressPct(0);

    sessionStartRef.current = Date.now();
    beginPhase(0, "Tense");
    startSessionProgressInterval();
  }

  function endSession() {
    clearAllTimers();
    setStep(3);
  }

  function beginPhase(index, which) {
    const d = which === "Tense" ? TENSE_MS : RELAX_MS;
    phaseDurationRef.current = d;
    phaseStartRef.current = Date.now();
    setPhasePct(0);
    setPhaseSecLeft(d / 1000);
    setVisible(true);

    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);


    phaseTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (which === "Tense") {
          setPhase("Relax");
          beginPhase(index, "Relax");
        } else {
          const nextIndex = index + 1;
          if (nextIndex >= PARTS.length) {
            clearAllTimers();
            setProgressPct(100);
            setStep(3);
          } else {
            setCurrentIndex(nextIndex);
            setPhase("Tense");
            beginPhase(nextIndex, "Tense");
          }
        }
      }, 220);
    }, d);

   
    phaseIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - phaseStartRef.current;
      const pct = Math.min(100, (elapsed / phaseDurationRef.current) * 100);
      setPhasePct(pct);
      setPhaseSecLeft(Math.max(0, (phaseDurationRef.current - elapsed) / 1000));
    }, 100);
  }

  function startSessionProgressInterval() {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    const start = Date.now();
    sessionStartRef.current = start;
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / totalMs) * 100);
      setProgressPct(pct);
      if (pct >= 100) {
        clearAllTimers();
        setStep(3);
      }
    }, 120);
  }

  if (step === 0) {
    const slides = [
      {
        title: "What is PMR?",
        text: "Progressive Muscle Relaxation guides you to tense and relax muscles sequentially to reduce tension and stress.",
      },
      {
        title: "How it Works",
        text: "Each muscle will show a Tense phase (5s) and Relax phase (10s). Follow the instructions on-screen.",
      },
      {
        title: "Get Started",
        text: "Press Continue and the session will automatically run through all body parts.",
      },
    ];
    return (
      <div className="pmr-container full-screen">
        <div className="instruction-box">
          <h2>{slides[slideIndex].title}</h2>
          <p>{slides[slideIndex].text}</p>
          <div className="button-row">
            {slideIndex < slides.length - 1 ? (
              <button className="next-btn" onClick={() => setSlideIndex((s) => s + 1)}>Next</button>
            ) : (
              <button className="next-btn" onClick={startCountdown}>Continue</button>
            )}
            <button className="skip-btn" onClick={startCountdown}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="pmr-container full-screen session-screen">
        <h1 className="countdown-go">{countdown > 0 ? countdown : "GO!"}</h1>
      </div>
    );
  }

  if (step === 2) {
    const current = PARTS[currentIndex];
    const instruction = phase === "Tense" ? current.tense : current.relax;
    const next = PARTS[currentIndex + (phase === "Relax" ? 1 : 0)];

    return (
      <div className={`pmr-container full-screen session-screen ${phase === "Tense" ? "is-tense" : "is-relax"}`}>
        <div className="ambient-gradient" aria-hidden />
        <div className="session-shell">
         
          <div className="phase-visual">
            <div className="circular-timer" style={{ "--pct": `${phasePct}%` }}>
              <div className={`orb ${phase === "Tense" ? "orb-tense" : "orb-relax"}`} />
              <div className="phase-center">
                <div className="phase-name">{phase}</div>
                <div className="phase-sec">{Math.max(0, Math.ceil(phaseSecLeft))}s</div>
              </div>
            </div>
            <div className="next-up">
              {next ? (
                <>
                  <span className="label">Next up:</span>
                  <span className="value">{next.part}</span>
                </>
              ) : (
                <span className="label">Final stretch…</span>
              )}
            </div>
          </div>

          
          <div className={`body-part-display glass ${visible ? "fade-in" : "fade-out"}`} key={currentIndex + phase}>
            <h2 className="phase-label">{phase}</h2>
            <h1 className="part-name">{current.part}</h1>
            <p className="part-instruction">{instruction}</p>

            <div className="progress-wrapper">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="progress-text">{Math.round(progressPct)}%</div>
            </div>

            <button className="end-session-btn" onClick={endSession}>End Session</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="pmr-container full-screen">
        <div className="session-complete">
          <h2>Session Complete</h2>
          <p>You finished the Progressive Muscle Relaxation session!</p>
          <div className="done-actions">
            <button className="next-btn" onClick={() => navigate("/guidedbreaks")}>Back to Guided Breaks</button>
            <button className="skip-btn" onClick={startSession}>Repeat Session</button>
          </div>
        </div>
      </div>
    );
  }

  
  return null;
}
