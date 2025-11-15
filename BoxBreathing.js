
import React, { useState, useEffect, useRef } from "react";
import "./BoxBreathing.css";
import { useNavigate } from "react-router-dom";

const phases = ["Inhale", "Hold", "Exhale", "Hold"];
const PHASE_DURATION_SEC = 4;

export default function BoxBreathing() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);


  const slides = [
    {
      title: "What is Box Breathing?",
      text:
        "A powerful relaxation technique where you inhale, hold, exhale, and hold — each for equal counts.",
    },
    {
      title: "How it Works",
      text:
        "By slowing and controlling your breath, you activate your parasympathetic nervous system and reduce stress.",
    },
    {
      title: "Get Started",
      text:
        "We’ll guide you through each step with visuals and voice prompts. Select your session length next.",
    },
  ];
  const [slideIndex, setSlideIndex] = useState(0);


  const [selectedMinutes, setSelectedMinutes] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);


  const [phaseIndex, setPhaseIndex] = useState(0);   
  const [phaseSecond, setPhaseSecond] = useState(0); 

  
  const intervalRef = useRef(null);
  const tickRef = useRef(0);          
  const lastSpokenKey = useRef("");    

 
  const cancelSpeech = () => {
    try { window.speechSynthesis?.cancel(); } catch {}
  };
  const speakOne = (text) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const startSession = () => {
    const totalSeconds = Math.max(1, Number(selectedMinutes) || 1) * 60;
    setTimeLeft(totalSeconds);
    tickRef.current = 0;
    setPhaseIndex(0);
    setPhaseSecond(0);
    setStep(2);
  };

  const endSession = () => {
    cancelSpeech();
    setStep(3);
  };


  useEffect(() => {
    if (step !== 2) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      cancelSpeech();
      return;
    }

    lastSpokenKey.current = "";
    speakOne(phases[0]);

    intervalRef.current = setInterval(() => {
      
      const nextTick = tickRef.current + 1;
      tickRef.current = nextTick;

      
      const pSecond = nextTick % PHASE_DURATION_SEC;                    
      const pIndex  = Math.floor(nextTick / PHASE_DURATION_SEC) % 4;    

      setPhaseSecond(pSecond);
      setPhaseIndex(pIndex);

   
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      cancelSpeech();
    };
  }, [step]);

  
  useEffect(() => {
    if (step !== 2) return;

    const key = `${phaseIndex}:${phaseSecond}`;
    if (lastSpokenKey.current === key) return;
    lastSpokenKey.current = key;

    if (phaseSecond === 0) {
     
      speakOne(phases[phaseIndex]);
    } else if (phaseSecond === 1) {
      speakOne("2");
    } else if (phaseSecond === 2) {
      speakOne("3");
    } else if (phaseSecond === 3) {
      speakOne("4");
    }
  }, [step, phaseIndex, phaseSecond]);

  
  useEffect(() => {
    if (step === 2 && timeLeft <= 0) {
      cancelSpeech();
      setStep(3);
    }
  }, [step, timeLeft]);

  
  useEffect(() => () => cancelSpeech(), []);

  
  if (step === 0) {
    return (
      <div className="boxbreathing-container">
        <div className="instruction-box">
          <h2>{slides[slideIndex].title}</h2>
          <p>{slides[slideIndex].text}</p>
          <div className="button-row">
            {slideIndex < slides.length - 1 ? (
              <button className="next-btn" onClick={() => setSlideIndex((i) => i + 1)}>
                Next
              </button>
            ) : (
              <button className="next-btn" onClick={() => setStep(1)}>
                Continue
              </button>
            )}
            <button className="skip-btn" onClick={() => setStep(1)}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="boxbreathing-container">
        <div className="timer-select-box">
          <h2>Select Session Length</h2>
          <input
            type="number"
            min="1"
            max="60"
            value={selectedMinutes}
            onChange={(e) => setSelectedMinutes(e.target.value)}
            className="time-picker"
          />
          <p className="minutes-label">minutes</p>
          <button className="box-start-session-btn" onClick={startSession}>
            Start Session
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="boxbreathing-container session-screen">
        <h2 className="session-title">Box Breathing</h2>

        <div className="breathing-box">
          <div className={`left-text ${phaseIndex === 0 ? "active" : ""}`}>Inhale</div>
          <div className={`top-text ${phaseIndex === 1 ? "active" : ""}`}>Hold</div>
          <div className={`right-text ${phaseIndex === 2 ? "active" : ""}`}>Exhale</div>
          <div className={`bottom-text ${phaseIndex === 3 ? "active" : ""}`}>Hold</div>

          <div className="time-center">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>

        <button className="end-session-btn" onClick={endSession}>End Session</button>
      </div>
    );
  }


  return (
    <div className="boxbreathing-container">
      <div className="session-complete">
        <h2>Session Complete</h2>
        <p>You finished the Box Breathing session!</p>
        <div className="done-actions">
          <button className="next-btn" onClick={() => navigate("/guidedbreaks")}>
            Back to Guided Breaks
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              cancelSpeech();
              startSession();
            }}
          >
            Repeat Session
          </button>
        </div>
      </div>
    </div>
  );
}
