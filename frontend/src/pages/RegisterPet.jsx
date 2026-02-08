import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { usePet } from '../PetContext'; // Import the hook

export default function RegisterPet() {
  const navigate = useNavigate();
  const { pets, setPets, setActivePet } = usePet(); // Get access to global state

  // State for the form
  const [formData, setFormData] = useState({
    name: '',
    animal: 'Dog',
    gender: 'Male',
    breed: '',
    age: '',
    medical: ''
  });

  const colors = {
    bgGradient: 'linear-gradient(135deg, #E0E7FF 0%, #F3E8FF 100%)',
    primary: '#A78BFA',
    textMain: '#1E293B',
    textMuted: '#94A3B8',
    inputBg: '#F8FAFC',
    border: '#E2E8F0'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Choose emoji based on animal type
    const emojis = { Dog: '🐶', Cat: '🐱', Bird: '🦜', Other: '🐾' };

    const newPet = {
      id: Date.now(),
      name: formData.name,
      type: formData.animal,
      breed: formData.breed,
      image: emojis[formData.animal] || '🐾',
      // Generate unique stats for this new pet
      stats: {
        sleepHours: Math.floor(Math.random() * 6) + 8, // Random 8-14 hours
        activityData: Array.from({ length: 7 }, () => Math.floor(Math.random() * 8) + 4) // Random 4-12 hours per day
      }
    };

    // Update global list and set this new pet as active
    const updatedPets = [...pets, newPet];
    setPets(updatedPets);
    setActivePet(newPet);

    // Redirect to home
    navigate('/home');
  };

  const buttonStyle = {
    display: 'block',
    width: '100%',
    padding: '16px',
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontWeight: 'bold',
    fontSize: '18px',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(167, 139, 250, 0.2)',
    boxSizing: 'border-box',
    cursor: 'pointer',
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
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: colors.bgGradient, 
      fontFamily: 'sans-serif', 
      padding: '20px',
      paddingTop: '90px', 
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        backgroundColor: '#FFFFFF', 
        borderRadius: '40px', 
        padding: '40px', 
        textAlign: 'center', 
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
        marginBottom: '40px'
      }}>
        
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: colors.textMain }}>Register Your Pet</h1>
          <p style={{ color: colors.textMuted, marginTop: '8px', fontSize: '15px' }}>
            Tell us about your furry friend!
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Pet Name</label>
          <input 
            type="text" 
            required
            placeholder="e.g. Buddy" 
            style={inputStyle} 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Animal</label>
              <select 
                style={inputStyle} 
                value={formData.animal}
                onChange={(e) => setFormData({...formData, animal: e.target.value})}
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Gender</label>
              <select 
                style={inputStyle}
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Breed</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Golden Retriever" 
                style={inputStyle} 
                value={formData.breed}
                onChange={(e) => setFormData({...formData, breed: e.target.value})}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Age</label>
              <input 
                type="number" 
                placeholder="Years" 
                style={inputStyle} 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
            </div>
          </div>

          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Medical History</label>
          <textarea 
            placeholder="List any allergies, past surgeries, or chronic conditions..." 
            style={{ ...inputStyle, height: '100px', resize: 'none' }} 
            value={formData.medical}
            onChange={(e) => setFormData({...formData, medical: e.target.value})}
          />

          <button type="submit" style={buttonStyle}>
            Complete Registration
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: colors.textMuted }}>
          Want to do this later? <Link to="/home" style={{ color: colors.primary, textDecoration: 'none' }}>Skip for now</Link>
        </p>
      </div>
    </div>
  );
}