import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import "./AuthPage.css";

function AuthPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [error, setError] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "signup") {
      setIsLogin(false);
    }
  }, [location.search]);

  const toggleForm = () => setIsLogin(!isLogin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (!userCredential.user.displayName && name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(userCredential.user, { displayName: name });
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        backgroundImage: "url('/AuthPageBackground.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="auth-header">
        <img src="/ApexLogoOne.png" alt="Apex Logo" className="auth-logo" />
        <span className="auth-brand">APEX</span>
      </div>

      <div className="auth-container">
        <h1>{isLogin ? "Login" : "Sign Up"}</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>

        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span className="toggle-link" onClick={toggleForm}>
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;