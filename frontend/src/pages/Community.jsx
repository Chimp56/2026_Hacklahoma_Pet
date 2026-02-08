import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePet } from '../PetContext';
import PetAvatar from '../components/PetAvatar';

// Assets
import post1 from "../assets/post1.png";
import post2 from "../assets/post2.png";
import post3 from "../assets/post3.png";

import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import avatar3 from "../assets/avatar3.png";
import makePost from "../assets/make-post.png";

import "./Community.css";

const FOLLOWING_IDS = new Set(["u1", "u3"]); // pretend you're following these users

// Mock "current user" for making posts
const CURRENT_USER = {
  id: "me",
  username: "asbah",
  displayName: "Asbah",
  avatar: avatar3, 
};

const seedPosts = [
  {
    id: "p1",
    authorId: "u1",
    username: "Chimp56",
    displayName: "Vincent",
    avatar: avatar1,
    location: "Colorado",
    createdAt: "2026-02-07T16:10:00Z",
    image: post1,
    caption: "He understood the assignment 🖐️🐶",
    tags: ["Outdoors", "Dog", "Goodday"],
    likes: 128,
    saves: 31,
    comments: [
      { id: "c1", user: "asbah", text: "the den setup is actually so smart", time: "2m" },
      { id: "c2", user: "mariam", text: "white noise works for my cat too", time: "6m" },
    ],
  },
  {
    id: "p2",
    authorId: "u2",
    username: "wen_deasel",
    displayName: "Wenddy",
    avatar: avatar2,
    location: "Oklahoma",
    createdAt: "2026-02-06T21:40:00Z",
    image: post2,
    caption: "This is why cats shouldn’t be left unattended.",
    tags: ["Funny", "Cat"],
    likes: 78,
    saves: 54,
    comments: [{ id: "c3", user: "asbah", text: "sniff work is OP fr", time: "1h" }],
  },
  {
    id: "p3",
    authorId: "u3",
    username: "azbah",
    displayName: "Asbah",
    avatar: avatar3,
    location: "Texas",
    createdAt: "2026-02-05T03:20:00Z",
    image: post3,
    caption: "Tiny high five, big win",
    tags: ["Birds", "Bonding"],
    likes: 210,
    saves: 92,
    comments: [
      { id: "c4", user: "farah", text: "my dog does this when routines change", time: "2d" },
      { id: "c5", user: "asbah", text: "wait this is actually useful", time: "2d" },
    ],
  },
];

function timeAgo(iso) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function trendScore(p) {
  return p.likes * 2 + p.saves * 4 + p.comments.length * 3;
}

export default function Community() {
  // --- SIDEBAR & PET SWITCHER STATE ---
  const { pets, activePet, setActivePet } = usePet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [posts, setPosts] = useState(seedPosts);

  const [sortMode, setSortMode] = useState("latest"); // latest | trending | following
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");

  // new: show only my posts toggle
  const [showMine, setShowMine] = useState(false);

  // comments modal
  const [activePostId, setActivePostId] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");

  // new: create post modal
  const [composerOpen, setComposerOpen] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newImage, setNewImage] = useState(makePost);

  const colors = {
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    sidebarBg: 'rgba(255, 255, 255, 0.95)',
    primary: '#A78BFA',
    primaryDark: '#8B5CF6',
    textMain: '#1E293B',
    textMuted: '#64748B',
    border: '#E2E8F0',
    danger: '#EF4444',
    accent: '#F5F3FF'
  };

  const locations = useMemo(() => {
    const uniq = Array.from(new Set(posts.map((p) => p.location))).sort();
    return ["All", ...uniq];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = posts.filter((p) => {
      const matchesMine = !showMine || p.authorId === CURRENT_USER.id;

      const matchesLocation =
        locationFilter === "All" || p.location === locationFilter;

      const matchesQuery =
        !q ||
        p.username.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q) ||
        p.tags.join(" ").toLowerCase().includes(q);

      return matchesMine && matchesLocation && matchesQuery;
    });

    if (sortMode === "following") {
      list = list.filter((p) => FOLLOWING_IDS.has(p.authorId));
    }

    if (sortMode === "latest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortMode === "trending") {
      list.sort((a, b) => trendScore(b) - trendScore(a));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [posts, query, locationFilter, sortMode, showMine]);

  const activePost = useMemo(
    () => posts.find((p) => p.id === activePostId) || null,
    [posts, activePostId]
  );

  function toggleLike(postId) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
  }

  function toggleSave(postId) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, saves: p.saves + 1 } : p))
    );
  }

  function openComments(postId) {
    setActivePostId(postId);
    setCommentDraft("");
  }

  function closeComments() {
    setActivePostId(null);
    setCommentDraft("");
  }

  function submitComment() {
    const text = commentDraft.trim();
    if (!text || !activePost) return;

    const newComment = {
      id: `c_${Math.random().toString(16).slice(2)}`,
      user: CURRENT_USER.username,
      text,
      time: "now",
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === activePost.id ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );

    setCommentDraft("");
  }

  // ===== Create Post =====
  function openComposer() {
    setComposerOpen(true);
    setNewCaption("");
    setNewLocation("");
    setNewTags("");
    setNewImage(makePost);
  }

  function closeComposer() {
    setComposerOpen(false);
  }

  function submitPost() {
    const caption = newCaption.trim();
    if (!caption) return;

    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const newPost = {
      id: `p_${Math.random().toString(16).slice(2)}`,
      authorId: CURRENT_USER.id,
      username: CURRENT_USER.username,
      displayName: CURRENT_USER.displayName,
      avatar: CURRENT_USER.avatar,
      location: newLocation.trim() || "No location",
      createdAt: new Date().toISOString(),
      image: newImage,
      caption,
      tags: tags.length ? tags : ["Post"],
      likes: 0,
      saves: 0,
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setComposerOpen(false);
    setShowMine(true); 
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: colors.bgGradient, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* FLOATING RE-OPEN BUTTON */}
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

      {/* SIDEBAR */}
      <aside style={{ 
        width: '280px', height: 'calc(100vh - 70px)', background: colors.sidebarBg, 
        backdropFilter: 'blur(15px)', borderRight: `1px solid ${colors.border}`, 
        padding: '20px', position: 'fixed', 
        left: sidebarOpen ? 0 : '-280px', 
        top: '70px', zIndex: 99, display: 'flex', flexDirection: 'column', 
        boxSizing: 'border-box', transition: 'left 0.3s ease-in-out'
      }}>
        
        <button 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'absolute', right: '15px', top: '15px', background: 'none', border: 'none', color: colors.textMuted, fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', opacity: 0.6 }}
        >
          ✕
        </button>

        {/* PET SWITCHER */}
        <div style={{ marginBottom: '25px', position: 'relative', marginTop: '10px' }}>
          <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.7, letterSpacing: '1.2px', textTransform: 'uppercase', display: 'block', marginBottom: '8px', color: colors.textMain }}>
            Active Profile
          </label>
          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, padding: '12px 16px', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(167, 139, 250, 0.3)', color: 'white' }}>
            <PetAvatar pet={activePet} size={28} />
            <span style={{ fontWeight: '800', flex: 1 }}>{activePet?.name}</span>
            <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </div>

          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '8px', zIndex: 1000, border: `1px solid ${colors.border}` }}>
              {pets.map(pet => (
                <div key={pet.id} onClick={() => { setActivePet(pet); setIsDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', backgroundColor: activePet?.id === pet.id ? colors.accent : 'transparent' }}>
                  <PetAvatar pet={pet} size={24} />
                  <span style={{ fontWeight: '700', color: colors.textMain, flex: 1 }}>{pet.name}</span>
                  {activePet?.id === pet.id && <span style={{ color: colors.primary }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>🏠 Dashboard</Link>
          <Link to="/moniter" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📹 Monitor</Link>
          <Link to="/stats" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📊 Stats</Link>
          <Link to="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>📅 Calendar</Link>
          <Link to="/community" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.primary, background: 'rgba(167, 139, 250, 0.15)', fontWeight: '700', borderRadius: '12px' }}>🤝 Community</Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: `1px solid ${colors.border}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: colors.textMuted, fontWeight: '600', borderRadius: '12px' }}>⚙️ Account Settings</Link>
          <Link to="/auth" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', color: colors.danger, fontWeight: '700', fontSize: '16px', cursor: 'pointer', textAlign: 'left' }}>🚪 Log Out</Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ 
        flex: 1, 
        marginLeft: sidebarOpen ? '280px' : '0px', 
        marginTop: '70px', 
        height: 'calc(100vh - 70px)', 
        overflowY: 'auto', 
        transition: 'margin-left 0.3s ease-in-out',
        boxSizing: 'border-box' 
      }}>
        <div className="comm">
          <div className="comm__container">
            {/* Top bar: actions + search + filters */}
            <div className="comm__top">
              <div className="comm__actionsRow">
                <button className="comm__actionBtn primary" onClick={openComposer}>+ New Post</button>
                <button className={`comm__actionBtn ${showMine ? "active" : ""}`} onClick={() => setShowMine(true)}>My Posts</button>
                <button className={`comm__actionBtn ${!showMine ? "active" : ""}`} onClick={() => setShowMine(false)}>All Posts</button>
              </div>

              <div className="comm__controls">
                <div className="comm__seg">
                  <button className={sortMode === "latest" ? "isActive" : ""} onClick={() => setSortMode("latest")}>Latest</button>
                  <button className={sortMode === "trending" ? "isActive" : ""} onClick={() => setSortMode("trending")}>Trending</button>
                  <button className={sortMode === "following" ? "isActive" : ""} onClick={() => setSortMode("following")}>Following</button>
                </div>

                <select className="comm__select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc === "All" ? "All locations" : `📍 ${loc}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Feed */}
            <main className="comm__feed">
              {filtered.map((p) => (
                <article key={p.id} className="post">
                  <header className="post__header">
                    <div className="post__who">
                      <img className="post__avatar" src={p.avatar} alt="" />
                      <div className="post__meta">
                        <div className="post__line1">
                          <span className="post__user">{p.username}</span>
                          <span className="post__time">• {timeAgo(p.createdAt)}</span>
                        </div>
                        <div className="post__loc">📍 {p.location}</div>
                      </div>
                    </div>
                    <button className="post__menu" title="More">⋯</button>
                  </header>

                  <div className="post__imageWrap">
                    <img className="post__image" src={p.image} alt="post" />
                  </div>

                  <div className="post__body">
                    <div className="post__actions">
                      <button className="iconBtn" onClick={() => toggleLike(p.id)}>♥ <span>{p.likes}</span></button>
                      <button className="iconBtn" onClick={() => openComments(p.id)}>💬 <span>{p.comments.length}</span></button>
                      <button className="iconBtn" onClick={() => toggleSave(p.id)}>🔖 <span>{p.saves}</span></button>
                      <button className="iconBtn" onClick={() => navigator.clipboard?.writeText(`post/${p.id}`)} title="Copy link">⤴︎</button>
                    </div>

                    <p className="post__caption"><span className="post__user">{p.username}</span> {p.caption}</p>

                    <div className="post__tags">
                      {p.tags.map((t) => (<span key={t} className="tag">{t}</span>))}
                    </div>

                    <button className="post__viewAll" onClick={() => openComments(p.id)}>View comments</button>

                    <div className="post__addComment">
                      <input placeholder="Add a comment..." onFocus={() => openComments(p.id)} readOnly />
                    </div>
                  </div>
                </article>
              ))}

              {filtered.length === 0 && (
                <div className="comm__empty">
                  <div className="comm__emptyTitle">No results</div>
                  <div className="comm__emptyText">Try a different username, tag, or location.</div>
                </div>
              )}
            </main>

            {/* Comments Modal */}
            {activePost && (
              <div className="modal" onMouseDown={closeComments}>
                <div className="modal__card" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="modal__header">
                    <div className="modal__title">Comments • <span className="muted">{activePost.username}</span></div>
                    <button className="modal__close" onClick={closeComments}>✕</button>
                  </div>
                  <div className="modal__content">
                    <div className="modal__left"><img className="modal__img" src={activePost.image} alt="post" /></div>
                    <div className="modal__right">
                      <div className="modal__thread">
                        {activePost.comments.map((c) => (
                          <div key={c.id} className="comment">
                            <span className="comment__user">{c.user}</span>
                            <span className="comment__text">{c.text}</span>
                            <span className="comment__time">{c.time}</span>
                          </div>
                        ))}
                        {activePost.comments.length === 0 && (<div className="muted">No comments yet.</div>)}
                      </div>
                      <div className="modal__composer">
                        <div className="emojiRow">
                          <button onClick={() => setCommentDraft((d) => d + "😂")}>😂</button>
                          <button onClick={() => setCommentDraft((d) => d + "❤️")}>❤️</button>
                          <button onClick={() => setCommentDraft((d) => d + "😭")}>😭</button>
                          <button onClick={() => setCommentDraft((d) => d + "🐾")}>🐾</button>
                        </div>
                        <div className="composeRow">
                          <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Add a comment…" onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }} />
                          <button className="sendBtn" onClick={submitComment}>Post</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Post Modal */}
            {composerOpen && (
              <div className="modal" onMouseDown={closeComposer}>
                <div className="modal__card" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="modal__header">
                    <div className="modal__title">New Post</div>
                    <button className="modal__close" onClick={closeComposer}>✕</button>
                  </div>
                  <div className="composer">
                    <div className="composer__preview">
                      <img className="composer__img" src={newImage} alt="preview" />
                      <div className="composer__pickRow">
                        <button className={`pickBtn ${newImage === makePost ? "active" : ""}`} onClick={() => setNewImage(makePost)}>1</button>
                        <button className={`pickBtn ${newImage === post2 ? "active" : ""}`} onClick={() => setNewImage(post2)}>2</button>
                        <button className={`pickBtn ${newImage === post3 ? "active" : ""}`} onClick={() => setNewImage(post3)}>3</button>
                      </div>
                    </div>
                    <div className="composer__form">
                      <label className="field"><span>Caption</span><textarea value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="Write something..." rows={4} /></label>
                      <label className="field"><span>Location</span><input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g., Texas" /></label>
                      <label className="field"><span>Tags (comma separated)</span><input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="Dog, Outdoors, Funny" /></label>
                      <div className="composer__actions">
                        <button className="comm__actionBtn" onClick={closeComposer}>Cancel</button>
                        <button className="comm__actionBtn primary" onClick={submitPost}>Post</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}