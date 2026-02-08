import React, { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { usePet } from '../PetContext';
import api, { pets as petsApi } from '../api/api';

export default function RegisterPet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pets, setPets, setActivePet } = usePet();
  const fileInputRef = useRef(null);

  const petToEdit = location.state?.petToEdit;

  const [formData, setFormData] = useState({
    name: petToEdit?.name || '',
    animal: petToEdit?.type || 'Dog',
    gender: petToEdit?.gender || 'Male',
    breed: petToEdit?.breed || '',
    age: petToEdit?.age || '',
    weight: petToEdit?.weight ?? '',
    medical: petToEdit?.medical || '',
  });
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(
    petToEdit?.profile_photo_url || (petToEdit?.image?.startsWith?.('http') ? petToEdit.image : null)
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const colors = {
    bgGradient: 'linear-gradient(135deg, #E0E7FF 0%, #F3E8FF 100%)',
    primary: '#A78BFA',
    textMain: '#1E293B',
    textMuted: '#94A3B8',
    inputBg: '#F8FAFC',
    border: '#E2E8F0'
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    if (!file) {
      setProfileFile(null);
      setProfilePreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image (JPEG, PNG, WebP, or GIF).');
      return;
    }
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  function apiPetToFrontend(apiPet) {
    const emojis = { Dog: '🐶', Cat: '🐱', Bird: '🦜', Other: '🐾' };
    const species = apiPet.species || 'Other';
    return {
      id: apiPet.id,
      name: apiPet.name,
      type: species,
      breed: apiPet.breed ?? '',
      gender: apiPet.gender ?? '',
      age: apiPet.date_of_birth ?? '',
      weight: apiPet.weight ?? '',
      medical: apiPet.health_notes ?? '',
      image: apiPet.profile_photo_url || emojis[species] || '🐾',
      profile_photo_url: apiPet.profile_photo_url ?? null,
      stats: apiPet.stats ?? { sleepHours: 8, activityData: [8, 7, 9, 11, 8, 10, 8] },
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      name: formData.name,
      species: formData.animal,
      breed: formData.breed || null,
      gender: formData.gender || null,
      date_of_birth: formData.age || null,
      health_notes: formData.medical || null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
    };

    if (petToEdit?.id) {
      try {
        const updated = await petsApi.update(petToEdit.id, body);
        const frontendPet = apiPetToFrontend(updated);
        setPets(prev => prev.map(p => p.id === petToEdit.id ? { ...p, ...frontendPet } : p));
        setActivePet(prev => (prev?.id === petToEdit.id ? { ...prev, ...frontendPet } : prev));

        if (profileFile) {
          setPhotoUploading(true);
          setPhotoError('');
          try {
            const data = await petsApi.uploadProfilePicture(petToEdit.id, profileFile);
            const url = data.profile_picture_url || data.url;
            if (url) {
              setPets(prev => prev.map(p => p.id === petToEdit.id ? { ...p, image: url, profile_photo_url: url } : p));
              setActivePet(prev => (prev?.id === petToEdit.id ? { ...prev, image: url, profile_photo_url: url } : prev));
            }
          } catch (err) {
            setPhotoError(err.message || err.detail || 'Photo upload failed.');
            setPhotoUploading(false);
            return;
          }
          setPhotoUploading(false);
        }
      } catch (err) {
        setPhotoError(err.message || err.detail || 'Save failed.');
        return;
      }
    } else {
      try {
        const created = await petsApi.create(body);
        const frontendPet = apiPetToFrontend(created);
        setPets(prev => [...prev, frontendPet]);
        setActivePet(frontendPet);
        if (profileFile && created.id) {
          setPhotoUploading(true);
          try {
            const data = await petsApi.uploadProfilePicture(created.id, profileFile);
            const url = data.profile_picture_url || data.url;
            if (url) {
              setPets(prev => prev.map(p => p.id === created.id ? { ...p, image: url, profile_photo_url: url } : p));
              setActivePet(prev => (prev?.id === created.id ? { ...prev, image: url, profile_photo_url: url } : prev));
            }
          } catch (_) {}
          setPhotoUploading(false);
        }
      } catch (err) {
        setPhotoError(err.message || err.detail || 'Registration failed.');
        return;
      }
    }

    navigate('/home');
  };

  const buttonStyle = {
    display: 'block', width: '100%', padding: '16px', background: colors.primary,
    color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold',
    fontSize: '18px', textAlign: 'center', boxShadow: '0 8px 20px rgba(167, 139, 250, 0.2)',
    boxSizing: 'border-box', cursor: 'pointer', marginTop: '20px'
  };

  const inputStyle = {
    width: '100%', padding: '14px', marginBottom: '10px', backgroundColor: colors.inputBg, 
    border: `1px solid ${colors.border}`, borderRadius: '12px', fontSize: '15px',
    boxSizing: 'border-box', outline: 'none', color: colors.textMain, fontFamily: 'inherit'
  };

  return (
    <div style={{ 
      minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', background: colors.bgGradient, fontFamily: 'sans-serif', 
      padding: '20px', paddingTop: '90px', boxSizing: 'border-box'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '450px', backgroundColor: '#FFFFFF', 
        borderRadius: '40px', padding: '40px', textAlign: 'center', 
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)', marginBottom: '40px'
      }}>
        
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: colors.textMain }}>
            {petToEdit ? 'Edit Profile' : 'Register Your Pet'}
          </h1>
          <p style={{ color: colors.textMuted, marginTop: '8px', fontSize: '15px' }}>
            {petToEdit ? `Updating info for ${petToEdit.name}` : 'Tell us about your furry friend!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Pet Name</label>
          <input 
            type="text" required placeholder="e.g. Buddy" style={inputStyle} 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Animal</label>
              <select 
                style={inputStyle} value={formData.animal}
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
                style={inputStyle} value={formData.gender}
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
                type="text" required placeholder="e.g. Golden Retriever" style={inputStyle} 
                value={formData.breed}
                onChange={(e) => setFormData({...formData, breed: e.target.value})}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Age</label>
              <input 
                type="number" placeholder="Years" style={inputStyle} 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
            </div>
          </div>

          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Weight (lbs)</label>
          <input 
            type="number" step="0.1" min="0" placeholder="e.g. 25" style={inputStyle} 
            value={formData.weight}
            onChange={(e) => setFormData({...formData, weight: e.target.value})}
          />

          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px' }}>Medical History</label>
          <textarea 
            placeholder="List any allergies, past surgeries, or chronic conditions..." 
            style={{ ...inputStyle, height: '100px', resize: 'none' }} 
            value={formData.medical}
            onChange={(e) => setFormData({...formData, medical: e.target.value})}
          />

          <label style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textMain, marginLeft: '5px', display: 'block', marginTop: '16px' }}>
            Profile picture (optional)
          </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: colors.inputBg,
                    border: `2px dashed ${colors.border}`,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {profilePreview ? (
                    <img src={profilePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '24px', color: colors.textMuted }}>🐾</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: colors.inputBg,
                      color: colors.primary,
                      border: `1px solid ${colors.border}`,
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {profileFile ? 'Change photo' : 'Choose photo'}
                  </button>
                  {profileFile && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: colors.textMuted }}>{profileFile.name}</p>
                  )}
                </div>
              </div>
          {photoError && <p style={{ margin: 0, fontSize: '13px', color: '#EF4444' }}>{photoError}</p>}

          <button type="submit" style={buttonStyle} disabled={photoUploading}>
            {photoUploading ? 'Saving…' : petToEdit ? 'Save Changes' : 'Complete Registration'}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "14px", color: colors.textMuted }}>
          Want to do this later? <Link to="/home" style={{ color: colors.primary, textDecoration: "none" }}>Skip for now</Link>
        </p>
      </div>
    </div>
  );
}