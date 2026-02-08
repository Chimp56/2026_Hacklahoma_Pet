import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { usePet } from '../PetContext';

export default function Home({ events = [], petStats = {} }) {
  const { pets, activePet, setActivePet } = usePet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navbarHeight = '70px';
  const petName = activePet?.name || "Buddy";
  
  // Get real-time day index (0 is Sunday, 6 is Saturday)
  const realToday = new Date();
  const currentDayIndex = realToday.getDay();

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.7)',
    primary: '#A78BFA',
    primaryDark: '#8B5CF6',
    sleepPrimary: '#818CF8',
    textMain: '#1E293B',
    textMuted: '#64748B',
    white: '#FFFFFF',
    accent: '#F5F3FF',
    live: '#EF4444',
    border: '#E2E8F0'
  };

  // SYNC LOGIC:
  // 1. Define baseline data as 0 for all days until sync
  const staticWeeklyData = [0, 0, 0, 0, 0, 0, 0];
  const liveSleep = activePet?.stats?.sleepHours || 0;

  // 2. Only override the bar that matches currentDayIndex with live data
  const weeklySleepData = staticWeeklyData.map((val, i) =>
    i === currentDayIndex ? liveSleep : val
  );

  const upcomingEvents = events
    .filter(ev => {
      const evDate = new Date(ev.year, ev.month, ev.day);
      return evDate >= new Date(2026, 1, 7); 
    })
    .sort((a, b) => new Date(a.year, a.month, a.day) - new Date(b.year, b.month, b.day))
    .slice(0, 3);

  const pageWrapperStyle = {
    display: 'flex', height: '100vh', width: '100vw', background: colors.bgGradient,
    overflow: 'hidden', fontFamily: "'Inter', sans-serif",
  };

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

  const cardStyle = {
    backgroundColor: colors.white, borderRadius: '28px', padding: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)', border: '1px solid rgba(255, 255, 255, 0.6)',
  };

  return (
    <div style={pageWrapperStyle}>
      <aside style={sidebarStyle}>
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
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '8px', zIndex: 1000, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
              {pets.map(pet => (
                <div
                  key={pet.id}
                  onClick={() => { setActivePet(pet); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', backgroundColor: activePet?.id === pet.id ? colors.accent : 'transparent', transition: 'background 0.2s ease' }}
                >
                  <span style={{ fontSize: '20px' }}>{pet.image}</span>
                  <span style={{ fontWeight: '700', color: colors.textMain, flex: 1 }}>{pet.name}</span>
                  {activePet?.id === pet.id && <span style={{ color: colors.primary, fontWeight: 'bold' }}>✓</span>}
                </div>
              ))}
              <Link to="/register-pet" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', marginTop: '4px', textDecoration: 'none', borderTop: `1px solid ${colors.border}`, color: colors.primary, fontSize: '14px', fontWeight: '700' }}>
                <span>➕</span> Add New Pet
              </Link>
            </div>
          )}
        </div>

        <nav style={{ flex: 1 }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, backgroundColor: 'rgba(167, 139, 250, 0.1)', fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>🏠 Dashboard</Link>
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}><span>📹</span> Monitor</Link>
          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}><span>📊</span> Stats</Link>
          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}><span>📅</span> Calendar</Link>
          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}><span>🤝</span> Community</Link>
        </nav>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}><span>⚙️</span> Account Settings</Link>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: '#EF4444', fontWeight: '600', borderRadius: '12px' }}><span>🚪</span> Logout</Link>
        </div>
      </aside>

      <main style={mainContentStyle}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: 0, color: colors.textMain, fontSize: '36px', fontWeight: '900' }}>
            Welcome back, <span style={{ color: colors.primary }}>{petName}</span>! {activePet?.image || '🐾'}
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '18px', marginTop: '8px' }}>
            Dashboard Synced: Tracking live sleep for today.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', paddingBottom: '40px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Live Monitor</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.live }}></div>
                <span style={{ color: colors.live, fontSize: '12px', fontWeight: 'bold' }}>LIVE</span>
              </div>
            </div>
            <div style={{ width: '100%', height: '200px', backgroundColor: '#F1F5F9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #E2E8F0' }}>
              <Link to="/moniter" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 'bold' }}>Open Camera Feed →</Link>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Weekly Sleep Activity 🌙</h3>
              <div style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: liveSleep >= 10 ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: liveSleep >= 10 ? '#065F46' : '#92400E' }}>
                  {liveSleep >= 10 ? 'GOAL MET ✅' : 'IN PROGRESS ⏳'}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '24px', gap: '12px' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                const hrs = weeklySleepData[i];
                const isToday = i === currentDayIndex; 
                const barHeight = Math.min((hrs / 18) * 100, 100);

                return (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: isToday ? colors.primary : colors.textMuted, marginBottom: '6px' }}>
                      {hrs}h
                    </span>
                    <div style={{ width: '100%', maxWidth: '38px', height: `${barHeight}%`, backgroundColor: isToday ? colors.primary : '#CBD5E1', borderRadius: '10px 10px 6px 6px', transition: 'height 0.6s ease-in-out', boxShadow: isToday ? `0 6px 20px ${colors.primary}40` : 'none' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '800', marginTop: '10px', color: isToday ? colors.primary : colors.textMuted }}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0' }}>Upcoming Events</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingEvents.length > 0 ? upcomingEvents.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: colors.accent, padding: '12px', borderRadius: '20px' }}>
                  <div style={{ backgroundColor: colors.primary, color: 'white', padding: '8px', borderRadius: '12px', textAlign: 'center', minWidth: '45px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>FEB</div>
                    <div style={{ fontSize: '18px', fontWeight: '900' }}>{ev.day}</div>
                  </div>
                  <Link to="/calendar" style={{ textDecoration: 'none', color: colors.textMain, fontWeight: '700' }}>{ev.title}</Link>
                </div>
              )) : (
                <p style={{ color: colors.textMuted }}>No upcoming events scheduled.</p>
              )}
            </div>
          </div>

          <div style={{ 
            ...cardStyle, 
            background: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('https://www.transparenttextures.com/patterns/p6.png')`,
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                <div style={{ fontSize: '28px', background: colors.accent, padding: '8px', borderRadius: '12px' }}>🧬</div>
                <h3 style={{ margin: 0, color: colors.textMain }}>Breed Identifier</h3>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: colors.textMuted, lineHeight: '1.6' }}>
                Curious about your pet's mix? Upload a photo and let our AI analyze unique physical traits to discover their breed heritage.
              </p>
            </div>
            
            <Link 
              to="/breed-finder" 
              style={{ 
                marginTop: '25px',
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                backgroundColor: colors.primary,
                color: 'white',
                textDecoration: 'none',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '14px',
                boxShadow: `0 4px 12px ${colors.primary}40`,
                transition: 'all 0.2s ease'
              }}
            >
              Discover Breed Now →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}