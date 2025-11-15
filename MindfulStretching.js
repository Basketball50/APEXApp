
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MindfulStretching.css";

const EXERCISES = [
  { part: "Neck Stretch", instruction: "Gently tilt your head to the right, hold for a few breaths, then switch to the left." },
  { part: "Shoulder Rolls", instruction: "Roll your shoulders forward in a circular motion 5 times, then backward 5 times." },
  { part: "Arm Stretch", instruction: "Extend your right arm across your chest and use your left hand to gently press it closer to your body. Switch arms." },
  { part: "Chest Opener", instruction: "Clasp your hands behind your back, straighten arms and lift chest slightly, breathing deeply." },
  { part: "Upper Back Stretch", instruction: "Clasp hands in front of you and push forward, rounding your upper back and shoulders." },
  { part: "Side Stretch", instruction: "Raise your right arm overhead and lean gently to the left, feeling a stretch along your side. Switch sides." },
  { part: "Seated Forward Fold", instruction: "While seated, extend legs forward and gently reach toward your toes. Keep your back long." },
  { part: "Quad Stretch", instruction: "Stand up, grab your right ankle behind you, pulling it toward your glutes to stretch the front of your thigh. Switch legs." },
  { part: "Calf Stretch", instruction: "Place hands on a wall, step one foot back and press heel down to stretch your calf. Switch legs." },
  { part: "Full Body Reach", instruction: "Stand tall, reach arms overhead and lengthen through your spine. Take deep breaths." },
];

const PER_EXERCISE_MS = 15000; 
const PROGRESS_TICK_MS = 100;  
export default function MindfulStretching() {
  const navigate = useNavigate();

  
  const [step, setStep] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);


  const totalExercises = EXERCISES.length;
  const TOTAL_MS = totalExercises * PER_EXERCISE_MS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progressPct, setProgressPct] = useState(0);

  
  const [perRemaining, setPerRemaining] = useState(PER_EXERCISE_MS / 1000);

  
  const [countdown, setCountdown] = useState(3);

  
  const countdownIntervalRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const perSecondIntervalRef = useRef(null);
  const autoAdvanceTimeoutRef = useRef(null);

  const slides = [
    {
      title: "Mindful Stretching",
      text: "Follow guided stretches to relieve tension, improve posture, and refresh your mind during short breaks.",
    },
    {
      title: "How it Works",
      text: "Each exercise lasts ~15 seconds. Follow the instructions on-screen and breathe deeply.",
    },
    {
      title: "Get Started",
      text: "Press Continue and the session will automatically run through all stretches.",
    },
  ];

  
  const clearAllTimers = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (perSecondIntervalRef.current) clearInterval(perSecondIntervalRef.current);
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    countdownIntervalRef.current = null;
    progressIntervalRef.current = null;
    perSecondIntervalRef.current = null;
    autoAdvanceTimeoutRef.current = null;
  };

  const startCountdown = () => {
    clearAllTimers();
    setStep(1);
    setCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          startSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startSession = () => {
    clearAllTimers();
    setStep(2);
    setCurrentIndex(0);
    setVisible(true);
    setProgressPct(0);
    setPerRemaining(PER_EXERCISE_MS / 1000);

    
    const sessionStart = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - sessionStart;
      const pct = Math.min((elapsed / TOTAL_MS) * 100, 100);
      setProgressPct(pct);
      if (pct >= 100) {
        clearAllTimers();
        setStep(3);
      }
    }, PROGRESS_TICK_MS);

    
    perSecondIntervalRef.current = setInterval(() => {
      setPerRemaining((s) => (s > 1 ? s - 1 : 0));
    }, 1000);

    autoAdvanceTimeoutRef.current = setTimeout(() => {
      nextExercise();
    }, PER_EXERCISE_MS);
  };

  const nextExercise = () => {
    setVisible(false);
    setTimeout(() => {
      const nxt = currentIndex + 1;
      if (nxt >= totalExercises) {
        clearAllTimers();
        setProgressPct(100);
        setStep(3);
      } else {
        setCurrentIndex(nxt);
        setVisible(true);
        setPerRemaining(PER_EXERCISE_MS / 1000);

        
        if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          nextExercise();
        }, PER_EXERCISE_MS);
      }
    }, 250);
  };

  const endSession = () => {
    clearAllTimers();
    setStep(3);
  };

  
  useEffect(() => {
    return () => clearAllTimers();
  }, []);


  if (step === 0) {
    return (
      <div className="pmr-container full-screen">
        <div className="instruction-box">
          <h2>{slides[slideIndex].title}</h2>
          <p>{slides[slideIndex].text}</p>
          <div className="button-row">
            {slideIndex < slides.length - 1 ? (
              <button className="next-btn" onClick={() => setSlideIndex((s) => s + 1)}>
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


  if (step === 1) {
    return (
      <div className="pmr-container full-screen session-screen">
        <h1 className="countdown-go">{countdown > 0 ? countdown : "GO!"}</h1>
      </div>
    );
  }


  if (step === 2) {
    const current = EXERCISES[currentIndex];
    return (
      <div className="pmr-container full-screen session-screen">
        <div className="session-inner">
         
          <div className="meta-row">
            <span className="pill">{`Exercise ${currentIndex + 1} / ${totalExercises}`}</span>
            <span className="pill soft">{perRemaining}s</span>
          </div>

          
          <div
            className={`body-part-display ${visible ? "fade-in" : "fade-out"}`}
            key={currentIndex}
          >
            <div className="pulse-ring" aria-hidden />
            <h1 className="part-name">{current.part}</h1>
            <p className="part-instruction">{current.instruction}</p>

            <div className="actions-inline">
              <button className="skip-btn ghost" onClick={nextExercise}>
                Next Stretch
              </button>
              <button className="skip-btn ghost danger" onClick={endSession}>
                End Session
              </button>
            </div>
          </div>

         
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="progress-text">{Math.round(progressPct)}%</div>
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
          <p>You finished the Mindful Stretching session!</p>
          <div className="done-actions">
            <button className="next-btn" onClick={() => navigate("/guidedbreaks")}>
              Back to Guided Breaks
            </button>
            <button className="skip-btn" onClick={startSession}>
              Repeat Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
