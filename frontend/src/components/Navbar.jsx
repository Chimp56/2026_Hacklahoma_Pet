import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const colors = {
    primary: '#A78BFA', // Soft Purple
    textMain: '#1E293B',
    textMuted: '#64748B',
    bg: 'rgba(255, 255, 255, 0.95)',
    border: '#E2E8F0'
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    height: '70px',
    backgroundColor: colors.bg,
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${colors.border}`,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1100,
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box'
  };

  const logoStyle = {
    fontSize: "24px",
    fontWeight: "900",
    color: colors.textMain,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const linkStyle = {
    textDecoration: "none",
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: "15px",
    marginRight: "25px",
  };

  const btnStyle = {
    textDecoration: "none",
    backgroundColor: colors.primary,
    color: "white",
    padding: "10px 22px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "15px",
    boxShadow: "0 4px 12px rgba(167, 139, 250, 0.2)",
  };

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle}>
        <span style={{ fontSize: "24px" }}>🐾</span> PetPulse
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {isAuthenticated ? (
          <>
            <Link to="/home" style={linkStyle}>
              Dashboard
            </Link>
            <span style={{ color: colors.textMuted, fontSize: "14px" }}>
              {user?.name || user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                ...linkStyle,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#EF4444",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/auth" style={linkStyle}>
              Login
            </Link>
            <Link to="/create-profile" style={btnStyle}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}