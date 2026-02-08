import React, { useState, useMemo, useRef } from 'react';
import { Link } from "react-router-dom";
import { usePet } from '../PetContext'; 

export default function Stats() {
  // --- PET SWITCHER STATE & CONTEXT ---
  const { pets, setPets, activePet, setActivePet } = usePet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [weekOffset, setWeekOffset] = useState(0); 
  const [currentActivity, setCurrentActivity] = useState('Active');
  
  // --- NEW STATE: MEDICAL RECORDS ---
  const fileInputRef = useRef(null);
  const [medicalRecords, setMedicalRecords] = useState([
    { id: 1, name: 'Vaccination_Record_2025.pdf', date: '2025-12-15', size: '1.2 MB' },
    { id: 2, name: 'Annual_Checkup_Summary.docx', date: '2026-01-10', size: '450 KB' }
  ]);

  // --- STYLE CONSTANTS ---
  const navbarHeight = '70px'; 
  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.7)',
    primary: '#A78BFA', 
    primaryDark: '#8B5CF6',
    textMain: '#1E293B',
    textMuted: '#64748B',
    white: '#FFFFFF',
    border: '#E2E8F0',
    wellness: '#10B981', 
    warning: '#F59E0B',   
    danger: '#EF4444',    
    activity: '#f43fb8',
    accent: '#F5F3FF',
  };

  // --- LOGIC: DATE & GRAPH CALCULATIONS ---
  const sundayStart = useMemo(() => {
    const date = new Date(2026, 1, 1); 
    date.setDate(date.getDate() + (weekOffset * 7));
    return date;
  }, [weekOffset]);

  const saturdayEnd = useMemo(() => {
    const date = new Date(sundayStart);
    date.setDate(date.getDate() + 6);
    return date;
  }, [sundayStart]);

  const daysLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sundayStart);
      d.setDate(sundayStart.getDate() + i);
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    }
    return labels;
  }, [sundayStart]);

  const displayDateRange = `${sundayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${saturdayEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const activityMap = { 'Very Active': 100, 'Active': 80, 'Low Energy': 45, 'Lethargic': 15 };
  
  const historyData = useMemo(() => ({
    "0": { 
      sleep: [8, 7, 9, 11, 8, 10, activePet.stats.sleepHours], 
      activity: activePet.stats.activityData 
    },
    "-1": { 
      sleep: [7, 6, 7, 6, 8, 7, 7],
      activity: [80, 45, 45, 80, 80, 100, 80]
    }
  }), [activePet, weekOffset]);

  const rawData = historyData[weekOffset] || historyData["-1"];
  
  const calculateWellness = (sleepHrs, activityPct) => {
    const sleepScore = Math.min((sleepHrs / 8) * 100, 100); 
    return Math.max((sleepScore + activityPct) / 2, 20); 
  };

  const dailyWellnessScores = rawData.sleep.map((s, i) => calculateWellness(s, rawData.activity[i]));
  const avgWellness = dailyWellnessScores.reduce((a, b) => a + b, 0) / 7;
  
  const getThemeColor = (score) => {
    if (score >= 80) return colors.wellness;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };
  const currentThemeColor = getThemeColor(avgWellness);

  const GRAPH_SPACING = 60; 
  const GRAPH_PADDING = 20; 
  const getPath = (vals, multiplier) => vals.map((v, i) => `${i * GRAPH_SPACING + GRAPH_PADDING},${140 - (v * multiplier)}`).join(' L ');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const lifetimeScores = [45, 55, 48, 82, 85, 78, 90, 88, 55, 42, 65, avgWellness];

  const sidebarStyle = {
    width: '280px', height: `calc(100vh - ${navbarHeight})`, backgroundColor: colors.sidebarBg,
    backdropFilter: 'blur(15px)', borderRight: `1px solid ${colors.border}`, display: 'flex',
    flexDirection: 'column', padding: '30px 20px', position: 'fixed', left: 0, top: navbarHeight,
    boxSizing: 'border-box', zIndex: 900
  };

  const mainContentStyle = {
    marginLeft: '280px', marginTop: navbarHeight, padding: '40px 60px',
    height: `calc(100vh - ${navbarHeight})`, width: 'calc(100% - 280px)',
    overflowY: 'auto', boxSizing: 'border-box'
  };

  const handleSleepUpdate = (newVal) => {
    const val = parseFloat(newVal);
    const updatedPets = pets.map(p => {
        if (p.id === activePet.id) {
            const updated = { ...p, stats: { ...p.stats, sleepHours: val } };
            setActivePet(updated); 
            return updated;
        }
        return p;
    });
    setPets(updatedPets);
  };

  const handleActivityUpdate = (status) => {
    setCurrentActivity(status);
    const numericValue = activityMap[status];
    const updatedPets = pets.map(p => {
      if (p.id === activePet.id) {
        const newActivity = [...p.stats.activityData];
        newActivity[6] = numericValue; 
        const updated = { ...p, stats: { ...p.stats, activityData: newActivity } };
        setActivePet(updated); 
        return updated;
      }
      return p;
    });
    setPets(updatedPets);
  };

  // --- NEW HANDLERS: MEDICAL RECORDS ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const newRecord = {
        id: Date.now(),
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        size: (file.size / 1024).toFixed(1) + ' KB'
      };
      setMedicalRecords([newRecord, ...medicalRecords]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: colors.bgGradient, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      <aside style={sidebarStyle}>
        <div style={{ marginBottom: '25px', position: 'relative' }}>
          <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.7, letterSpacing: '1.2px', textTransform: 'uppercase', display: 'block', marginBottom: '8px', color: colors.textMain }}>
            Active Profile
          </label>
          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, padding: '12px 16px', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(167, 139, 250, 0.3)', color: 'white' }}>
            <span style={{ fontSize: '24px' }}>{activePet?.image || '🐾'}</span>
            <span style={{ fontWeight: '800', flex: 1 }}>{activePet?.name}</span>
            <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </div>

          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '8px', zIndex: 1000, border: `1px solid ${colors.border}` }}>
              {pets.map(pet => (
                <div key={pet.id} onClick={() => { setActivePet(pet); setIsDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', backgroundColor: activePet?.id === pet.id ? colors.accent : 'transparent' }}>
                  <span style={{ fontSize: '20px' }}>{pet.image}</span>
                  <span style={{ fontWeight: '700', color: colors.textMain, flex: 1 }}>{pet.name}</span>
                  {activePet?.id === pet.id && <span style={{ color: colors.primary }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <nav style={{ flex: 1 }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>🏠 Dashboard</Link>
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>📹 Monitor</Link>
          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, backgroundColor: 'rgba(167, 139, 250, 0.1)', fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>📊 Stats</Link>
          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>📅 Calendar</Link>
          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>🤝 Community</Link>
        </nav>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>⚙️ Account Settings</Link>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: '#EF4444', fontWeight: '600', borderRadius: '12px' }}>🚪 Logout</Link>
        </div>
      </aside>

      <main style={mainContentStyle}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: colors.textMain }}>Weekly Wellness</h1>
            <p style={{ margin: 0, color: colors.textMuted, fontWeight: '600' }}>{displayDateRange}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setWeekOffset(prev => prev - 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: colors.primary }}>◀</button>
            <span style={{ fontWeight: '700', fontSize: '14px', minWidth: '100px', textAlign: 'center' }}>{weekOffset === 0 ? "This Week" : "Previous Week"}</span>
            <button onClick={() => setWeekOffset(prev => Math.min(0, prev + 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: colors.primary, opacity: weekOffset === 0 ? 0.3 : 1 }}>▶</button>
          </div>
        </header>

        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '28px', border: `1px solid ${colors.border}`, marginBottom: '25px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', fontSize: '12px', fontWeight: 'bold' }}>
            <span><span style={{color: colors.wellness}}>●</span> <span style={{color: colors.warning}}>●</span> <span style={{color: colors.danger}}>●</span> Daily Wellness</span>
            <span style={{ color: '#6366F1' }}>● Recovery (sleep)</span>
            <span style={{ color: colors.activity }}>● Activity (activeness)</span>
          </div>
          <svg viewBox="0 0 420 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {dailyWellnessScores.map((score, i) => i === 0 ? null : <line key={i} x1={(i-1) * GRAPH_SPACING + GRAPH_PADDING} y1={140 - (dailyWellnessScores[i-1] * 1.2)} x2={i * GRAPH_SPACING + GRAPH_PADDING} y2={140 - (score * 1.2)} stroke={getThemeColor(score)} strokeWidth="5" strokeLinecap="round" />)}
            <path d={`M ${getPath(rawData.sleep, 9)}`} fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray="4" />
            <path d={`M ${getPath(rawData.activity, 1.2)}`} fill="none" stroke={colors.activity} strokeWidth="2" />
            {daysLabels.map((day, i) => <text key={i} x={i * GRAPH_SPACING + GRAPH_PADDING} y="165" textAnchor="middle" style={{ fontSize: '12px', fill: colors.textMuted, fontWeight: '700' }}>{day}</text>)}
          </svg>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '28px', borderLeft: `8px solid ${currentThemeColor}`, marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: colors.textMuted, fontSize: '14px' }}>Week Summary</h4>
            <span style={{ color: currentThemeColor, fontWeight: '800', fontSize: '20px' }}>Avg. Wellness Score</span>
          </div>
          <span style={{ fontSize: '36px', fontWeight: '900', color: currentThemeColor }}>{avgWellness.toFixed(0)}%</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '25px', marginBottom: '25px' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '28px', border: `1px solid ${colors.border}` }}>
            <h4 style={{ marginTop: 0, marginBottom: '20px' }}>Saturday Activity</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {Object.keys(activityMap).map(status => (
                <button key={status} onClick={() => handleActivityUpdate(status)} style={{ padding: '14px 10px', borderRadius: '12px', border: `2px solid ${currentActivity === status ? colors.activity : colors.border}`, backgroundColor: currentActivity === status ? `${colors.activity}10` : 'white', color: currentActivity === status ? colors.activity : colors.textMuted, fontWeight: '700', cursor: 'pointer' }}>{status}</button>
              ))}
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '28px', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0 }}>Saturday Sleep</h4>
              <span style={{ backgroundColor: '#F3F4F6', padding: '4px 12px', borderRadius: '20px', color: colors.primary, fontWeight: '800', fontSize: '14px' }}>
                {activePet.stats.sleepHours} hrs
              </span>
            </div>
            <input type="range" min="0" max="15" step="0.5" value={activePet.stats.sleepHours} onChange={(e) => handleSleepUpdate(e.target.value)} style={{ width: '100%', accentColor: '#6366F1', cursor: 'pointer' }} />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '28px', border: `1px solid ${colors.border}`, marginBottom: '25px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '25px' }}>Lifetime Progress (2026)</h4>
          <svg viewBox="0 0 780 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {lifetimeScores.map((score, i) => i === 0 ? null : <line key={i} x1={(i-1) * 68 + GRAPH_PADDING} y1={140 - (lifetimeScores[i-1] * 1.1)} x2={i * 68 + GRAPH_PADDING} y2={140 - (score * 1.1)} stroke={getThemeColor(score)} strokeWidth="5" strokeLinecap="round" />)}
            {months.map((m, i) => <text key={i} x={i * 68 + GRAPH_PADDING} y="165" textAnchor="middle" style={{ fontSize: '11px', fill: colors.textMuted, fontWeight: '800' }}>{m}</text>)}
          </svg>
        </div>

        {/* --- NEW SECTION: MEDICAL RECORDS --- */}
        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '28px', border: `1px solid ${colors.border}`, marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: colors.textMain }}>Medical Records</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textMuted }}>Centralized history for {activePet?.name}</p>
            </div>
            <button 
              onClick={() => fileInputRef.current.click()}
              style={{ padding: '10px 20px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)' }}
            >
              + Upload Record
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {medicalRecords.length > 0 ? medicalRecords.map(record => (
              <div key={record.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', border: `1px solid ${colors.border}`, backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '24px', marginRight: '16px' }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: colors.textMain, fontSize: '14px' }}>{record.name}</div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>Uploaded on {record.date} • {record.size}</div>
                </div>
                <button style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>View</button>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: '14px', border: `2px dashed ${colors.border}`, borderRadius: '20px' }}>
                No medical records uploaded yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}