import React from 'react';
import { Link } from "react-router-dom";

export default function Navbar() {
  const colors = {
    primary: '#A78BFA', // Soft Purple to match your buttons
    textMain: '#1E293B',
    textMuted: '#64748B',
    bg: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
    border: '#E2E8F0'
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 40px',
    backgroundColor: colors.bg,
    backdropFilter: 'blur(10px)', // Soft glass effect
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    fontFamily: 'sans-serif'
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: '900',
    color: colors.textMain,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const linkStyle = {
    textDecoration: 'none',
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: '15px',
    marginRight: '25px',
    transition: 'color 0.2s'
  };

  const btnStyle = {
    textDecoration: 'none',
    backgroundColor: colors.primary,
    color: 'white',
    padding: '10px 22px',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '15px',
    boxShadow: '0 4px 12px rgba(167, 139, 250, 0.2)',
    transition: 'transform 0.2s'
  };

  return (
    <nav style={navStyle}>
      <div className="nav-left">
        <Link to="/" style={logoStyle}>
          <span style={{ fontSize: '24px' }}>🐾</span> PetPulse
        </Link>
      </div>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center' }}>
        <Link 
          to="/auth" 
          style={linkStyle}
          onMouseOver={(e) => e.target.style.color = colors.primary}
          onMouseOut={(e) => e.target.style.color = colors.textMuted}
        >
          Login
        </Link>
        
        <Link 
          to="/create-profile" 
          style={btnStyle}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}