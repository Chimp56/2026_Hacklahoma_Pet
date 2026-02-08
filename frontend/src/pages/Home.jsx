import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import {
  MOCK_PETS,
  MOCK_UPCOMING_EVENTS,
  MOCK_POSTS_LIST,
  MOCK_ACTIVITY_HEIGHTS,
} from "../data/mockData";

export default function Home() {
  const navbarHeight = "70px";
  const { user, token } = useAuth();
  const [pets, setPets] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [activityStats, setActivityStats] = useState(null);
  const [latestPost, setLatestPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [streamRefreshKey, setStreamRefreshKey] = useState(0);
  const [streamFrameError, setStreamFrameError] = useState(false);

  const petName = pets[0]?.name || user?.name || "there";

  /** Live monitor thumbnail from backend stream current-frame (refreshed periodically) */
  const streamFrameUrl = `${api.getBaseUrl()}/stream/current-frame?channel=speedingchimp&_=${streamRefreshKey}`;

  /** Bar heights for activity chart: from API (days with sleep_minutes) or mock */
  const activityHeights =
    activityStats?.days?.length > 0
      ? activityStats.days.map((d) => Math.min(100, Number(d.sleep_minutes ?? 0)))
      : MOCK_ACTIVITY_HEIGHTS;

  useEffect(() => {
    let cancelled = false;
    const useMock = token === "mock";

    async function load() {
      try {
        if (useMock) {
          setPets(MOCK_PETS);
          setUpcomingEvents(MOCK_UPCOMING_EVENTS.events ?? []);
          setLatestPost(MOCK_POSTS_LIST[0] ?? null);
          setActivityStats(null);
          if (!cancelled) setLoading(false);
          return;
        }
        const [petsRes, eventsRes, postsRes] = await Promise.all([
          api.users.getMyPets(),
          api.users.getUpcomingEvents(5),
          api.community.getPosts(0, 1),
        ]);
        if (cancelled) return;
        setPets(Array.isArray(petsRes) ? petsRes : []);
        setUpcomingEvents(eventsRes?.events ?? []);
        const posts = Array.isArray(postsRes) ? postsRes : [];
        setLatestPost(posts[0] ?? null);
        if (petsRes?.length && petsRes[0]?.id) {
          const stats = await api.pets.getActivityStats(petsRes[0].id, 7);
          if (!cancelled) setActivityStats(stats);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  /** Refresh live monitor thumbnail every 15s */
  useEffect(() => {
    const interval = setInterval(() => setStreamRefreshKey((k) => k + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.7)',
    primary: '#A78BFA', 
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

  return (
    <div style={pageWrapperStyle}>
      
      {/* --- SIDEBAR NAVIGATION --- */}
      <aside style={sidebarStyle}>
        <nav style={{ flex: 1 }}>
          <Link to="/home" style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
            textDecoration: 'none', color: colors.primary, backgroundColor: 'rgba(167, 139, 250, 0.1)', 
            fontWeight: '600', borderRadius: '12px', marginBottom: '8px' 
          }}>
            🏠 Dashboard
          </Link>
          
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>
            <span>📹</span> Monitor
          </Link>

          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>
            <span>📊</span> Stats
          </Link>

          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>
            <span>📅</span> Calendar
          </Link>

          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>
            <span>🤝</span> Community
          </Link>
        </nav>

        {/* BOTTOM SECTION */}
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', marginBottom: '8px' }}>
            <span>⚙️</span> Account Settings
          </Link>
          
          {/* LOGOUT BUTTON REDIRECTS TO LANDING (/) */}
          <Link to="/" style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
            textDecoration: 'none', color: '#EF4444', fontWeight: '600', borderRadius: '12px' 
          }}>
            <span>🚪</span> Logout
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={mainContentStyle}>
        <header style={{ marginBottom: "40px" }}>
          <h1 style={{ margin: 0, color: colors.textMain, fontSize: "36px", fontWeight: "900" }}>
            Welcome back, <span style={{ color: colors.primary }}>{petName}</span>! 🐾
          </h1>
          <p style={{ color: colors.textMuted, fontSize: "18px", marginTop: "8px" }}>
            Here is what&apos;s happening in your world today.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "25px", paddingBottom: "40px" }}>
          {/* LIVE MONITOR PREVIEW */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Live Monitor</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.live }}></div>
                <span style={{ color: colors.live, fontSize: '12px', fontWeight: 'bold' }}>LIVE</span>
              </div>
            </div>
            <div style={{ width: '100%', height: '200px', backgroundColor: '#F1F5F9', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '2px solid #E2E8F0' }}>
              {streamFrameError ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ color: colors.textMuted, fontSize: '14px' }}>Stream unavailable</span>
                  <Link to="/moniter" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 'bold' }}>Open Camera Feed →</Link>
                </div>
              ) : (
                <>
                  <img
                    src={streamFrameUrl}
                    alt="Live stream preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={() => setStreamFrameError(true)}
                    onLoad={() => setStreamFrameError(false)}
                  />
                  <Link
                    to="/moniter"
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      padding: '8px 14px',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    Open full feed →
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ACTIVITY STATS PREVIEW */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 20px 0" }}>Activity Stats</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "140px", paddingBottom: "10px" }}>
              {activityHeights.map((h, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: colors.primary, height: `${h}%`, borderRadius: "8px", opacity: 0.8 }}></div>
              ))}
            </div>
          </div>

          {/* CALENDAR PREVIEW */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 20px 0" }}>Upcoming Events</h3>
            {upcomingEvents[0] ? (
              <div style={{ display: "flex", gap: "20px", alignItems: "center", backgroundColor: colors.accent, padding: "15px", borderRadius: "20px" }}>
                <div style={{ backgroundColor: colors.primary, color: "white", padding: "10px", borderRadius: "15px", textAlign: "center", minWidth: "50px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>OCT</div>
                  <div style={{ fontSize: "22px", fontWeight: "900" }}>24</div>
                </div>
                <Link to="/calendar" style={{ textDecoration: "none", color: colors.textMain, fontWeight: "800" }}>{upcomingEvents[0].title || "Vet Checkup"}</Link>
              </div>
            ) : (
              <p style={{ margin: 0, color: colors.textMuted }}>No upcoming events</p>
            )}
          </div>

          {/* COMMUNITY PREVIEW */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 20px 0" }}>Community Buzz</h3>
            {latestPost ? (
              <Link to="/community" style={{ display: "flex", gap: "12px", alignItems: "center", textDecoration: "none" }}>
                <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "linear-gradient(135deg, #A78BFA, #F3E8FF)" }}></div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", color: colors.textMain }}><b>{latestPost.user_name}:</b> {latestPost.title}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: colors.textMuted }}>{latestPost.created_at}</p>
                </div>
              </Link>
            ) : (
              <p style={{ margin: 0, color: colors.textMuted }}>No posts yet</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}