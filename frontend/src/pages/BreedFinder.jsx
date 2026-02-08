import React, { useState, useRef } from 'react';
import { Link } from "react-router-dom";
import api from "../api/api";

export default function BreedFinder() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showBreedBreakdown, setShowBreedBreakdown] = useState(false);
  const fileInputRef = useRef(null);

  const navbarHeight = '70px';
  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.7)',
    primary: '#A78BFA',
    primaryDark: '#8B5CF6',
    textMain: '#1E293B',
    textMuted: '#64748B',
    white: '#FFFFFF',
    accent: '#F5F3FF',
    border: '#E2E8F0'
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setSelectedFile(file);
      setResult(null);
      setError("");
    }
  };

  const analyzeBreed = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError("");
    setResult(null);
    try {
      const data = await api.gemini.analyzePet(selectedFile);
      const breedList = Array.isArray(data.breeds) ? data.breeds : [];
      const breed = data.primary_breed_or_species || breedList[0]?.breed || (data.species?.[0]?.species) || "Unknown";
      const matchScore = data.match_score ?? breedList[0]?.percentage ?? data.species?.[0]?.percentage ?? 0;
      const scoreInt = typeof matchScore === "number" ? Math.round(matchScore) : parseInt(matchScore, 10) || 0;
      const isPurebred = data.is_purebred === true;
      const breedBreakdown = breedList.map((b) => ({
        breed: b.breed || b.name || "Unknown",
        percentage: typeof b.percentage === "number" ? Math.round(b.percentage) : parseInt(b.percentage, 10) || 0,
      })).filter((b) => b.breed && b.percentage > 0);
      setResult({
        breed,
        confidence: `${scoreInt}%`,
        traits: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : ["Friendly", "Energetic", "Intelligent"],
        description: data.description || "Breed analysis complete.",
        isPurebred,
        breedBreakdown,
      });
      setShowBreedBreakdown(false);
    } catch (e) {
      const msg = e?.detail ?? e?.message ?? "Analysis failed.";
      setError(Array.isArray(msg) ? msg.join(" ") : String(msg));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: colors.bgGradient, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Sidebar - No Pet Switcher */}
      <aside style={sidebarStyle}>
        <nav style={{ flex: 1 }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px', marginBottom: '8px' }}>🏠 Dashboard</Link>
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

      {/* Main Content Area */}
      <main style={mainContentStyle}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: 0, color: colors.textMain, fontSize: '32px', fontWeight: '900' }}>
            Breed <span style={{ color: colors.primary }}>Finder</span> AI 🧬
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '18px', marginTop: '8px' }}>
            Upload a photo to identify your pet's heritage.
          </p>
        </header>

        <div style={{ maxWidth: '700px', backgroundColor: colors.white, borderRadius: '28px', padding: '30px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
          
          {!selectedImage ? (
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{ border: `2px dashed ${colors.border}`, borderRadius: '20px', padding: '80px 20px', cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s ease' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.accent}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
              <h3 style={{ color: colors.textMain, margin: '0 0 8px 0' }}>Drop your photo here</h3>
              <p style={{ color: colors.textMuted, margin: 0 }}>or click to browse files</p>
            </div>
          ) : (
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>
              <img 
                src={selectedImage} 
                alt="Upload" 
                style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', display: 'block' }} 
              />
              {isAnalyzing && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(167, 139, 250, 0.1)' }}>
                  <div style={{ width: '100%', height: '4px', background: colors.primary, position: 'absolute', top: 0, animation: 'scan 2s infinite linear', boxShadow: `0 0 15px ${colors.primary}` }}></div>
                </div>
              )}
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

          <div style={{ marginTop: '24px' }}>
            {selectedImage && !isAnalyzing && !result && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setSelectedImage(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${colors.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button onClick={analyzeBreed} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: colors.primary, color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: `0 4px 12px ${colors.primary}40` }}>Identify Breed</button>
              </div>
            )}

            {isAnalyzing && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: colors.primary, fontWeight: '800', margin: 0 }}>🧬 ANALYZING BIOMETRICS...</p>
              </div>
            )}

            {result && (
              <div style={{ marginTop: '10px', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ backgroundColor: colors.accent, borderRadius: '20px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h2 style={{ margin: 0, color: colors.textMain }}>{result.breed}</h2>
                    <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>{result.confidence} MATCH</span>
                  </div>
                  <p style={{ color: colors.textMuted, lineHeight: '1.6', margin: '0 0 20px 0' }}>{result.description}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {result.traits.map(t => (
                      <span key={t} style={{ background: colors.white, padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: colors.primaryDark, border: `1px solid ${colors.border}` }}>#{t}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setSelectedImage(null); setSelectedFile(null); setResult(null); setError(""); setShowBreedBreakdown(false); }} style={{ marginTop: '16px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: colors.textMain, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Scan Another Pet</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}