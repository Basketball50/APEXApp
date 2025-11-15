import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TrackingSetup.css";

function TrackingSetup() {
  const [step, setStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [activeInfo, setActiveInfo] = useState(null);

  
  const [customMode, setCustomMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);

  
  const [additionalFeatures, setAdditionalFeatures] = useState({
    smartBreaks: false,
    stressFatigue: false,
    eyeBlink: false,
  });
  const [advancedCoaching, setAdvancedCoaching] = useState(false);

  const navigate = useNavigate();

  
  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };


  const handleTimeClick = (time) => {
    setSelectedTime(time);
    setCustomMode(false);
  };

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedTime("");
      setCustomMode(false);
    } else if (step === 3) {
      setStep(2);
    }
  };


  const toggleAdvancedBundle = () => {
    const enable = !advancedCoaching;
    setAdvancedCoaching(enable);
    setAdditionalFeatures({
      smartBreaks: enable,
      stressFatigue: enable,
      eyeBlink: enable,
    });
  };

  
  const clampCustom = (n) => Math.max(1, Math.min(240, Number.isFinite(n) ? n : 25));
  const incCustom = () => setCustomMinutes((m) => clampCustom(Number(m || 0) + 5));
  const decCustom = () => setCustomMinutes((m) => clampCustom(Number(m || 0) - 5));

  const handleContinue = () => {
    
    const timeToSend = customMode ? "Custom" : (selectedTime || "None");

    navigate("/tracking", {
      state: {
        selectedOption,
        selectedTime: timeToSend,
        customMinutes: customMode ? clampCustom(Number(customMinutes)) : undefined,
        additionalFeatures,
        advancedCoaching,
      },
    });
  };

  const toggleInfo = (id, e) => {
    e.stopPropagation();
    setActiveInfo((prev) => (prev === id ? null : id));
  };

  const closeInfo = () => setActiveInfo(null);

  const suiteEnabled =
    additionalFeatures.smartBreaks &&
    additionalFeatures.stressFatigue &&
    additionalFeatures.eyeBlink;

  return (
    <div
      className="tracking-setup"
      style={{ backgroundImage: "url('/TrackingBackground.png')" }}
      onClick={closeInfo}
    >
      <div className="tracking-overlay" onClick={(e) => e.stopPropagation()}>
        
        {step > 1 && (
          <button className="top-back-button" onClick={handleBack}>
            Back
          </button>
        )}

        
        {step === 1 && (
          <>
            <h1 className="setup-title">Select Type of Tracking</h1>
            <div className="option-container">
              {["Focus", "Posture", "Focus & Posture"].map((option) => (
                <div
                  key={option}
                  className={`option-card ${
                    selectedOption === option ? "selected" : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </div>
              ))}
            </div>
            {selectedOption && (
              <div className="step-buttons single-center">
                <button className="continue-button" onClick={handleNextStep}>
                  Next
                </button>
              </div>
            )}
          </>
        )}

      
        {step === 2 && (
          <>
            <h2 className="setup-subtitle">Select Time Period of Session</h2>
            <p className="setup-note">
              *You can end your session whenever needed
            </p>

            <div className="time-container">
              {["30m", "1h", "1h 30m", "2h"].map((time) => (
                <div
                  key={time}
                  className={`time-card ${
                    selectedTime === time && !customMode ? "selected" : ""
                  }`}
                  onClick={() => handleTimeClick(time)}
                >
                  {time}
                </div>
              ))}

              
              <div
                className={`time-card ${customMode ? "selected" : ""}`}
                onClick={() => {
                  setCustomMode(true);
                  setSelectedTime(""); 
                }}
              >
                <div>Custom</div>

                {customMode && (
                  <>
                    <div
                      className="custom-inline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="stepper-btn"
                        type="button"
                        onClick={decCustom}
                        aria-label="Decrease minutes"
                      >
                        –
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={customMinutes}
                        onChange={(e) =>
                          setCustomMinutes(
                            clampCustom(Number(e.target.value) || 0)
                          )
                        }
                        className="custom-input"
                        aria-label="Custom minutes"
                      />
                      <span className="custom-suffix">min</span>
                      <button
                        className="stepper-btn"
                        type="button"
                        onClick={incCustom}
                        aria-label="Increase minutes"
                      >
                        +
                      </button>
                    </div>
                    <div className="custom-hint">Range: 1–240 minutes</div>
                  </>
                )}
              </div>
            </div>

            <div className="step-buttons single-center">
              {(selectedTime || customMode) && (
                <button className="continue-button" onClick={handleNextStep}>
                  Next
                </button>
              )}
            </div>
          </>
        )}

        
        {step === 3 && (
          <>
            <h2 className="setup-subtitle">Additional Features</h2>
            <p className="setup-note">
              Advanced Coaching bundles Smart Breaks, Stress &amp; Fatigue
              Detection, and Eye Strain &amp; Blink Monitoring.
            </p>

            <div className="time-container">
              <div
                className={`time-card ${suiteEnabled ? "selected" : ""}`}
                onClick={toggleAdvancedBundle}
              >
               
                Advanced Coaching
                <span
                  className="info-icon"
                  onClick={(e) => toggleInfo("advancedSuite", e)}
                >
                  i
                </span>
                {activeInfo === "advancedSuite" && (
                  <div className="inline-info-box">
                    Enables <strong>Smart Break Recommendations</strong>,{" "}
                    <strong>Stress &amp; Fatigue Detection</strong>, and{" "}
                    <strong>Eye Strain &amp; Blink Monitoring</strong> together.
                    Click to toggle on/off.
                  </div>
                )}
              </div>
            </div>

            <div className="step-buttons single-center">
              <button className="continue-button" onClick={handleContinue}>
                Start Tracking
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TrackingSetup;
