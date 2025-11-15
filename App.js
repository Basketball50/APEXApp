import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import Tracking from './Tracking';
import TrackingSetup from './TrackingSetup';
import SessionSummary from './SessionSummary';
import WhyAPEX from './WhyAPEX';
import FAQ from './FAQ';
import GuidedBreaks from './GuidedBreaks';
import BoxBreathing from './BoxBreathing';
import PMR from './PMR';
import FocusGuide from './FocusGuide';
import SelectivePick from './SelectivePick';
import MindfulStretching from './MindfulStretching';
import DualNBack from './DualNBack';
import Profile from './Profile';
import MultipleObject from './MultipleObject';
import PerformanceStats from './PerformanceStats'; 
import SustainedAttention from './SustainedAttention'; 

function LandingPage() {
  const texts = [
    <> <span className="highlight">Focus</span> & <span className="highlight">Posture</span> Tracking </>,
    <> Eye <span className="highlight">Strain</span> & <span className="highlight">Blink</span> Monitoring </>,
    <> <span className="highlight">Stress</span> & <span className="highlight">Fatigue</span> Detection </>,
    <> <span className="highlight">Work Speed/</span><span className="highlight">Efficiency</span> Analysis </>,
    <> <span className="highlight">Adaptive</span> Focus Sessions </>,
    <> <span className="highlight">Guided Breaks</span> to Reduce <span className="highlight">Burnout</span> </>,
    <> <span className="highlight">Lessons</span> to Boost <span className="highlight">Focus</span> </>,
    <> <span className="highlight">Smart Breaks</span> Recommendations </>,
    <> <span className="highlight">Performance</span> Tracking </>
  ];

  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const sectionsRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTextIndex(prev => (prev + 1) % texts.length);
        setFade(true);
      }, 500);
    }, 2500);
    return () => clearInterval(interval);
  }, [texts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.2 }
    );

    const currentSections = sectionsRef.current;
    currentSections.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      currentSections.forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="App">
      <div className="top-left-nav">
        <img src="/ApexLogoOne.png" alt="Apex Logo" className="small-logo" />
        <nav className="nav-links">
          <Link to="/whyapex">Why APEX</Link>
          <Link to="#">Pricing</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
      </div>

      <div className="top-right-links">
        <Link to="/auth">Login | Signup</Link>
      </div>

      <div className="animated-text-container">
        <div className={`animated-text ${fade ? 'fade-in' : 'fade-out'}`}>
          {texts[currentTextIndex]}
        </div>
      </div>

      <section className="main-header">
        <div className="main-content">
          <div className="title-container">
            <h1 className="title">APEX</h1>
            <img src="/ApexLogoOne.png" alt="Apex Logo" className="logo" />
          </div>
          <p className="subtitle">Peak Performance & Health</p>
          <Link to="/auth?mode=signup">
            <button className="main-button">Get Started</button>
          </Link>
        </div>
      </section>

      <section
        className="section"
        style={{
          backgroundImage: "url('/SectionTwoBackground.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="section-inner fade-in-section" ref={el => (sectionsRef.current[0] = el)}>
          <h2 className="section-heading">Boost Your Performance</h2>
          <div className="text-box">
            <ul className="section-description">
              <li>Real-time focus tracking with gentle alerts</li>
              <li>Work speed & efficiency analysis</li>
              <li>Adaptive focus sessions tailored to your rhythm</li>
              <li>Guided routines to improve cognitive performance & focus</li>
              <li>Smart break recommendations to maximize productivity</li>
              <li>Performance tracking & insights for improvement</li>
            </ul>
          </div>
        </div>
      </section>

      <section
        className="section"
        style={{
          backgroundImage: "url('/SectionOneBackground.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="section-inner fade-in-section" ref={el => (sectionsRef.current[1] = el)}>
          <h2 className="section-heading">Improve Your Health</h2>
          <div className="text-box">
            <ul className="section-description">
              <li>Posture monitoring and correction alerts</li>
              <li>Stress Detection & Fatigue Detection</li>
              <li>Eye strain & blink monitoring for healthier vision</li>
              <li>Guided breaks to prevent fatigue and muscle strain</li>
              <li>Insights to optimize comfort and reduce long-term health risks</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/trackingsetup" element={<TrackingSetup />} />
        <Route path="/summary" element={<SessionSummary />} />
        <Route path="/whyapex" element={<WhyAPEX />} />
        <Route path="/faq" element={<FAQ />} />

        <Route path="/guidedbreaks" element={<GuidedBreaks />} />
        <Route path="/boxbreathing" element={<BoxBreathing />} />
        <Route path="/pmr" element={<PMR />} />
        <Route path="/mindfulstretching" element={<MindfulStretching />} />

        <Route path="/focusguide" element={<FocusGuide />} />
        <Route path="/selectivepick" element={<SelectivePick />} />
        <Route path="/dualnback" element={<DualNBack />} />
        <Route path="/multipleobject" element={<MultipleObject />} />
        <Route path="/sustainedattention" element={<SustainedAttention />} /> 

        <Route path="/performancestats" element={<PerformanceStats />} /> 

        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
