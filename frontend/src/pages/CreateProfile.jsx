import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function CreateProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const colors = {
    bgGradient: "linear-gradient(135deg, #E0E7FF 0%, #F3E8FF 100%)",
    primary: "#A78BFA",
    textMain: "#1E293B",
    textMuted: "#94A3B8",
    inputBg: "#F8FAFC",
    border: "#E2E8F0",
  };

  const buttonStyle = {
    display: "block",
    width: "100%",
    padding: "16px",
    background: colors.primary,
    color: "white",
    borderRadius: "16px",
    fontWeight: "bold",
    fontSize: "18px",
    textAlign: "center",
    boxSizing: "border-box",
    cursor: loading ? "not-allowed" : "pointer",
    border: "none",
    marginTop: "10px",
    opacity: loading ? 0.8 : 1,
  };

  const inputStyle = {
    width: "100%",
    padding: "16px",
    marginBottom: "12px",
    backgroundColor: colors.inputBg,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none",
    color: colors.textMain,
  };

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    navigate("/register-pet", { replace: true });
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: colors.bgGradient, 
      fontFamily: 'sans-serif',
      marginTop: '70px' // 👈 Added marginTop: 70
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        backgroundColor: '#FFFFFF', 
        borderRadius: '40px', 
        padding: '50px 40px', 
        textAlign: 'center', 
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)' 
      }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '35px' }}>
          <div style={{ 
            background: '#F5F3FF', 
            width: '70px', 
            height: '70px', 
            borderRadius: '22px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            <span style={{ fontSize: '35px' }}>🐾</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "900", color: colors.textMain }}>
            Join PetPulse
          </h1>
          <p style={{ color: colors.textMuted, marginTop: "8px", fontSize: "16px" }}>
            Start your journey today!
          </p>
        </div>

        {error && (
          <p
            style={{
              marginBottom: "16px",
              padding: "12px",
              background: "#FEE2E2",
              color: "#B91C1C",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            autoComplete="name"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            autoComplete="new-password"
          />
          <button type="submit" style={buttonStyle} >
            Create Profile
          </button>
        </form>

        <p style={{ marginTop: "30px", fontSize: "15px", color: colors.textMuted }}>
          Already have an account?{" "}
          <Link to="/auth" style={{ color: colors.primary, fontWeight: "bold", textDecoration: "none" }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}