import './WhyAPEX.css';
import { useEffect } from 'react';

export default function WhyAPEX() {
  const features = [
    {
      title: "Real-time Focus Tracking with Gentle Alerts",
      bullets: [
        "Monitors attention levels during work sessions.",
        "Provides subtle alerts to refocus without distractions.",
        "Encourages sustained productivity through real-time guidance."
      ]
    },
    {
      title: "Work Speed & Efficiency Analysis",
      bullets: [
        "Analyzes task completion times and efficiency patterns.",
        "Provides visual reports for performance tracking.",
        "Identifies productivity bottlenecks to optimize workflow."
      ]
    },
    {
      title: "Adaptive Focus Sessions",
      bullets: [
        "Customizes focus cycles based on your natural rhythm.",
        "Adjusts session lengths dynamically for maximum efficiency.",
        "Supports deep work without burnout."
      ]
    },
    {
      title: "Guided Routines for Cognitive Performance",
      bullets: [
        "Offers structured routines to boost focus.",
        "Includes mental exercises for problem-solving and memory.",
        "Supports habit-building for long-term success."
      ]
    },
    {
      title: "Smart Break Recommendations",
      bullets: [
        "Suggests optimal break times to prevent fatigue.",
        "Recommends stretches and quick recovery activities.",
        "Balances productivity with health preservation."
      ]
    },
    {
      title: "Performance Tracking & Insights",
      bullets: [
        "Tracks trends in focus, efficiency, and posture over time.",
        "Generates detailed reports for self-improvement.",
        "Provides actionable insights to refine work habits."
      ]
    },
    {
      title: "Posture Monitoring & Correction Alerts",
      bullets: [
        "Detects slouching and incorrect sitting positions.",
        "Provides gentle reminders to correct posture.",
        "Helps reduce long-term back and neck strain."
      ]
    },
    {
      title: "Stress & Fatigue Detection",
      bullets: [
        "Monitors physical and mental stress signals.",
        "Detects fatigue levels in real-time.",
        "Encourages breaks before exhaustion impacts performance."
      ]
    },
    {
      title: "Eye Strain & Blink Monitoring",
      bullets: [
        "Tracks blink frequency to detect eye strain.",
        "Prompts reminders for eye relaxation.",
        "Encourages healthy screen usage habits."
      ]
    },
    {
      title: "Guided Breaks to Prevent Fatigue",
      bullets: [
        "Provides guided stretches and breathing exercises.",
        "Reduces physical and mental fatigue during long workdays.",
        "Improves overall comfort while working."
      ]
    },
    {
      title: "Insights to Optimize Comfort & Health",
      bullets: [
        "Analyzes posture, eye health, and fatigue trends.",
        "Provides tips to reduce long-term risks.",
        "Encourages sustainable, healthy productivity."
      ]
    }
  ];

  useEffect(() => {
    const items = document.querySelectorAll('.feature');
    const currentItems = [...items];
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      { threshold: 0.2 }
    );
    currentItems.forEach(item => observer.observe(item));
    return () => currentItems.forEach(item => observer.unobserve(item));
    
  }, []);

  return (
    <div className="whyapex-page">
      <h1 className="whyapex-main-title">Why APEX</h1>

      {features.map((feature, index) => (
        <div
          key={index}
          className={`feature ${index % 2 === 0 ? 'left' : 'right'}`}
        >
          <h2 className="feature-title">{feature.title}</h2>
          <ul>
            {feature.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="conclusion feature center">
        <h2 className="feature-title">The APEX Advantage</h2>
        <p>
          APEX is more than just a productivity app — it’s your companion for
          achieving peak performance while protecting your health. By combining
          focus tracking, posture monitoring, stress detection, and guided
          routines, APEX ensures that you work smarter, not harder.
          <br /><br />
          Choose APEX for a future where productivity and well-being go hand in hand.
        </p>
      </div>
    </div>
  );
}