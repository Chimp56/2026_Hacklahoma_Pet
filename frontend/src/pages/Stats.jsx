import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from "react-router-dom";
import { usePet } from '../PetContext'; 

export default function Stats() {
  // --- PET SWITCHER STATE & CONTEXT ---
  const { pets, setPets, activePet, setActivePet } = usePet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); 

  // --- LIVE SYNC STATE (Per Second) ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentActivity, setCurrentActivity] = useState('Active');
  
  // Wiggle state to simulate live sensor jitter
  const [jitter, setJitter] = useState(0);

  // Sync state and jitter every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setJitter((Math.random() - 0.5) * 4); // Small random wiggle
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- MEDICAL RECORDS ---
  const fileInputRef = useRef(null);
  const [medicalRecords, setMedicalRecords] = useState([
    { id: 1, name: 'Vaccination_Record_2025.pdf', date: '2025-12-15', size: '1.2 MB' },
    { id: 2, name: 'Annual_Checkup_Summary.docx', date: '2026-01-10', size: '450 KB' }
  ]);

  // --- STYLE CONSTANTS ---
  const navbarHeight = '70px'; 
  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.95)',
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

  // --- LOGIC: RELATIVE TIME LABELS (Seconds) ---
  const relativeLabels = useMemo(() => {
    return ["60s ago", "50s ago", "40s ago", "30s ago", "20s ago", "10s ago", "Now"];
  }, []);

  const displayDate = currentTime.toLocaleDateString(undefined, { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) + ` | ${currentTime.toLocaleTimeString()}`;

  const activityMap = { 'Very Active': 100, 'Active': 80, 'Low Energy': 45, 'Lethargic': 15 };
  
  // Data reflects the last minute of activity + jitter on the final point
  const rawData = useMemo(() => ({
    sleep: [8, 8, 8, 8, 8, 8, activePet.stats.sleepHours],
    activity: [...activePet.stats.activityData.slice(0, 6), activePet.stats.activityData[6] + jitter]
  }), [activePet, jitter]);

  const calculateWellness = (sleepHrs, activityPct) => {
    const sleepScore = Math.min((sleepHrs / 8) * 100, 100); 
    return Math.max((sleepScore + activityPct) / 2, 20); 
  };

  const liveWellnessScores = rawData.sleep.map((s, i) => calculateWellness(s, rawData.activity[i]));
  const avgWellness = liveWellnessScores.reduce((a, b) => a + b, 0) / 7;
  
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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: colors.bgGradient, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* --- SIDEBAR TOGGLE --- */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed', left: '20px', top: '85px', zIndex: 1000,
            background: colors.primary, color: 'white', border: 'none',
            borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.4)', fontSize: '18px'
          }}
        >
          ➼ 
        </button>
      )}

      {/* --- SIDEBAR --- */}
      <aside style={{ 
        width: '280px', height: `calc(100vh - ${navbarHeight})`, background: colors.sidebarBg, 
        backdropFilter: 'blur(15px)', borderRight: `1px solid ${colors.border}`, 
        padding: '30px 20px', position: 'fixed', 
        left: sidebarOpen ? 0 : '-280px', 
        top: navbarHeight, zIndex: 99, display: 'flex', flexDirection: 'column', 
        boxSizing: 'border-box', transition: 'left 0.3s ease-in-out'
      }}>
        <button 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'absolute', right: '15px', top: '15px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}
        >
          ✕
        </button>

        <div style={{ marginBottom: '25px', position: 'relative' }}>
          <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.7, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Active Profile</label>
          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, padding: '12px 16px', borderRadius: '20px', cursor: 'pointer', color: 'white', boxShadow: '0 8px 20px rgba(167, 139, 250, 0.3)' }}>
            <span style={{ fontSize: '24px' }}>{activePet?.image || '🐾'}</span>
            <span style={{ fontWeight: '800', flex: 1 }}>{activePet?.name}</span>
            <span>{isDropdownOpen ? '▲' : '▼'}</span>
          </div>
          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '8px', zIndex: 1000 }}>
              {pets.map(pet => (
                <div key={pet.id} onClick={() => { setActivePet(pet); setIsDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', backgroundColor: activePet?.id === pet.id ? colors.accent : 'transparent' }}>
                  <span>{pet.image}</span>
                  <span style={{ fontWeight: '700' }}>{pet.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <nav style={{ flex: 1 }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600' }}>🏠 Dashboard</Link>
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600' }}>📹 Monitor</Link>
          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, backgroundColor: 'rgba(167, 139, 250, 0.1)', fontWeight: '600', borderRadius: '12px' }}>📊 Stats</Link>
          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600' }}>📅 Calendar</Link>
          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600' }}>🤝 Community</Link>
        </nav>
        
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600' }}>⚙️ Account Settings</Link>
          <Link to="/auth" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.danger, fontWeight: '700' }}>🚪 Log Out</Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={{
        flex: 1, marginLeft: sidebarOpen ? '280px' : '0px',
        marginTop: navbarHeight, padding: '40px 60px',
        height: `calc(100vh - ${navbarHeight})`, overflowY: 'auto', boxSizing: 'border-box', transition: 'margin-left 0.3s ease-in-out'
      }}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: colors.textMain }}>Real-Time Analysis</h1>
            <p style={{ margin: 0, color: colors.textMuted, fontWeight: '600' }}>{displayDate}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: colors.danger, animation: 'pulse 0.8s infinite' }}></span>
            <span style={{ fontWeight: '900', fontSize: '12px', color: colors.textMain, letterSpacing: '1px' }}>REC LIVE</span>
          </div>
        </header>

        {/* --- LIVE GRAPH --- */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '28px', border: `1px solid ${colors.border}`, marginBottom: '25px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', fontSize: '12px', fontWeight: 'bold' }}>
            <span><span style={{color: colors.wellness}}>●</span> Wellness</span>
            <span style={{ color: '#6366F1' }}>● Recovery</span>
            <span style={{ color: colors.activity }}>● Activity</span>
          </div>
          <svg viewBox="0 0 420 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {liveWellnessScores.map((score, i) => i === 0 ? null : <line key={i} x1={(i-1) * GRAPH_SPACING + GRAPH_PADDING} y1={140 - (liveWellnessScores[i-1] * 1.2)} x2={i * GRAPH_SPACING + GRAPH_PADDING} y2={140 - (score * 1.2)} stroke={getThemeColor(score)} strokeWidth="5" strokeLinecap="round" />)}
            <path d={`M ${getPath(rawData.sleep, 9)}`} fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray="4" />
            <path d={`M ${getPath(rawData.activity, 1.2)}`} fill="none" stroke={colors.activity} strokeWidth="2" />
            {relativeLabels.map((label, i) => (
              <text key={i} x={i * GRAPH_SPACING + GRAPH_PADDING} y="165" textAnchor="middle" style={{ fontSize: '11px', fill: label === "Now" ? colors.danger : colors.textMuted, fontWeight: label === "Now" ? '900' : '700' }}>{label}</text>
            ))}
          </svg>
        </div>

        {/* --- HEALTH INDEX --- */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '28px', borderLeft: `8px solid ${currentThemeColor}`, marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: colors.textMuted }}>Current Wellness Index</h4>
          <span style={{ fontSize: '36px', fontWeight: '900', color: currentThemeColor }}>{avgWellness.toFixed(0)}%</span>
        </div>

        {/* --- ACTIVITY & SLEEP CONTROLS --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '25px', marginBottom: '25px' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '28px', border: `1px solid ${colors.border}` }}>
            <h4 style={{ marginTop: 0, marginBottom: '20px' }}>Instant Activity State</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {Object.keys(activityMap).map(status => (
                <button key={status} onClick={() => handleActivityUpdate(status)} style={{ padding: '14px 10px', borderRadius: '12px', border: `2px solid ${currentActivity === status ? colors.activity : colors.border}`, backgroundColor: currentActivity === status ? `${colors.activity}10` : 'white', fontWeight: '700', cursor: 'pointer' }}>{status}</button>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '28px', border: `1px solid ${colors.border}` }}>
            <h4 style={{ margin: 0 }}>Rest Index</h4>
            <input type="range" min="0" max="15" step="0.5" value={activePet.stats.sleepHours} onChange={(e) => handleSleepUpdate(e.target.value)} style={{ width: '100%', marginTop: '20px', accentColor: colors.primary }} />
          </div>
        </div>

        {/* --- ANNUAL PROGRESS --- */}
        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '28px', border: `1px solid ${colors.border}`, marginBottom: '25px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '25px' }}>2026 Annual Overview</h4>
          <svg viewBox="0 0 780 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {lifetimeScores.map((score, i) => i === 0 ? null : <line key={i} x1={(i-1) * 68 + GRAPH_PADDING} y1={140 - (lifetimeScores[i-1] * 1.1)} x2={i * 68 + GRAPH_PADDING} y2={140 - (score * 1.1)} stroke={getThemeColor(score)} strokeWidth="5" strokeLinecap="round" />)}
            {months.map((m, i) => <text key={i} x={i * 68 + GRAPH_PADDING} y="165" textAnchor="middle" style={{ fontSize: '11px', fill: colors.textMuted, fontWeight: '800' }}>{m}</text>)}
          </svg>
        </div>

        {/* --- MEDICAL RECORDS --- */}
        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '28px', border: `1px solid ${colors.border}`, marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Medical Records</h4>
            <button onClick={() => fileInputRef.current.click()} style={{ padding: '10px 20px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Upload Record</button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {medicalRecords.map(record => (
              <div key={record.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', border: `1px solid ${colors.border}`, backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '24px', marginRight: '16px' }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700' }}>{record.name}</div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>{record.date} • {record.size}</div>
                </div>
                <button style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: '700', cursor: 'pointer' }}>View</button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}