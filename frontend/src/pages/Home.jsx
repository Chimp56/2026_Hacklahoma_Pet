import React from 'react';
import { Link } from "react-router-dom";

export default function Home() {
  const navbarHeight = '70px'; 
  
  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.7)',
    primary: '#A78BFA',
    textMain: '#1E293B',
    textMuted: '#64748B',
    accent: '#F5F3FF',
    white: '#FFFFFF',
    success: '#10B981'
  };

  // MAIN PAGE WRAPPER: This locks the background so it never moves
  const pageWrapperStyle = {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: colors.bgGradient, // Background is pinned here
    overflow: 'hidden', // Prevents the whole body from scrolling
    fontFamily: "'Inter', sans-serif",
  };

  const sidebarStyle = {
    width: '280px',
    height: `calc(100vh - ${navbarHeight})`,
    backgroundColor: colors.sidebarBg,
    backdropFilter: 'blur(15px)',
    borderRight: '1px solid rgba(226, 232, 240, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 20px',
    position: 'fixed',
    left: 0,
    top: navbarHeight,
    boxSizing: 'border-box',
    zIndex: 900
  };

  // CONTENT AREA: This is the ONLY part that scrolls
  const mainContentStyle = {
    marginLeft: '280px', 
    marginTop: navbarHeight,
    padding: '40px 60px',
    height: `calc(100vh - ${navbarHeight})`, // Fits exactly in the viewport
    width: 'calc(100% - 280px)',
    overflowY: 'auto', // Scrollbar only appears here
    boxSizing: 'border-box'
  };

  const cardStyle = {
    backgroundColor: colors.white,
    borderRadius: '28px',
    padding: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
  };

  return (
    <div style={pageWrapperStyle}>
      
      {/* --- SIDEBAR --- */}
      <aside style={sidebarStyle}>
        <nav style={{ flex: 1 }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, backgroundColor: 'rgba(167, 139, 250, 0.1)', fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>🏠 Dashboard</Link>
          <Link to="/health" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>🏥 Health</Link>
          <Link to="/vet-visits" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>🩺 Vet Trips</Link>
          <Link to="/sleep" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>🌙 Sleep</Link>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={mainContentStyle}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: 0, color: colors.textMain, fontSize: '32px', fontWeight: '800' }}>Dashboard</h1>
          <p style={{ color: colors.textMuted, fontSize: '16px' }}>Monitor Buddy's daily wellness and upcoming trips.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', paddingBottom: '40px' }}>
          
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 15px 0' }}>Vet Trip</h3>
            <div style={{ padding: '15px', backgroundColor: '#FFF7ED', borderRadius: '16px', border: '1px solid #FFEDD5' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#9A3412' }}>Annual Checkup</p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#C2410C' }}>Oct 24, 2024</p>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 15px 0' }}>Sleep Analysis</h3>
            <span style={{ fontSize: '32px', fontWeight: '800' }}>9h 15m</span>
            <p style={{ color: colors.success, fontWeight: 'bold' }}>Ideal Rest</p>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 15px 0' }}>Weight</h3>
            <span style={{ fontSize: '32px', fontWeight: '800' }}>28.4 kg</span>
          </div>

          {/* Add more cards here to test scrolling */}
        </div>
      </main>
    </div>
  );
}
