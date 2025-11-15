import './FAQ.css';
import { useState } from 'react';

export default function FAQ() {
  const faqData = [
    {
      question: "What is APEX?",
      answer: [
        "APEX is a productivity and health tracking app.",
        "It monitors focus, posture, stress, fatigue, and eye health.",
        "It helps users optimize their work performance while maintaining well-being."
      ]
    },
    {
      question: "How does focus tracking work?",
      answer: [
        "Monitors attention levels during work sessions.",
        "Provides subtle alerts to regain focus if attention drops.",
        "Helps maintain consistent productivity."
      ]
    },
    {
      question: "Can APEX help with posture?",
      answer: [
        "Yes, it detects slouching or bad posture.",
        "Provides real-time alerts to correct your position.",
        "Helps prevent back and neck strain."
      ]
    },
    {
      question: "Does it track eye strain?",
      answer: [
        "Yes, it monitors blink rate and screen usage.",
        "Alerts you when you need to rest your eyes.",
        "Encourages healthy viewing habits."
      ]
    },
    {
      question: "Are breaks recommended automatically?",
      answer: [
        "APEX suggests smart breaks based on your work intensity.",
        "Includes guided stretches and exercises.",
        "Helps prevent fatigue and burnout."
      ]
    },
    {
      question: "Can I track my performance?",
      answer: [
        "Yes, APEX tracks focus, efficiency, and health metrics.",
        "Provides visual reports and insights.",
        "Helps identify areas for improvement."
      ]
    },
    {
      question: "Does it detect stress and fatigue?",
      answer: [
        "Yes, it monitors physical and mental stress indicators.",
        "Provides alerts when fatigue is detected.",
        "Helps you manage workload and take breaks on time."
      ]
    },
    {
      question: "Is it suitable for long work sessions?",
      answer: [
        "Yes, it adapts to your rhythm and work patterns.",
        "Encourages breaks and posture adjustments.",
        "Maintains productivity without compromising health."
      ]
    },
    {
      question: "Can I customize alerts and sessions?",
      answer: [
        "Yes, you can adjust focus session lengths and alert sensitivity.",
        "Customize break types and frequency.",
        "Tailor APEX to your personal work habits."
      ]
    },
    {
      question: "Is APEX easy to use?",
      answer: [
        "Yes, it has a clean interface with guided instructions.",
        "All metrics and alerts are easy to understand.",
        "Designed to enhance productivity without distraction."
      ]
    }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAnswer = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <h1 className="faq-main-title">FAQ</h1>
      {faqData.map((item, index) => (
        <div key={index} className="faq-item">
          <div className="faq-question" onClick={() => toggleAnswer(index)}>
            <span className={`arrow ${activeIndex === index ? 'open' : ''}`}>&#9654;</span>
            <span className="faq-question-text">{item.question}</span>
          </div>
          {activeIndex === index && (
            <ul className="faq-answer">
              {item.answer.map((ans, i) => (
                <li key={i}>{ans}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}