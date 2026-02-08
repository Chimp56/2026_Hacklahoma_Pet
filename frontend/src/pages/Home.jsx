import React from 'react';
import { Link } from "react-router-dom";

export default function Home() {
  const navbarHeight = '70px'; 
  const petName = "Buddy"; // This will eventually come from your registration data

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.7)',
    primary: '#A78BFA', // The soft purple for Buddy's name
    textMain: '#1E293B',
    textMuted: '#64748B',
    white: '#FFFFFF',
    accent: '#F5F3FF',
    live: '#EF4444',
    border: '#E2E8F0'
  };

  const pageWrapperStyle = {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: colors.bgGradient,
    overflow: 'hidden', 
    fontFamily: "'Inter', sans-serif",
  };

  const sidebarStyle = {
    width: '280px',
    height: `calc(100vh - ${navbarHeight})`,
    backgroundColor: colors.sidebarBg,
    backdropFilter: 'blur(15px)',
    borderRight: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 20px',
    position: 'fixed',
    left: 0,
    top: navbarHeight,
    boxSizing: 'border-box',
    zIndex: 900
  };

  const mainContentStyle = {
    marginLeft: '280px', 
    marginTop: navbarHeight,
    padding: '40px 60px',
    height: `calc(100vh - ${navbarHeight})`,
    width: 'calc(100% - 280px)',
    overflowY: 'auto',
    boxSizing: 'border-box'
  };

  const cardStyle = {
    backgroundColor: colors.white,
    borderRadius: '28px',
    padding: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
  };

  const navItem = (label, icon, path = `/${label.toLowerCase().replace(" ", "-")}`) => (
    <Link to={path} style={{ 
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
      textDecoration: 'none', color: colors.textMuted, fontWeight: '600', 
      borderRadius: '12px', marginBottom: '8px'
    }}>
      <span>{icon}</span> {label}
    </Link>
  );

  return (
    <div style={pageWrapperStyle}>
      
      {/* --- SIDEBAR --- */}
      <aside style={sidebarStyle}>
        <nav style={{ flex: 1 }}>
          <Link to="/home" style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
            textDecoration: 'none', color: colors.primary, backgroundColor: 'rgba(167, 139, 250, 0.1)', 
            fontWeight: '600', borderRadius: '12px', marginBottom: '8px' 
          }}>
            🏠 Dashboard
          </Link>
          {navItem("Monitor", "📹")}
          {navItem("Stats", "📊")}
          {navItem("Calendar", "📅")}
          {navItem("Community", "🤝")}
        </nav>

        {/* ACCOUNT SETTINGS SECTION */}
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
          {navItem("Account Settings", "⚙️", "/settings")}
          <Link to="/auth" style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
            textDecoration: 'none', color: '#EF4444', fontWeight: '600', borderRadius: '12px' 
          }}>
            <span>🚪</span> Logout
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={mainContentStyle}>
        <header style={{ marginBottom: '40px' }}>
          {/* PERSONALIZED HEADER WITH COLORED NAME */}
          <h1 style={{ margin: 0, color: colors.textMain, fontSize: '36px', fontWeight: '900' }}>
            Welcome back, <span style={{ color: colors.primary }}>{petName}</span>! 🐾
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '18px', marginTop: '8px' }}>
            Here is what's happening in your world today.
          </p>
        </header>

        {/* DASHBOARD GRID */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '25px', 
          paddingBottom: '40px' 
        }}>
          
          {/* LIVE MONITOR */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Live Monitor</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.live }}></div>
                <span style={{ color: colors.live, fontSize: '12px', fontWeight: 'bold' }}>LIVE</span>
              </div>
            </div>
            <div style={{ 
              width: '100%', height: '200px', backgroundColor: '#F1F5F9', borderRadius: '20px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #E2E8F0' 
            }}>
              <span style={{ color: colors.textMuted }}>Camera: Play Area</span>
            </div>
          </div>

          {/* ACTIVITY STATS */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0' }}>Activity Stats</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', paddingBottom: '10px' }}>
              {[50, 80, 40, 95, 70, 60, 85].map((h, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: colors.primary, height: `${h}%`, borderRadius: '8px', opacity: 0.8 }}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.textMuted, fontWeight: 'bold' }}>
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
          </div>

          {/* CALENDAR */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0' }}>Upcoming Events</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: colors.accent, padding: '15px', borderRadius: '20px' }}>
              <div style={{ backgroundColor: colors.primary, color: 'white', padding: '10px', borderRadius: '15px', textAlign: 'center', minWidth: '50px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>OCT</div>
                <div style={{ fontSize: '22px', fontWeight: '900' }}>24</div>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '800', color: colors.textMain }}>Vet Checkup</p>
                <p style={{ margin: 0, fontSize: '14px', color: colors.textMuted }}>10:30 AM • Dr. Smith</p>
              </div>
            </div>
          </div>

          {/* COMMUNITY */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0' }}>Community Buzz</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #F3E8FF)' }}></div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: colors.textMain }}><b>Luna's Mom:</b> New dog park opened!</p>
                <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>2 mins ago</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}