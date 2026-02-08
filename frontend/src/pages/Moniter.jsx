import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import emailjs from '@emailjs/browser'; // Integrated EmailJS
import "./Monitor.css";

export default function Monitor() {
  const videoRef = useRef(null);
  const [mode, setMode] = useState("placeholder"); 
  const [status, setStatus] = useState("Waiting for stream…");
  
  // ALERT STATE: 'normal' | 'danger'
  const [alertLevel, setAlertLevel] = useState("danger"); 
  const [userEmail, setUserEmail] = useState("user@example.com"); // Replace with actual logged-in user email

  const [currentSummary, setCurrentSummary] = useState("URGENT: Abnormal vocalization and repetitive pacing detected. Pet may be experiencing distress.");
  const [pastSummaries, setPastSummaries] = useState([
    { id: 1, date: "2026-02-08", time: "03:15", text: "No abnormalities detected. Pet was sleeping." },
    { id: 2, date: "2026-02-07", time: "10:15", text: "High activity alert: Excessive pacing detected." }
  ]);

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.95)',
    primary: '#A78BFA',
    textMain: '#1E293B',
    textMuted: '#64748B',
    border: '#E2E8F0',
    danger: '#EF4444',
    accent: '#F5F3FF',
    warningBg: 'rgba(239, 68, 68, 0.1)'
  };

  const now = new Date();
  const currentTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDateString = now.toLocaleDateString();

  // --- EMAIL ALERT LOGIC ---
  const sendEmailAlert = () => {
    const serviceID = 'service_jmta529';
    const templateID = 'template_orjiczo';
    const publicKey = 'CJficPRJcSKC7A_ZN';

    const templateParams = {
      to_email: userEmail,
      subject: "🚨 Abnormality Detected in Live Stream",
      message: currentSummary,
      time: `${currentDateString} ${currentTimeString}`
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then((response) => {
        console.log('EMAIL SUCCESS!', response.status, response.text);
      }, (err) => {
        console.log('EMAIL FAILED...', err);
      });
  };

  // --- NOTIFICATION LOGIC ---
  const triggerNotification = () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      new Notification("Pet Alert: Abnormality Detected!", {
        body: currentSummary,
        icon: "🚨" 
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Pet Alert: Abnormality Detected!", {
            body: currentSummary,
          });
        }
      });
    }
  };

  // Automatically trigger notification AND email if alertLevel changes to danger
  useEffect(() => {
    if (alertLevel === "danger") {
      triggerNotification();
      sendEmailAlert(); // Fires the email alongside the notification
    }
  }, [alertLevel]);

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

  return (
    <div style={{ 
      display: 'flex', minHeight: '100vh', width: '100vw', 
      background: colors.bgGradient, fontFamily: "'Inter', sans-serif", overflow: 'hidden'
    }}>
      
      {/* SIDEBAR */}
      <aside style={{ 
        width: '280px', height: 'calc(100vh - 70px)', background: colors.sidebarBg, 
        backdropFilter: 'blur(15px)', borderRight: `1px solid ${colors.border}`, 
        padding: '20px', position: 'fixed', left: 0, top: '70px', zIndex: 10, 
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box' 
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

      {/* MAIN CONTENT */}
      <main style={{ 
        flex: 1, marginLeft: '280px', marginTop: '70px', padding: '40px 60px', 
        height: 'calc(100vh - 70px)', overflowY: 'auto', boxSizing: 'border-box'
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
            <div className="mon__videoCard" style={{ 
              border: alertLevel === 'danger' ? `2px solid ${colors.danger}` : '1px solid rgba(255,255,255,0.6)',
              transition: 'border 0.3s ease'
            }}>
              <div className="mon__videoTop">
                <span className="mon__chip" style={{ backgroundColor: alertLevel === 'danger' ? colors.danger : colors.primary }}>
                  {alertLevel === 'danger' ? '⚠️ ABNORMALITY' : 'CAMERA'}
                </span>
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
              <div className="mon__panel" style={{ 
                display: 'flex', flexDirection: 'column', height: '100%',
                backgroundColor: alertLevel === 'danger' ? colors.warningBg : 'white',
                transition: 'background-color 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 className="mon__h2" style={{ margin: 0, color: alertLevel === 'danger' ? colors.danger : colors.textMain }}>AI Summary ✨</h2>
                    <span style={{ 
                      fontSize: '12px', fontWeight: 'bold', 
                      color: alertLevel === 'danger' ? colors.danger : colors.primary 
                    }}>
                      {alertLevel === 'danger' ? '🚨 HIGH PRIORITY' : 'LIVE'}
                    </span>
                </div>
                
                <div style={{ 
                  background: alertLevel === 'danger' ? 'white' : colors.accent, 
                  padding: '15px', borderRadius: '12px', marginBottom: '15px', 
                  border: `1px solid ${alertLevel === 'danger' ? colors.danger : colors.border}` 
                }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: '5px' }}>
                        Last Updated: {currentDateString} | {currentTimeString}
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: colors.textMain, lineHeight: '1.5', fontWeight: '600' }}>
                        {currentSummary}
                    </p>
                </div>

                <div style={{ marginTop: 'auto', borderTop: `1px solid ${colors.border}`, paddingTop: '15px' }}>
                    {alertLevel === 'danger' && (
                        <button 
                            onClick={() => setAlertLevel('normal')}
                            style={{ width: '100%', marginBottom: '15px', padding: '10px', borderRadius: '8px', border: 'none', background: colors.danger, color: 'white', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Dismiss Alert
                        </button>
                    )}
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', 
                      color: alertLevel === 'danger' ? colors.danger : '#10B981', 
                      fontSize: '13px', fontWeight: '700' 
                    }}>
                        <span style={{ 
                          width: '8px', height: '8px', borderRadius: '50%', 
                          background: alertLevel === 'danger' ? colors.danger : '#10B981' 
                        }}></span>
                        {alertLevel === 'danger' ? 'Emergency Protocol Active' : 'Analysis Engine Active'}
                    </div>
                </div>
              </div>
            </aside>
          </div>

          <section style={{ marginTop: '40px', background: 'white', borderRadius: '24px', padding: '30px', border: `1px solid ${colors.border}` }}>
              <h3 style={{ margin: '0 0 20px 0', color: colors.textMain, fontWeight: '800' }}>Past Summary Logs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {pastSummaries.map((log) => (
                      <div key={log.id} style={{ display: 'flex', gap: '20px', padding: '15px', borderBottom: `1px solid ${colors.border}`, alignItems: 'flex-start' }}>
                          <div style={{ minWidth: '100px' }}>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: colors.textMain }}>{log.time}</div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted }}>{log.date}</div>
                          </div>
                          <div style={{ fontSize: '14px', color: colors.textMain, fontWeight: '500' }}>
                              {log.text}
                          </div>
                      </div>
                  ))}
              </div>
          </section>
        </div>
      </main>
    </div>
  );
}