import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pose } from "@mediapipe/pose";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import "./Tracking.css";


function timeLabelToSeconds(label) {
  switch (label) {
    case "30m": return 30 * 60;
    case "1h": return 60 * 60;
    case "1h 30m": return 90 * 60;
    case "2h": return 120 * 60;
    default: return null; 
  }
}
function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const POSTURE_BAD_THRESHOLD = 4;
const POSTURE_ALERT_AFTER = 5;
const FOCUS_ALERT_AFTER = 5; 


const FATIGUE_LOW_CUTOFF = 4;
const STRESS_HIGH_CUTOFF = 7;
const AC_ALERT_AFTER_SEC = 15;
const MAX_SOFT_NUDGES_BEFORE_BREAK = 3; 


function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
    o.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.00001, now + 0.6);
    o.stop(now + 0.62);
  } catch {}
}


function speakOnce(text) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02;
    utter.pitch = 1.0;
    utter.volume = 0.75;
    window.speechSynthesis.speak(utter);
  } catch {}
}

const FOCUS_NUDGES = [
  "Let’s bring attention back to the task.",
  "Quick reset—eyes on your work.",
  "Gently refocus on what’s in front of you.",
  "Back to it—one step at a time.",
  "Take a breath and lock in."
];


const POSTURE_NUDGES = [
  "Please adjust your posture.",
  "Small reset—find a nice, upright position.",
  "Quick posture check.",
  "Let’s sit a bit more balanced.",
  "Tiny adjustment—re-center and relax."
];


export default function Tracking() {
  const videoRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();


  const {
    selectedOption,
    selectedTime,
    customMinutes: cmFromSetup,
    advancedCoaching: acFromSetup,
  } = location.state || {};

  const wantsPosture = /posture/i.test(selectedOption || "");
  const wantsFocus   = /focus/i.test(selectedOption || "");

 
  const advancedCoaching = !!acFromSetup;

  
  const [postureScore, setPostureScore] = useState(10);
  const [avgPostureScore, setAvgPostureScore] = useState(10);
  const postureRolling = useRef([]);
  const postureAll = useRef([]);
  const postureFrameCount = useRef(0);


  const [focusedSeconds, setFocusedSeconds] = useState(0);
  const [unfocusedSeconds, setUnfocusedSeconds] = useState(0);
  const focusLastTs = useRef(null);
  const focusState = useRef(false);
  const focusSmooth = useRef([]);

  
  const focusNudgeCountRef = useRef(0);
  const postureNudgeCountRef = useRef(0);

 
  const [fatigueScore, setFatigueScore] = useState(0); 
  const [stressScore, setStressScore]   = useState(0);

  const eyeHistory = useRef([]);
  const blinkEvents = useRef([]);
  const yawnEvents = useRef([]);
  const focusFlipEvents = useRef([]);

  const calibStartTs = useRef(null);
  const calibSamples = useRef([]);
  const earCloseThresh = useRef(null);

  const eyeClosed = useRef(false);
  const eyeCloseStart = useRef(0);

  const mouthOpen = useRef(false);
  const mouthOpenStart = useRef(0);

  const presetDuration = timeLabelToSeconds(selectedTime);
  const [customMinutes, setCustomMinutes] = useState(
    cmFromSetup != null ? Math.max(1, Math.min(240, Number(cmFromSetup))) : 25
  );
  const initialSeconds = presetDuration ?? (customMinutes * 60);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);


  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [modal, setModal] = useState(null); 
  const [endModal, setEndModal] = useState(false); 
  const sessionTimerRef = useRef(null);

  
  const alarmIntervalRef = useRef(null);
  const startEndAlarm = useCallback(() => {
    if (alarmIntervalRef.current) return;
    playChime();
    alarmIntervalRef.current = setInterval(playChime, 1500);
  }, []);
  const stopEndAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

 
  const fatigueConcernSec = useRef(0);
  const stressConcernSec = useRef(0);


  const cameraRef = useRef(null);
  const poseRef = useRef(null);
  const faceMeshRef = useRef(null);


  const postureLastTs = useRef(null);
  const postureBadStreakSec = useRef(0);
  const postureAlerted = useRef(false);

  const focusUnfocusedStreakSec = useRef(0);
  const focusAlerted = useRef(false);

 
  function calculatePostureScore(landmarks, canvasW, canvasH) {
    const Ls = landmarks[11], Rs = landmarks[12], Lh = landmarks[23], Rh = landmarks[24];
    const nose = landmarks[0], Le = landmarks[7], Re = landmarks[8];
    if (!Ls || !Rs || !Lh || !Rh || !nose || !Le || !Re) return 0;

    let score = 10;
    const midS = { x: (Ls.x + Rs.x) / 2, y: (Ls.y + Rs.y) / 2 };
    const midH = { x: (Lh.x + Rh.x) / 2, y: (Lh.y + Rh.y) / 2 };

    const shoulderTilt = Math.abs((Ls.y - Rs.y) * canvasH);
    score -= Math.min(shoulderTilt / 8, 3);

    const backLean = Math.abs(midS.x - midH.x) * canvasW;
    score -= Math.min(backLean / 15, 4);

    const headForward = Math.abs(nose.x - midS.x) * canvasW;
    score -= Math.min(headForward / 12, 3);

    const earTilt = Math.abs(Le.y - Re.y) * canvasH;
    score -= Math.min(earTilt / 12, 2);

    const shoulderHeight = (Ls.y + Rs.y) / 2;
    const hipHeight = (Lh.y + Rh.y) / 2;
    const torsoUpright = (hipHeight - shoulderHeight) * canvasH;
    if (torsoUpright < 140) score -= 3;

    return Math.max(0, Math.min(10, score));
  }

  function isFocusedFromFace(landmarks) {
    if (!landmarks || landmarks.length < 468) return false;
    const rightEyeOuter = landmarks[33];
    const leftEyeOuter  = landmarks[263];
    const nose = landmarks[1];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const dL = dist(nose, leftEyeOuter);
    const dR = dist(nose, rightEyeOuter);
    const yawAsym = Math.abs((dL - dR) / (dL + dR + 1e-6));
    const faceH = Math.max(1e-6, Math.abs(chin.y - forehead.y));
    const midY = (forehead.y + chin.y) / 2;
    const pitchOffset = Math.abs((nose.y - midY) / faceH);
    return yawAsym < 0.12 && pitchOffset < 0.18;
  }

  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function eyeEAR(lm, left = true) {
    const ids = left
      ? { outer:33, inner:133, up:159, low:145 }
      : { outer:263, inner:362, up:386, low:374 };
    const o = lm[ids.outer], i = lm[ids.inner], u = lm[ids.up], l = lm[ids.low];
    if (!o || !i || !u || !l) return null;
    const vert = dist2(u, l);
    const horiz = dist2(o, i) + 1e-6;
    return vert / horiz;
  }
  function mouthMAR(lm) {
    const p13 = lm[13], p14 = lm[14], p61 = lm[61], p291 = lm[291];
    if (!p13 || !p14 || !p61 || !p291) return null;
    const vert = dist2(p13, p14);
    const horiz = dist2(p61, p291) + 1e-6;
    return vert / horiz;
  }
  function browFurrowIndex(lm) {
    const L = lm[70], R = lm[300];
    if (!L || !R) return null;
    return dist2(L, R);
  }

  
  const pauseForModal = useCallback((title, body) => {
    if (pausedRef.current) return;
    playChime(); 
    setPaused(true);
    pausedRef.current = true;
    setModal({ title, body });
    if (cameraRef.current) { try { cameraRef.current.stop(); } catch {} }
  }, []);

  const resumeAfterModal = useCallback(() => {
    setModal(null);
    setPaused(false);
    pausedRef.current = false;
    const v = videoRef.current;
    if (v) {
      const camera = new Camera(v, {
        onFrame: async () => {
          if (poseRef.current && wantsPosture) await poseRef.current.send({ image: v });
          if (faceMeshRef.current && (wantsFocus || advancedCoaching)) {
            await faceMeshRef.current.send({ image: v });
          }
        },
        width: 800,
        height: 500,
      });
      camera.start();
      cameraRef.current = camera;
    }
  }, [wantsPosture, wantsFocus, advancedCoaching]);

  
  const handleEndSession = useCallback(() => {
    stopEndAlarm(); 
    const sessionPayload = {
      timestamp: Date.now(),
      selectedOption,
      postureAvg: avgPostureScore / 10,
      focusStats: {
        focused: focusedSeconds,
        unfocused: unfocusedSeconds,
        percent:
          focusedSeconds + unfocusedSeconds > 0
            ? Math.round((focusedSeconds / (focusedSeconds + unfocusedSeconds)) * 100)
            : 100,
      },
      selectedTime: presetDuration ? selectedTime : `${customMinutes}m (Custom)`,
      fatigueScore: advancedCoaching ? fatigueScore : undefined,
      stressScore: advancedCoaching ? stressScore : undefined,
      additionalFeatures: { advancedCoaching },
    };

    try {
      localStorage.setItem("lastSession", JSON.stringify(sessionPayload));
      const raw = localStorage.getItem("sessions");
      let arr = [];
      if (raw) {
        try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; } catch {}
      }
      arr.push(sessionPayload);
      localStorage.setItem("sessions", JSON.stringify(arr));
    } catch {}

    navigate("/summary", { state: sessionPayload });
  }, [
    navigate, selectedOption, avgPostureScore, focusedSeconds, unfocusedSeconds,
    selectedTime, presetDuration, customMinutes, advancedCoaching, fatigueScore, stressScore, stopEndAlarm
  ]);

  const handleEndSessionRef = useRef(handleEndSession);
  useEffect(() => { handleEndSessionRef.current = handleEndSession; }, [handleEndSession]);

  
  useEffect(() => {
    const sec = presetDuration ?? ((cmFromSetup != null ? cmFromSetup : customMinutes) * 60);
    setTimeLeft(sec);
    
  }, [presetDuration, cmFromSetup]);

  useEffect(() => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(sessionTimerRef.current);
          setEndModal(true);     
          startEndAlarm();        
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sessionTimerRef.current);
  }, [startEndAlarm]);


  useEffect(() => {
    const videoEl = videoRef.current;
    const getDims = () => {
      const w = videoEl?.videoWidth  || 800;
      const h = videoEl?.videoHeight || 500;
      return { w, h };
    };

    if (wantsPosture) {
      const pose = new Pose({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
      pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults((res) => {
        if (pausedRef.current) return;
        if (res.poseLandmarks) {
          const { w, h } = getDims();
          const raw = calculatePostureScore(res.poseLandmarks, w, h);

         
          postureRolling.current.push(raw);
          if (postureRolling.current.length > 30) postureRolling.current.shift(); 

          const rollingAvg =
            postureRolling.current.reduce((a, b) => a + b, 0) /
            postureRolling.current.length;

          setPostureScore((prev) => {
            const next = Number(rollingAvg.toFixed(1));
            if (typeof prev !== "number" || Number.isNaN(prev)) {
              return next;
            }
            const diff = next - prev;

           
            if (Math.abs(diff) < 0.2) {
              return prev;
            }

          
            const alpha = 0.35; 
            const blended = prev * (1 - alpha) + next * alpha;
            return Number(blended.toFixed(1));
          });
          

          postureAll.current.push(raw);
          postureFrameCount.current += 1;
          const sessionAvg = postureAll.current.reduce((a, b) => a + b, 0) / postureFrameCount.current;
          setAvgPostureScore(Number(sessionAvg.toFixed(1)));

          const nowP = performance.now();
          let dtP = 0;
          if (postureLastTs.current == null) {
            postureLastTs.current = nowP;
          } else {
            dtP = (nowP - postureLastTs.current) / 1000;
            postureLastTs.current = nowP;
          }
          if (rollingAvg < POSTURE_BAD_THRESHOLD) {
            postureBadStreakSec.current += dtP;
            if (postureBadStreakSec.current >= POSTURE_ALERT_AFTER && !postureAlerted.current) {
              const msg = POSTURE_NUDGES[postureNudgeCountRef.current % POSTURE_NUDGES.length];
              postureNudgeCountRef.current += 1;

            
              speakOnce(msg);

              postureAlerted.current = true;

              
              if (
                advancedCoaching &&
                postureNudgeCountRef.current >= MAX_SOFT_NUDGES_BEFORE_BREAK
              ) {
                pauseForModal(
                  "Let’s take a quick reset",
                  "You’ve gotten a few posture reminders. Take 2–3 minutes for mindful stretching or a short Progressive Muscle Relaxation (PMR) exercise before you come back."
                );
              }
            }
          } else {
            postureBadStreakSec.current = 0;
            postureAlerted.current = false;
          }
        }
      });
      poseRef.current = pose;
    }

   
    if (wantsFocus || advancedCoaching) {
      const faceMesh = new FaceMesh({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      faceMesh.onResults((res) => {
        if (pausedRef.current) return;

        
        let focusedNow = false;
        let lm = null;
        if (res.multiFaceLandmarks && res.multiFaceLandmarks.length > 0) {
          lm = res.multiFaceLandmarks[0];
          focusedNow = isFocusedFromFace(lm);
        }
        
        focusSmooth.current.push(focusedNow ? 1 : 0);
        if (focusSmooth.current.length > 8) focusSmooth.current.shift();
        const smoothed = focusSmooth.current.reduce((a, b) => a + b, 0) / focusSmooth.current.length >= 0.5;

        const now = performance.now();
        let dt = 0;
        const prevFocusState = focusState.current;

        if (focusLastTs.current == null) {
          focusLastTs.current = now;
          focusState.current = smoothed;
        } else {
          dt = (now - focusLastTs.current) / 1000;

          if (wantsFocus) {
            if (focusState.current) setFocusedSeconds((prev) => prev + dt);
            else setUnfocusedSeconds((prev) => prev + dt);
          }

          if (wantsFocus && !smoothed) {
            focusUnfocusedStreakSec.current += dt;
            if (focusUnfocusedStreakSec.current >= FOCUS_ALERT_AFTER && !focusAlerted.current) {
              const msg = FOCUS_NUDGES[focusNudgeCountRef.current % FOCUS_NUDGES.length];
              focusNudgeCountRef.current += 1;

              
              speakOnce(msg);

              focusAlerted.current = true;

              if (
                advancedCoaching &&
                focusNudgeCountRef.current >= MAX_SOFT_NUDGES_BEFORE_BREAK
              ) {
                pauseForModal(
                  "Short focus reset",
                  "You’ve had several focus reminders. Take 2–3 minutes for box breathing or a brief guided visualization to reset your attention."
                );
              }
            }
          } else {
            focusUnfocusedStreakSec.current = 0;
            focusAlerted.current = false;
          }

         
          if (prevFocusState !== smoothed) {
            focusFlipEvents.current.push({ t: now });
            while (focusFlipEvents.current.length && now - focusFlipEvents.current[0].t > 60000) {
              focusFlipEvents.current.shift();
            }
          }

          focusLastTs.current = now;
          focusState.current = smoothed;
        }

        
        if (advancedCoaching) {
          
          if (calibStartTs.current == null) calibStartTs.current = performance.now();
          const calibElapsed = (performance.now() - calibStartTs.current) / 1000;

          let earL = null, earR = null, mar = null, brow = null;
          if (lm) {
            earL = eyeEAR(lm, true);
            earR = eyeEAR(lm, false);
            mar  = mouthMAR(lm);
            brow = browFurrowIndex(lm);

            if (earL && earR) {
              if (calibElapsed <= 10) {
                calibSamples.current.push((earL + earR) / 2);
              } else if (earCloseThresh.current == null && calibSamples.current.length > 15) {
                const mean = calibSamples.current.reduce((a,b)=>a+b,0)/calibSamples.current.length;
                earCloseThresh.current = mean * 0.72;
              }
            }
          }

          if (earCloseThresh.current != null && earL != null && earR != null) {
            const closedNowEyes = ((earL + earR) / 2) < earCloseThresh.current;

            if (!eyeClosed.current && closedNowEyes) {
              eyeClosed.current = true;
              eyeCloseStart.current = performance.now();
            } else if (eyeClosed.current && !closedNowEyes) {
              eyeClosed.current = false;
              const dur = performance.now() - (eyeCloseStart.current || performance.now());
              blinkEvents.current.push({ t: performance.now(), durationMs: dur });
            }

            eyeHistory.current.push({
              t: performance.now(),
              earL, earR,
              closedL: earL < earCloseThresh.current,
              closedR: earR < earCloseThresh.current
            });
            while (eyeHistory.current.length && performance.now() - eyeHistory.current[0].t > 90000) eyeHistory.current.shift();
            while (blinkEvents.current.length && performance.now() - blinkEvents.current[0].t > 90000) blinkEvents.current.shift();
          }

          if (mar != null) {
            const YAWN_T = 0.60, YAWN_MIN_MS = 1200;
            if (!mouthOpen.current && mar > YAWN_T) {
              mouthOpen.current = true;
              mouthOpenStart.current = performance.now();
            } else if (mouthOpen.current && mar <= YAWN_T) {
              mouthOpen.current = false;
              const dur = performance.now() - (mouthOpenStart.current || performance.now());
              if (dur >= YAWN_MIN_MS) yawnEvents.current.push({ t: performance.now(), durMs: dur });
            }
            while (yawnEvents.current.length && performance.now() - yawnEvents.current[0].t > 90000) yawnEvents.current.shift();
          }

          const NOW = performance.now();
          const WIN_MS = 60000;

          const eyeWin = eyeHistory.current.filter(e => NOW - e.t <= WIN_MS);
          const closedFrac = eyeWin.length
            ? eyeWin.filter(e => e.closedL && e.closedR).length / eyeWin.length
            : 0;

          const blinksWin = blinkEvents.current.filter(b => NOW - b.t <= WIN_MS);
          const blinkRate = blinksWin.length;
          const avgBlinkDur = blinksWin.length
            ? blinksWin.reduce((a,b)=>a+b.durationMs,0)/blinksWin.length
            : 0;

          const yawnsWin = yawnEvents.current.filter(y => NOW - y.t <= WIN_MS).length;
          const flipsPerMin = focusFlipEvents.current.filter(f => NOW - f.t <= WIN_MS).length;

         
          const clamp01 = (v) => Math.max(0, Math.min(1, v));

         
          let closedScore = 0;
          if (closedFrac > 0.25) {
            
            closedScore = clamp01((closedFrac - 0.25) / 0.35);
          }

          let blinkRateScore = 0;
          if (blinkRate > 18) {
          
            blinkRateScore = clamp01((blinkRate - 18) / 12);
          }

          let blinkDurScore = 0;
          if (avgBlinkDur > 260) {
           
            blinkDurScore = clamp01((avgBlinkDur - 260) / 200);
          }

          const yawnScore = clamp01(yawnsWin / 2); 

          const fatigueRaw =
            (closedScore * 0.4 +
             blinkRateScore * 0.2 +
             blinkDurScore * 0.15 +
             yawnScore * 0.25) * 10;

          const fatigueBad = Math.max(0, Math.min(10, fatigueRaw)); 

          
          setFatigueScore((prev) => {
            const target = fatigueBad;
            if (typeof prev !== "number" || Number.isNaN(prev)) return Number(target.toFixed(1));
            const alpha = 0.3; // 30% new, 70% old
            const blended = prev * (1 - alpha) + target * alpha;
            return Number(blended.toFixed(1));
          });

          
          let browScore = 0;
          if (brow != null && brow < 0.035) {
            
            browScore = clamp01((0.035 - brow) / 0.015); 
          }

          let stressBlinkScore = 0;
          if (blinkRate > 22) {
           
            stressBlinkScore = clamp01((blinkRate - 22) / 10);
          }

          let flipsScore = 0;
          if (flipsPerMin > 4) {
           
            flipsScore = clamp01((flipsPerMin - 4) / 8);
          }

          const stressRaw =
            (browScore * 0.5 +
             flipsScore * 0.3 +
             stressBlinkScore * 0.2) * 10;

          const stressBad = Math.max(0, Math.min(10, stressRaw));

          setStressScore((prev) => {
            const target = stressBad;
            if (typeof prev !== "number" || Number.isNaN(prev)) return Number(target.toFixed(1));
            const alpha = 0.3;
            const blended = prev * (1 - alpha) + target * alpha;
            return Number(blended.toFixed(1));
          });

          
          const fatigueGood = 10 - fatigueBad;

          
          const fatigueBadThreshold = 10 - FATIGUE_LOW_CUTOFF; 

          if (fatigueGood <= FATIGUE_LOW_CUTOFF || fatigueBad >= fatigueBadThreshold) {
            fatigueConcernSec.current += (dt || 0.016);
          } else {
            fatigueConcernSec.current = 0;
          }

          if (stressBad >= STRESS_HIGH_CUTOFF) {
            stressConcernSec.current += (dt || 0.016);
          } else {
            stressConcernSec.current = 0;
          }

          if (fatigueConcernSec.current >= AC_ALERT_AFTER_SEC) {
            fatigueConcernSec.current = 0;
            pauseForModal(
              "Energy looks low",
              "Your fatigue signals have stayed high for a bit. Take a longer break—step away from the screen, go for a short walk, drink some water, or even take a 10–20 minute power nap if you can."
            );
          } else if (
            stressConcernSec.current >= STRESS_HIGH_CUTOFF &&
            stressConcernSec.current >= AC_ALERT_AFTER_SEC
          ) {
            stressConcernSec.current = 0;
            pauseForModal(
              "Stress looks a bit elevated",
              "Your stress signals have been high. Take a longer reset—step away from your work, do some deep or box breathing, or take a short walk and talk to someone if that helps."
            );
          }
        }
      });
      faceMeshRef.current = faceMesh;
    }

    const startCam = () => {
      const v = videoRef.current;
      if (!v) return;
      const camera = new Camera(v, {
        onFrame: async () => {
          if (pausedRef.current) return;
          if (poseRef.current && wantsPosture) await poseRef.current.send({ image: v });
          if (faceMeshRef.current && (wantsFocus || advancedCoaching)) {
            await faceMeshRef.current.send({ image: v });
          }
        },
        width: 800,
        height: 500,
      });
      camera.start();
      cameraRef.current = camera;
    };
    startCam();

    return () => {
      if (poseRef.current?.close) poseRef.current.close();
      if (faceMeshRef.current?.close) faceMeshRef.current.close();
      if (cameraRef.current) cameraRef.current.stop();
      const v = videoEl;
      if (v?.srcObject) v.srcObject.getTracks().forEach((t) => t.stop());
      poseRef.current = null;
      faceMeshRef.current = null;
      cameraRef.current = null;
    };
  }, [wantsPosture, wantsFocus, advancedCoaching, pauseForModal]);

  
  const totalFocusWindow = focusedSeconds + unfocusedSeconds;
  const focusPercent = totalFocusWindow > 0
    ? Math.round((focusedSeconds / totalFocusWindow) * 100)
    : 100;

  
  return (
    <div className="tracking-container">
      
      {timeLeft != null && (
        <div className="time-left-box">
          Time Left: {formatHMS(timeLeft)}
          {!presetDuration && (
            <button
              className="time-edit"
              onClick={() => {
                const val = prompt("Set custom duration (minutes):", String(customMinutes));
                if (!val) return;
                const m = Math.max(1, Math.min(240, Number(val) || customMinutes));
                setCustomMinutes(m);
                setTimeLeft(m * 60);
              }}
              title="Set custom minutes"
            >
              ⏱️
            </button>
          )}
        </div>
      )}

     

      <h1 className="tracking-title">Tracking: {selectedOption || "Session"}</h1>
      {presetDuration ? (
        <div className="tracking-duration">Duration: <strong>{selectedTime}</strong></div>
      ) : (
        <div className="tracking-duration">Duration: <strong>{customMinutes}m (Custom)</strong></div>
      )}

      
      <video ref={videoRef} style={{ display: "none" }} playsInline />

      
      {wantsFocus && wantsPosture && (
        <section className="hero-row">
          
          <div className="focus-card glass">
           
            <div className="focus-gauge compact">
              <svg viewBox="0 0 160 160" className="gauge-svg">
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#8e44ad" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="66" className="gauge-bg" />
                <circle
                  cx="80" cy="80" r="66"
                  className="gauge-fg"
                  style={{
                    strokeDasharray: `${(focusPercent / 100) * 414} 414`,
                    stroke: "url(#fg)"
                  }}
                />
                <text x="80" y="88" textAnchor="middle" className="gauge-text">
                  {focusPercent}%
                </text>
              </svg>
            </div>
            <div className="kv-row stacked tighter">
              <div className="kv">
                <div className="kv-label">Focused</div>
                <div className="kv-value">{formatHMS(focusedSeconds)}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Away</div>
                <div className="kv-value">{formatHMS(unfocusedSeconds)}</div>
              </div>
            </div>
          </div>

          
          <div className="right-pane glass">
            
            <div className="bar-group compact">
              <div className="bar-label-row">
                <span className="bar-label">Average</span>
                <span className="bar-val">{avgPostureScore.toFixed(1)}/10</span>
              </div>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{ width: `${(avgPostureScore / 10) * 100}%` }}
                />
              </div>

              <div className="bar-label-row">
                <span className="bar-label">Current</span>
                <span className="bar-val">{postureScore.toFixed(1)}/10</span>
              </div>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{ width: `${(postureScore / 10) * 100}%` }}
                />
              </div>
            </div>
            <div className="hint smallpad">
              Alerts after {POSTURE_ALERT_AFTER}s under {POSTURE_BAD_THRESHOLD}/10
            </div>
          </div>
        </section>
      )}

      {wantsFocus && !wantsPosture && (
        <section className="hero-row">
          <div className="focus-card glass">
            
            <div className="focus-gauge compact">
              <svg viewBox="0 0 160 160" className="gauge-svg">
                <defs>
                  <linearGradient id="fg2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#8e44ad" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="66" className="gauge-bg" />
                <circle
                  cx="80" cy="80" r="66"
                  className="gauge-fg"
                  style={{
                    strokeDasharray: `${(focusPercent / 100) * 414} 414`,
                    stroke: "url(#fg2)"
                  }}
                />
                <text x="80" y="88" textAnchor="middle" className="gauge-text">
                  {focusPercent}%
                </text>
              </svg>
            </div>
            <div className="kv-row stacked tighter">
              <div className="kv">
                <div className="kv-label">Focused</div>
                <div className="kv-value">{formatHMS(focusedSeconds)}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Away</div>
                <div className="kv-value">{formatHMS(unfocusedSeconds)}</div>
              </div>
            </div>
          </div>

          <div className="right-pane glass">
            <div className="right-title small">Focus Stats</div>
            <div className="kv-col tight">
              <div className="kv">
                <div className="kv-label">Focused</div>
                <div className="kv-value">{formatHMS(focusedSeconds)}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Away</div>
                <div className="kv-value">{formatHMS(unfocusedSeconds)}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Average Focus</div>
                <div className="kv-value">{focusPercent}%</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {!wantsFocus && wantsPosture && (
        <section className="hero-row single">
          <div className="posture-only glass">
            
            <div className="bar-group compact">
              <div className="bar-label-row">
                <span className="bar-label">Average</span>
                <span className="bar-val">{avgPostureScore.toFixed(1)}/10</span>
              </div>
              <div className="bar bar-lg">
                <div
                  className="bar-fill"
                  style={{ width: `${(avgPostureScore / 10) * 100}%` }}
                />
              </div>

              <div className="bar-label-row">
                <span className="bar-label">Current</span>
                <span className="bar-val">{postureScore.toFixed(1)}/10</span>
              </div>
              <div className="bar bar-lg">
                <div
                  className="bar-fill"
                  style={{ width: `${(postureScore / 10) * 100}%` }}
                />
              </div>
            </div>
            <div className="hint center smallpad">
              Alerts after {POSTURE_ALERT_AFTER}s under {POSTURE_BAD_THRESHOLD}/10
            </div>
          </div>
        </section>
      )}

      <footer className="tracking-footer glass">
        <div className="footer-left">
          <div className="footer-title">Session running</div>
          <div className="footer-sub">
            {wantsFocus && <span className="tag">Focus</span>}
            {wantsPosture && <span className="tag">Posture</span>}
            {advancedCoaching && <span className="tag">Advanced Coaching</span>}
          </div>

          {advancedCoaching && (
            <div className="mini-chips">
              <span className="chip">Fatigue: {fatigueScore.toFixed(1)}/10</span>
              <span className="chip">Stress: {stressScore.toFixed(1)}/10</span>
            </div>
          )}
        </div>

        {modal ? (
          <div className="footer-actions">
            <button
              className="btn ghost"
              onClick={() => {
                setModal(null);
                navigate("/guidedbreaks");
              }}
            >
              Go to Guided Breaks
            </button>
            <button className="btn primary" onClick={resumeAfterModal}>
              Resume
            </button>
          </div>
        ) : endModal ? (
          <div className="footer-actions">
            <button
              className="btn primary"
              onClick={() => {
                setEndModal(false);
                if (handleEndSessionRef.current) handleEndSessionRef.current();
              }}
            >
              Go to Session Summary
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setEndModal(false);
                stopEndAlarm();
              }}
            >
              Continue Session
            </button>
          </div>
        ) : (
          <button className="btn primary" onClick={handleEndSession}>End Session</button>
        )}
      </footer>

      
      {modal && (
        <div className="overlay">
          <div className="modal glass">
            <h3>{modal.title}</h3>
            <p>{modal.body}</p>
            <div className="modal-actions">
              <button
                className="btn ghost"
                onClick={() => {
                  setModal(null);
                  navigate("/guidedbreaks");
                }}
              >
                Take a Guided Break
              </button>
              <button className="btn primary" onClick={resumeAfterModal}>Resume</button>
            </div>
          </div>
        </div>
      )}

      
      {endModal && (
        <div className="overlay" onClick={stopEndAlarm}>
          <div className="modal glass">
            <h3>Time’s up</h3>
            <p>Your session timer has ended.</p>
            <div className="modal-actions">
              <button
                className="btn primary"
                onClick={() => {
                  setEndModal(false);
                  if (handleEndSessionRef.current) handleEndSessionRef.current();
                }}
              >
                Go to Session Summary
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setEndModal(false);
                  stopEndAlarm();
                }}
              >
                Continue Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
