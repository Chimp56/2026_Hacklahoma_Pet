import React from 'react';
import { Link } from "react-router-dom";

export default function RegisterPet() {
  
  const colors = {
    bgGradient: 'linear-gradient(135deg, #E0E7FF 0%, #F3E8FF 100%)',
    primary: '#A78BFA',
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
    marginTop: '20px'
  };

  const inputStyle = {
    width: '100%', 
    padding: '14px', 
    marginBottom: '10px', 
    backgroundColor: colors.inputBg, 
    border: `1px solid ${colors.border}`, 
    borderRadius: '12px', 
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    color: colors.textMain,
    fontFamily: 'inherit'
  };

  return (
    <div style={{ 
      minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: colors.bgGradient, fontFamily: 'sans-serif', padding: '20px'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '450px', backgroundColor: '#FFFFFF', borderRadius: '40px', 
        padding: '40px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)' 
      }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: colors.textMain }}>Register Your Pet</h1>
          <p style={{ color: colors.textMuted, marginTop: '8px', fontSize: '15px' }}>
            Tell us about your furry friend!
          </p>
        </div>

        {/* Pet Registration Fields */}
        <div style={{ textAlign: 'left' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Pet Name</label>
          <input type="text" placeholder="e.g. Buddy" style={inputStyle} />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Animal</label>
              <select style={inputStyle}>
                <option>Dog</option>
                <option>Cat</option>
                <option>Bird</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Gender</label>
              <select style={inputStyle}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Breed</label>
              <input type="text" placeholder="e.g. Golden Retriever" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Age</label>
              <input type="number" placeholder="Years" style={inputStyle} />
            </div>
          </div>

          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Medical History</label>
          <textarea 
            placeholder="List any allergies, past surgeries, or chronic conditions..." 
            style={{ ...inputStyle, height: '100px', resize: 'none' }} 
          />
        </div>

        {/* FINISH REGISTRATION -> HOME */}
        <Link to="/home" style={buttonStyle}>
          Complete Registration
        </Link>

        <p style={{ marginTop: '20px', fontSize: '14px', color: colors.textMuted }}>
          Want to do this later? <Link to="/home" style={{ color: colors.primary, textDecoration: 'none' }}>Skip for now</Link>
        </p>

      </div>
    </div>
  );
}
