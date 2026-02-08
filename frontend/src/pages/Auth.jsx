import React from 'react';
import { Link } from "react-router-dom";

export default function Auth() {
  
  // Pastel Color Palette
  const colors = {
    bgGradient: 'linear-gradient(135deg, #E0E7FF 0%, #F3E8FF 100%)',
    primary: '#A78BFA', // Soft Purple
    textMain: '#1E293B',
    textMuted: '#94A3B8',
    inputBg: '#F8FAFC',
    border: '#E2E8F0'
  };

  const buttonStyle = {
    display: 'block',
    width: '100%',
    padding: '16px',
    background: colors.primary,
    color: 'white',
    textDecoration: 'none',
    borderRadius: '16px',
    fontWeight: 'bold',
    fontSize: '18px',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(167, 139, 250, 0.2)',
    boxSizing: 'border-box',
    cursor: 'pointer',
    border: 'none',
    marginTop: '10px'
  };

  const inputStyle = {
    width: '100%', 
    padding: '16px', 
    marginBottom: '12px', 
    backgroundColor: colors.inputBg, 
    border: `1px solid ${colors.border}`, 
    borderRadius: '16px', 
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none',
    color: colors.textMain
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: colors.bgGradient, 
      fontFamily: 'sans-serif' 
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
            <span style={{ fontSize: '35px' }}>🐶</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: colors.textMain }}>PetPulse</h1>
          <p style={{ color: colors.textMuted, marginTop: '8px', fontSize: '16px' }}>
            Welcome back, pet parent!
          </p>
        </div>

        {/* Login Fields */}
        <div style={{ marginBottom: '20px' }}>
          <input type="email" placeholder="Email Address" style={inputStyle} />
          <input type="password" placeholder="Password" style={inputStyle} />
        </div>

        {/* LOG IN -> HOME */}
        <Link to="/home" style={buttonStyle}>
          Log In
        </Link>

        {/* CREATE PROFILE -> CREATE PROFILE PAGE */}
        <p style={{ marginTop: '30px', fontSize: '15px', color: colors.textMuted }}>
          Don't have an account?{' '}
          <Link to="/create-profile" style={{ color: colors.primary, fontWeight: 'bold', textDecoration: 'none' }}>
            Create profile
          </Link>
        </p>

      </div>
    </div>
  );
}