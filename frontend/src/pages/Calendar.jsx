import React, { useState } from 'react';
import { Link } from "react-router-dom";

export default function Calendar({ events, setEvents }) {
  const realToday = new Date(2026, 1, 7); 
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
  
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.9)',
    primary: '#A78BFA',
    textMain: '#1E293B',
    textMuted: '#64748B',
    danger: '#F87171',
    border: '#CBD5E1',
    white: '#FFFFFF'
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleSaveEvent = () => {
    if (!newTitle || !newDate) return alert("Please fill in both fields!");
    const selectedDate = new Date(newDate);
    const eventToAdd = {
      id: Date.now(),
      year: selectedDate.getUTCFullYear(),
      month: selectedDate.getUTCMonth(),
      day: selectedDate.getUTCDate(),
      title: newTitle,
      color: "#A78BFA"
    };
    setEvents([...events, eventToAdd]);
    setNewTitle("");
    setNewDate("");
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(ev => ev.id !== id));
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
      
      {/* PAW BACKGROUND */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.08, zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%23A78BFA'%3E%3Cpath d='M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'/%3E%3C/svg%3E")`, backgroundSize: '120px 120px' }} />

      {/* SIDEBAR */}
      <aside style={{ width: '280px', height: '100vh', background: colors.sidebarBg, backdropFilter: 'blur(15px)', borderRight: `1px solid ${colors.border}`, padding: '30px 20px', position: 'fixed', left: 0, top: 0, zIndex: 10, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '24px', fontWeight: '900', color: colors.primary, marginBottom: '40px', paddingLeft: '16px' }}>🐾 PetDash</div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>🏠 Dashboard</Link>
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📹 Monitor</Link>
          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📊 Stats</Link>
          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, background: 'rgba(167, 139, 250, 0.15)', fontWeight: '700', borderRadius: '12px' }}>📅 Calendar</Link>
          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>🤝 Community</Link>
        </nav>
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${colors.border}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>⚙️ Account Settings</Link>
          <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', color: colors.danger, fontWeight: '700', fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}>🚪 Log Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT - ADJUSTED TO CLEAR NAV BAR */}
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        marginTop: '70px', // Pushes content down so Navbar doesn't block it
        height: 'calc(100vh - 70px)', // Ensures scroll area fits perfectly
        overflowY: 'auto', 
        overscrollBehavior: 'contain', 
        padding: '40px 60px', 
        zIndex: 1,
        boxSizing: 'border-box'
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '900', color: colors.textMain }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => changeMonth(-1)} style={{ padding: '12px 20px', borderRadius: '14px', border: `1px solid ${colors.border}`, background: 'white', cursor: 'pointer', fontWeight: '800' }}>&larr; Prev</button>
            <button onClick={() => changeMonth(1)} style={{ padding: '12px 20px', borderRadius: '14px', border: `1px solid ${colors.border}`, background: 'white', cursor: 'pointer', fontWeight: '800' }}>Next &rarr;</button>
          </div>
        </header>

        {/* CALENDAR GRID */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', borderRadius: '30px', padding: '35px', backdropFilter: 'blur(20px)', border: '2px solid white', marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontWeight: '900', color: colors.primary, fontSize: '12px', textTransform: 'uppercase', paddingBottom: '10px' }}>{d}</div>
            ))}
            {blanks.map(b => <div key={`b-${b}`} />)}
            {daysArray.map(d => {
              const iterDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
              const isPast = iterDate < realToday;
              const isToday = iterDate.toDateString() === realToday.toDateString();
              const dayEvents = events.filter(e => e.day === d && e.month === currentDate.getMonth() && e.year === currentDate.getFullYear());

              return (
                <div key={d} style={{
                  minHeight: '115px', borderRadius: '22px', padding: '12px',
                  background: isToday ? 'rgba(167, 139, 250, 0.1)' : colors.white,
                  border: isToday ? `3px solid ${colors.primary}` : '1px solid #E2E8F0',
                  opacity: isPast ? 0.5 : 1,
                  display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <span style={{ fontWeight: '900', fontSize: '15px', textDecoration: isPast ? 'line-through' : 'none' }}>{d}</span>
                  {dayEvents.map((ev) => (
                    <div key={ev.id} style={{ fontSize: '10px', background: ev.color, color: 'white', padding: '5px 8px', borderRadius: '9px', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ textDecoration: isPast ? 'line-through' : 'none' }}>{ev.title}</span>
                      {!isPast && (
                        <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ADD EVENT FORM */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', borderRadius: '30px', padding: '35px', border: '2px solid white', marginBottom: '80px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '900' }}>Schedule Event</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Event Title..." 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ flex: 2, padding: '16px', borderRadius: '16px', border: `1px solid ${colors.border}`, outline: 'none' }} 
            />
            <input 
              type="date" 
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              style={{ flex: 1, padding: '16px', borderRadius: '16px', border: `1px solid ${colors.border}`, outline: 'none' }} 
            />
            <button 
              onClick={handleSaveEvent}
              style={{ flex: 1, background: colors.primary, color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' }}
            >
              Save Event
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
