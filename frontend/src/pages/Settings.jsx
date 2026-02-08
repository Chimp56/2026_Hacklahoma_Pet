import React, { useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { usePet } from '../PetContext'; 

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { pets, setPets, activePet, setActivePet } = usePet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    address: "123 Paw Lane, Norman, OK",
    phone: "(405) 555-0123",
    profilePic: null 
  });

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.95)',
    primary: '#A78BFA',
    primaryDark: '#8B5CF6',
    accent: '#F5F3FF',
    textMain: '#1E293B',
    textMuted: '#64748B',
    danger: '#F87171',
    border: '#CBD5E1',
    white: '#FFFFFF'
  };

  const handleDeletePet = (id) => {
    if (pets.length === 1) {
      alert("You must have at least one pet profile!");
      return;
    }
    if (window.confirm("Are you sure you want to delete this pet? This cannot be undone.")) {
      const updatedPets = pets.filter(p => p.id !== id);
      setPets(updatedPets);
      if (activePet.id === id) {
        setActivePet(updatedPets[0]);
      }
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const sectionStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: '30px',
    padding: '35px',
    backdropFilter: 'blur(20px)',
    border: '2px solid white',
    marginBottom: '30px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
  };

  const inputStyle = {
    padding: '14px 18px',
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    marginTop: '8px',
    backgroundColor: 'rgba(255,255,255,0.5)'
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      background: colors.bgGradient, 
      fontFamily: "'Inter', sans-serif", 
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* SIDEBAR - Kept as originally designed */}
      <aside style={{ 
        width: '280px', 
        height: '100vh', 
        background: colors.sidebarBg, 
        backdropFilter: 'blur(15px)', 
        borderRight: `1px solid ${colors.border}`, 
        padding: '30px 20px', 
        position: 'fixed', 
        left: 0, 
        top: 0, 
        zIndex: 10, 
        display: 'flex', 
        flexDirection: 'column', 
        boxSizing: 'border-box' 
      }}>
        <div style={{ fontSize: '24px', fontWeight: '900', color: colors.primary, marginBottom: '30px', paddingLeft: '16px' }}>🐾 PetDash</div>
        
        <div style={{ marginBottom: '25px', position: 'relative' }}>
          <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.7, letterSpacing: '1.2px', textTransform: 'uppercase', display: 'block', marginBottom: '8px', color: colors.textMain }}>
            Active Profile
          </label>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, padding: '12px 16px', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(167, 139, 250, 0.3)', color: 'white', transition: 'all 0.2s ease' }}
          >
            <span style={{ fontSize: '24px' }}>{activePet?.image || '🐾'}</span>
            <span style={{ fontWeight: '800', flex: 1 }}>{activePet?.name}</span>
            <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </div>

          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '8px', zIndex: 1100, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
              {pets.map(pet => (
                <div key={pet.id} onClick={() => { setActivePet(pet); setIsDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', backgroundColor: activePet?.id === pet.id ? colors.accent : 'transparent', transition: 'background 0.2s ease' }}>
                  <span style={{ fontSize: '20px' }}>{pet.image}</span>
                  <span style={{ fontWeight: '700', color: colors.textMain, flex: 1 }}>{pet.name}</span>
                </div>
              ))}
              <Link to="/register-pet" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', marginTop: '4px', textDecoration: 'none', borderTop: `1px solid ${colors.border}`, color: colors.primary, fontSize: '14px', fontWeight: '700' }}>
                <span>➕</span> Add New Pet
              </Link>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>🏠 Dashboard</Link>
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📹 Monitor</Link>
          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📊 Stats</Link>
          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📅 Calendar</Link>
          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>🤝 Community</Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: `1px solid ${colors.border}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, background: 'rgba(167, 139, 250, 0.15)', fontWeight: '700', borderRadius: '12px' }}>⚙️ Account Settings</Link>
          <Link to="/auth" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', color: colors.danger, fontWeight: '700', fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}>🚪 Log Out</Link>
        </div>
      </aside>

      {/* MAIN CONTENT - FIXED WITH CALENDAR SOLUTION */}
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        marginTop: '70px', // 👈 Pushes content down below Top Nav
        height: 'calc(100vh - 70px)', // 👈 Fits scroll area perfectly
        overflowY: 'auto', 
        padding: '40px 60px', 
        zIndex: 1,
        boxSizing: 'border-box' 
      }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '900', color: colors.textMain }}>Account Settings</h1>
        </header>

        {/* 1. PERSONAL PROFILE */}
        <section style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              <div onClick={() => fileInputRef.current.click()} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', border: `4px solid white`, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', background: '#E2E8F0' }}>
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👤</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '4px 0', fontWeight: 'bold' }}>EDIT</div>
              </div>
              <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>User Information</h2>
                <p style={{ margin: 0, color: colors.textMuted, fontSize: '14px' }}>Click the icon to change your profile picture.</p>
              </div>
            </div>
            <button style={{ background: colors.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Save Profile</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '800', color: colors.textMuted }}>FULL NAME</label>
              <input style={inputStyle} value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '800', color: colors.textMuted }}>EMAIL ADDRESS</label>
              <input style={inputStyle} value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '800', color: colors.textMuted }}>HOME ADDRESS</label>
              <input style={inputStyle} value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '800', color: colors.textMuted }}>PHONE NUMBER</label>
              <input style={inputStyle} value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
            </div>
          </div>
        </section>

        {/* 2. PET MANAGEMENT */}
        <section style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Your Pets</h2>
            <Link to="/register-pet" style={{ textDecoration: 'none' }}>
              <button style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                + Register New Pet
              </button>
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pets.map(pet => (
              <div key={pet.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                background: pet.id === activePet?.id ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255,255,255,0.6)', 
                padding: '20px 25px', borderRadius: '20px', 
                border: pet.id === activePet?.id ? `2px solid ${colors.primary}` : `1px solid ${colors.border}` 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: colors.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    {pet.image}
                  </div>
                  <div>
                    <div style={{ fontWeight: '900', color: colors.textMain, fontSize: '18px' }}>{pet.name} {pet.id === activePet?.id && "⭐"}</div>
                    <div style={{ fontSize: '13px', color: colors.textMuted, fontWeight: '600' }}>{pet.breed}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setActivePet(pet)}
                    style={{ background: pet.id === activePet?.id ? colors.primary : 'white', border: `2px solid ${colors.primary}`, color: pet.id === activePet?.id ? 'white' : colors.primary, padding: '8px 18px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    {pet.id === activePet?.id ? "Active" : "Select"}
                  </button>
                  <button 
                    onClick={() => handleDeletePet(pet.id)}
                    style={{ background: 'none', border: `2px solid ${colors.danger}`, color: colors.danger, padding: '8px 18px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. DANGER ZONE */}
        <section style={{ ...sectionStyle, border: `2px solid ${colors.danger}33`, backgroundColor: 'rgba(254, 242, 242, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '800', color: colors.danger }}>Danger Zone</h2>
              <p style={{ margin: 0, color: colors.textMuted, fontSize: '14px', maxWidth: '500px' }}>
                Deleting your account is permanent. This will wipe all pet records and history forever.
              </p>
            </div>
            <button 
              onClick={() => { if(window.confirm("Are you sure?")) { /* handle delete */ } }}
              style={{ background: 'none', border: `2px solid ${colors.danger}`, color: colors.danger, padding: '12px 24px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}
            >
              Delete My Account
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}