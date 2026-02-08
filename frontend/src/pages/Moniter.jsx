import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "./Monitor.css";

const BACKEND_CHANNEL = "speedingchimp";

function base64UrlEncode(str) {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function Moniter() {
  const videoRef = useRef(null);
  const [mode, setMode] = useState("placeholder"); // "placeholder" | "webcam" | "backend"
  const [status, setStatus] = useState("Waiting for stream…");

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.95)',
    primary: '#A78BFA',
    textMain: '#1E293B',
    textMuted: '#64748B',
    border: '#E2E8F0',
    danger: '#EF4444'
  };

  useEffect(() => {
    if (mode !== "webcam") return;
    let stream;
    (async () => {
      try {
        setStatus("Connecting to webcam…");
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("Live (webcam)");
      } catch (e) {
        setStatus("Webcam blocked or unavailable.");
      }
    })();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  // Backend stream: fetch URL from /api/v1/stream/url, then play via proxy
  useEffect(() => {
    if (mode !== "backend" || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = null;

    let cancelled = false;
    (async () => {
      try {
        setStatus("Loading stream…");
        const { stream_url } = await api.stream.getUrl(BACKEND_CHANNEL);
        if (cancelled) return;
        const base = api.getBaseUrl();
        const proxyUrl = `${base}/stream/proxy?channel=${encodeURIComponent(BACKEND_CHANNEL)}&url=${base64UrlEncode(stream_url)}`;
        video.src = proxyUrl;
        video.load();
        setStatus("Live (backend)");
      } catch (e) {
        if (!cancelled) setStatus(e?.detail || e?.message || "Stream unavailable.");
        video.removeAttribute("src");
      }
    })();

    return () => {
      cancelled = true;
      video.removeAttribute("src");
    };
  }, [mode]);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100vw', 
      background: colors.bgGradient, 
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden'
    }}>
      
      {/* SIDEBAR - Clean, regular bars only */}
      <aside style={{ 
        width: '280px', 
        height: 'calc(100vh - 70px)', 
        background: colors.sidebarBg, 
        backdropFilter: 'blur(15px)', 
        borderRight: `1px solid ${colors.border}`, 
        padding: '20px', 
        position: 'fixed', 
        left: 0, 
        top: '70px', 
        zIndex: 10, 
        display: 'flex', 
        flexDirection: 'column', 
        boxSizing: 'border-box' 
      }}>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>🏠 Dashboard</Link>
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, background: 'rgba(167, 139, 250, 0.15)', fontWeight: '700', borderRadius: '12px' }}>📹 Monitor</Link>
          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📊 Stats</Link>
          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📅 Calendar</Link>
          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>🤝 Community</Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: `1px solid ${colors.border}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>⚙️ Account Settings</Link>
          <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', color: colors.danger, fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>🚪 Log Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT - Standard 70px offset */}
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        marginTop: '70px', 
        padding: '40px 60px', 
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        <div className="mon">
          <div className="mon__header">
            <div>
              <h1 className="mon__title">Live Monitor</h1>
              <p className="mon__sub">{status}</p>
            </div>

            <div className="mon__controls">
              <button className={`mon__btn ${mode === "placeholder" ? "isActive" : ""}`} onClick={() => setMode("placeholder")}>Placeholder</button>
              <button className={`mon__btn ${mode === "webcam" ? "isActive" : ""}`} onClick={() => setMode("webcam")}>Test Webcam</button>
              <button className={`mon__btn ${mode === "backend" ? "isActive" : ""}`} onClick={() => { setMode("backend"); setStatus("Waiting for backend stream…"); }}>Backend Stream</button>
            </div>
          </div>

          <div className="mon__grid">
            <div className="mon__videoCard">
              <div className="mon__videoTop">
                <span className="mon__chip">CAMERA</span>
                <span className="mon__chip mon__chipSoft">
                  {mode === "placeholder" ? "Demo" : mode === "webcam" ? "Webcam" : "Backend"}
                </span>
              </div>
              <div className="mon__videoWrap">
                {mode === "placeholder" ? (
                  <div className="mon__placeholder">
                    <div className="mon__placeholderBox" />
                    <p className="mon__placeholderText">Live feed active.</p>
                  </div>
                ) : (
                  <video ref={videoRef} className="mon__video" autoPlay playsInline muted />
                )}
              </div>
            </div>

            <aside className="mon__side">
              <div className="mon__panel">
                <h2 className="mon__h2">Notes</h2>
                <textarea className="mon__notes" placeholder="Add observations here..." />
                <button className="mon__btnWide" style={{ backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                  Save Note
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}