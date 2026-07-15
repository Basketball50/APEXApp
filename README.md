APEX — Focus & Posture Coach (Web)

APEX is a React web app that uses your webcam to track focus and posture in real time, gives gentle nudges when you drift or slump, and recommends short, science-backed guided breaks. It also computes fatigue and stress proxies (blink rate, PERCLOS, yawns, brow furrow, focus flips) and logs session summaries for review.

Problem

During deep work, attention drifts and posture deteriorates, which reduces productivity and causes strain. Most tools either block websites or provide after-the-fact analytics without in-moment guidance.

Solution

APEX analyzes webcam landmarks locally in the browser to estimate focus/posture continuously, triggers timely nudges, and suggests targeted breaks (box breathing, PMR, mindful stretching, guided visualization). It stores per-session stats and trends so users can improve habits over time.

Expected Impact

Help students and professionals maintain focus longer, reduce physical discomfort from poor posture, and take effective micro-breaks that improve sustained performance.

Tech Stack

React (SPA with react-router)

MediaPipe Pose and Face Mesh (+ camera_utils)

Web Audio / Web Speech for chime + optional TTS

LocalStorage for client-side session history

Firebase (Authentication; required because the app imports firebase.js)

Prerequisites

Node.js 18+ and npm 9+

A Chromium-based browser with camera permission

A Firebase project (Web app) with Authentication enabled (e.g., Email/Password or Google)

Installation

Clone and install

git clone <your-repo-url>
cd <your-repo>
npm install


Required packages (if not already in package.json)

npm i react react-dom react-router-dom
npm i @mediapipe/pose @mediapipe/face_mesh @mediapipe/camera_utils
npm i firebase


Create src/firebase.js (required)

// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_AUTH_DOMAIN",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


Verify imports used in the app (examples)

// MediaPipe in Tracking.js
import { Pose } from "@mediapipe/pose";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

// Routing
import { BrowserRouter } from "react-router-dom";

// Screen styles (examples)
import "./Tracking.css";
import "./Dashboard.css";
import "./PerformanceStats.css";
import "./SessionSummary.css";


Start the dev server

npm start


Open the printed localhost URL in your browser and allow camera access.

Usage

Start Session → choose Focus, Posture, or Both; set duration; optionally use Advanced Coaching.

Keep your face and upper body visible; APEX tracks in real time and nudges when focus dips or posture slumps.

After repeated nudges, APEX suggests a specific break:

Focus issues → Box Breathing or Guided Visualization

Posture issues → PMR or Mindful Stretching

High fatigue/stress → longer break (e.g., short walk, power nap)

End or let the timer expire to see Session Summary. Use Dashboard and Performance Stats to view trends.

## Doctronic Update Smoke Test

This line verifies that Doctronic can pull a fresh APEX commit and update the KB.
