import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePet } from "../PetContext";
import api from "../api/api";
import PetAvatar from "../components/PetAvatar";

export default function Stats() {
  // --- PET SWITCHER STATE & CONTEXT ---
  const { pets, setPets, activePet, setActivePet } = usePet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- LIVE SYNC STATE (Per Second) ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentActivity, setCurrentActivity] = useState("Active");
  const [jitter, setJitter] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setJitter((Math.random() - 0.5) * 4); // small random wiggle
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- ACTIVITY STATE LOGS ---
  const [activityStateLogs, setActivityStateLogs] = useState([]);

  // --- MEDICAL RECORDS ---
  const fileInputRef = useRef(null);

  const mockMedicalRecords = useMemo(
    () => [
      {
        id: "mock-1",
        name: "Vaccination_Record_2025.pdf",
        date: "2025-12-15",
        size: "1.2 MB",
        source: "mock",
      },
      {
        id: "mock-2",
        name: "Annual_Checkup_Summary.docx",
        date: "2026-01-10",
        size: "450 KB",
        source: "mock",
      },
    ],
    []
  );

  const [apiMedicalRecords, setApiMedicalRecords] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewerBlobUrl, setViewerBlobUrl] = useState(null);
  const [loadingViewer, setLoadingViewer] = useState(false);

  // --- STYLE CONSTANTS ---
  const navbarHeight = "70px";
  const colors = {
    bgGradient: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)",
    sidebarBg: "rgba(255, 255, 255, 0.95)",
    primary: "#A78BFA",
    primaryDark: "#8B5CF6",
    textMain: "#1E293B",
    textMuted: "#64748B",
    white: "#FFFFFF",
    border: "#E2E8F0",
    wellness: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    activity: "#f43fb8",
    accent: "#F5F3FF",
  };

  // ✅ GRAPH / SCALE CONTROLS (this is what you wanted)
  const CHART_BASELINE_Y = 140; // lower = move chart up, higher = down
  const WELLNESS_SCALE = 1.15; // smaller number = smaller y scale = bigger visible jumps (but not clipping)
  const ACTIVITY_SCALE = 1.15; // keep same as wellness if both are 0–100
  const SLEEP_SCALE = 9; // sleep is hours (0–15-ish), so it needs a bigger multiplier

  // --- RELATIVE LABELS ---
  const relativeLabels = useMemo(
    () => ["60s ago", "50s ago", "40s ago", "30s ago", "20s ago", "10s ago", "Now"],
    []
  );

  const displayDate =
    currentTime.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) + ` | ${currentTime.toLocaleTimeString()}`;

  // Activity status options (UI)
  const activityMap = {
    "Very Active": 100,
    Active: 80,
    "Low Energy": 45,
    Lethargic: 15,
  };

  /** Map UI status to API active (true = active, false = resting). */
  const statusToActive = (status) => status === "Very Active" || status === "Active";

  // --- API activity series: 7 points (60s ago ... Now)
  const activityFromApi = useMemo(() => {
    if (!activityStateLogs?.length) return null;

    const now = currentTime.getTime();
    const bucketSeconds = [60, 50, 40, 30, 20, 10, 0];
    const sorted = [...activityStateLogs].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    );

    return bucketSeconds.map((secAgo) => {
      const bucketTime = new Date(now - secAgo * 1000).getTime();
      const prior = sorted.filter((l) => new Date(l.start_time).getTime() <= bucketTime);
      const latest = prior[prior.length - 1];
      if (!latest) return 50;
      return latest.active ? 80 : 20;
    });
  }, [activityStateLogs, currentTime]);

  // ✅ Normalize fallback activity into 0–100 so the chart always shows jumps properly
  const toPctFrom15 = (v) => Math.min(100, Math.max(0, (v / 15) * 100));

  // Data: sleep from context; activity from API logs when available, else normalize fallback + jitter
  const rawData = useMemo(() => {
    // sleep in hours
    const sleep = [8, 8, 8, 8, 8, 8, activePet?.stats?.sleepHours ?? 8];

    let activity;

    if (activityFromApi && activityFromApi.length === 7) {
      activity = [...activityFromApi];
      activity[6] = Math.min(100, Math.max(0, (activity[6] ?? 0) + jitter));
    } else {
      const fallback = activePet?.stats?.activityData ?? [8, 7, 9, 11, 8, 10, 8];

      // If fallback looks like small numbers (<= 15), treat it as 0–15 and convert to %
      const looksLikeHoursScale = Math.max(...fallback) <= 15;

      const converted = looksLikeHoursScale ? fallback.map(toPctFrom15) : fallback.map((v) => Number(v) || 0);

      activity = [...converted.slice(0, 6), (converted[6] ?? 50) + jitter];
      activity[6] = Math.min(100, Math.max(0, activity[6]));
    }

    return { sleep, activity };
  }, [activePet, jitter, activityFromApi]);

  const calculateWellness = (sleepHrs, activityPct) => {
    const sleepScore = Math.min((sleepHrs / 8) * 100, 100);
    return Math.max((sleepScore + activityPct) / 2, 20);
  };

  const liveWellnessScores = useMemo(
    () => rawData.sleep.map((s, i) => calculateWellness(s, rawData.activity[i] ?? 50)),
    [rawData]
  );

  const avgWellness = useMemo(() => {
    const sum = liveWellnessScores.reduce((a, b) => a + b, 0);
    return sum / liveWellnessScores.length;
  }, [liveWellnessScores]);

  const getThemeColor = (score) => {
    if (score >= 80) return colors.wellness;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };
  const currentThemeColor = getThemeColor(avgWellness);

  // --- Medical Records list (API + mocks)
  const allMedicalRecords = useMemo(() => {
    const fromApi = (apiMedicalRecords || []).map((m) => {
      const name =
        (m.storage_key && m.storage_key.split(/[/\\]/).pop()) || `Medical record #${m.id}`;
      const date = m.created_at ? new Date(m.created_at).toISOString().split("T")[0] : "—";
      const size =
        m.file_size_bytes != null
          ? m.file_size_bytes < 1024
            ? `${m.file_size_bytes} B`
            : (m.file_size_bytes / 1024).toFixed(1) + " KB"
          : "—";
      return {
        id: `api-${m.id}`,
        apiId: m.id,
        name,
        date,
        size,
        source: "api",
        mimeType: m.mime_type || "",
      };
    });
    return [...fromApi, ...mockMedicalRecords];
  }, [apiMedicalRecords, mockMedicalRecords]);

  const fetchMedicalRecords = async () => {
    if (!activePet?.id) return;
    try {
      const list = await api.pets.listMedicalRecords(activePet.id);
      setApiMedicalRecords(list);
    } catch (_) {
      setApiMedicalRecords([]);
    }
  };

  useEffect(() => {
    fetchMedicalRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePet?.id]);

  const fetchActivityStateLogs = async () => {
    if (!activePet?.id) return;
    try {
      const since = new Date(Date.now() - 2 * 60 * 1000);
      const list = await api.pets.getActivityStateLogs(activePet.id, { since, limit: 200 });
      setActivityStateLogs(Array.isArray(list) ? list : []);
    } catch (_) {
      setActivityStateLogs([]);
    }
  };

  useEffect(() => {
    fetchActivityStateLogs();
    const interval = setInterval(fetchActivityStateLogs, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePet?.id]);

  // --- SVG helpers ---
  const GRAPH_SPACING = 60;
  const GRAPH_PADDING = 20;

  // smaller y-scale = smaller multiplier, BUT we’re using a tuned multiplier above
  const getPath = (vals, multiplier) =>
    vals.map((v, i) => `${i * GRAPH_SPACING + GRAPH_PADDING},${CHART_BASELINE_Y - v * multiplier}`).join(" L ");

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const lifetimeScores = [45, 55, 48, 82, 85, 78, 90, 88, 55, 42, 65, avgWellness];

  const handleSleepUpdate = (newVal) => {
    const val = parseFloat(newVal);
    const updatedPets = pets.map((p) => {
      if (p.id === activePet.id) {
        const updated = { ...p, stats: { ...p.stats, sleepHours: val } };
        setActivePet(updated);
        return updated;
      }
      return p;
    });
    setPets(updatedPets);
  };

  const handleActivityUpdate = async (status) => {
    setCurrentActivity(status);
    const numericValue = activityMap[status];

    // store as a 0–100 value (so your chart stays consistent)
    const updatedPets = pets.map((p) => {
      if (p.id === activePet.id) {
        const existing = p.stats?.activityData ?? [50, 50, 50, 50, 50, 50, 50];
        const converted = existing.map((v) => {
          const n = Number(v) || 0;
          // if old data was 0–15, convert it
          return n <= 15 ? toPctFrom15(n) : Math.min(100, Math.max(0, n));
        });
        const newActivity = [...converted.slice(0, 6), numericValue];
        const updated = { ...p, stats: { ...p.stats, activityData: newActivity } };
        setActivePet(updated);
        return updated;
      }
      return p;
    });
    setPets(updatedPets);

    if (activePet?.id) {
      try {
        await api.pets.createActivityStateLog(activePet.id, {
          active: statusToActive(status),
          start_time: new Date().toISOString(),
        });
        await fetchActivityStateLogs();
      } catch (_) {}
    }
  };

  // --- Upload + View Medical Records ---
  const ALLOWED_MEDICAL_MIMES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    setUploadError("");

    const mime = (file.type || "").toLowerCase();
    if (!ALLOWED_MEDICAL_MIMES.includes(mime)) {
      setUploadError("Allowed types: PDF, DOC, DOCX, JPG, PNG.");
      return;
    }
    if (!activePet?.id) {
      setUploadError("Please select a pet first.");
      return;
    }

    try {
      await api.pets.uploadMedicalRecord(activePet.id, file);
      await fetchMedicalRecords();
    } catch (e) {
      setUploadError(e?.message || "Upload failed.");
    }
  };

  const handleViewRecord = async (record) => {
    if (record.source === "mock") {
      setViewingRecord({ type: "mock", record });
      return;
    }

    if (record.source === "api" && record.apiId != null && activePet?.id) {
      setLoadingViewer(true);
      setViewingRecord({ type: "api", record });
      setViewerBlobUrl(null);

      try {
        const blob = await api.pets.getMedicalRecordFile(activePet.id, record.apiId);
        const url = URL.createObjectURL(blob);
        setViewerBlobUrl(url);
      } catch (_) {
        setViewerBlobUrl("");
      }
      setLoadingViewer(false);
    }
  };

  const closeViewer = () => {
    if (viewerBlobUrl) URL.revokeObjectURL(viewerBlobUrl);
    setViewerBlobUrl(null);
    setViewingRecord(null);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        background: colors.bgGradient,
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* --- SIDEBAR TOGGLE --- */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: "fixed",
            left: "20px",
            top: "85px",
            zIndex: 1000,
            background: colors.primary,
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(167, 139, 250, 0.4)",
            fontSize: "18px",
          }}
        >
          ➼
        </button>
      )}

      {/* --- SIDEBAR --- */}
      <aside
        style={{
          width: "280px",
          height: `calc(100vh - ${navbarHeight})`,
          background: colors.sidebarBg,
          backdropFilter: "blur(15px)",
          borderRight: `1px solid ${colors.border}`,
          padding: "30px 20px",
          position: "fixed",
          left: sidebarOpen ? 0 : "-280px",
          top: navbarHeight,
          zIndex: 99,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          transition: "left 0.3s ease-in-out",
        }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "absolute",
            right: "15px",
            top: "15px",
            background: "none",
            border: "none",
            color: colors.textMuted,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: "25px", position: "relative" }}>
          <label
            style={{
              fontSize: "10px",
              fontWeight: "900",
              opacity: 0.7,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "8px",
              color: colors.textMain,
            }}
          >
            Active Profile
          </label>

          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              padding: "12px 16px",
              borderRadius: "20px",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(167, 139, 250, 0.3)",
              color: "white",
            }}
          >
            <PetAvatar pet={activePet} size={28} />
            <span style={{ fontWeight: "800", flex: 1 }}>{activePet?.name}</span>
            <span>{isDropdownOpen ? "▲" : "▼"}</span>
          </div>

          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                borderRadius: "20px",
                boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                padding: "8px",
                zIndex: 1000,
              }}
            >
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  onClick={() => {
                    setActivePet(pet);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    backgroundColor: activePet?.id === pet.id ? colors.accent : "transparent",
                  }}
                >
                  <PetAvatar pet={pet} size={24} />
                  <span style={{ fontWeight: "700", color: colors.textMain, flex: 1 }}>{pet.name}</span>
                  {activePet?.id === pet.id && <span style={{ color: colors.primary }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <nav style={{ flex: 1 }}>
          <Link
            to="/home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              textDecoration: "none",
              color: colors.textMuted,
              fontWeight: "600",
            }}
          >
            🏠 Dashboard
          </Link>
          <Link
            to="/moniter"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              textDecoration: "none",
              color: colors.textMuted,
              fontWeight: "600",
            }}
          >
            📹 Monitor
          </Link>
          <Link
            to="/stats"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              textDecoration: "none",
              color: colors.primary,
              backgroundColor: "rgba(167, 139, 250, 0.1)",
              fontWeight: "600",
              borderRadius: "12px",
            }}
          >
            📊 Stats
          </Link>
          <Link
            to="/calendar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              textDecoration: "none",
              color: colors.textMuted,
              fontWeight: "600",
            }}
          >
            📅 Calendar
          </Link>
          <Link
            to="/community"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              textDecoration: "none",
              color: colors.textMuted,
              fontWeight: "600",
            }}
          >
            🤝 Community
          </Link>
        </nav>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "20px" }}>
          <Link
            to="/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              textDecoration: "none",
              color: colors.textMuted,
              fontWeight: "600",
            }}
          >
            ⚙️ Account Settings
          </Link>
          <Link
            to="/auth"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              textDecoration: "none",
              color: colors.danger,
              fontWeight: "700",
            }}
          >
            🚪 Log Out
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? "280px" : "0px",
          marginTop: navbarHeight,
          padding: "40px 60px",
          height: `calc(100vh - ${navbarHeight})`,
          overflowY: "auto",
          boxSizing: "border-box",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        <header
          style={{
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "900", color: colors.textMain }}>
              Real-Time Analysis
            </h1>
            <p style={{ margin: 0, color: colors.textMuted, fontWeight: "600" }}>{displayDate}</p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "white",
              padding: "8px 16px",
              borderRadius: "12px",
              border: `1px solid ${colors.border}`,
            }}
          >
            <span
              style={{
                height: "8px",
                width: "8px",
                borderRadius: "50%",
                backgroundColor: colors.danger,
                animation: "pulse 0.8s infinite",
              }}
            />
            <span style={{ fontWeight: "900", fontSize: "12px", color: colors.textMain, letterSpacing: "1px" }}>
              REC LIVE
            </span>
          </div>
        </header>

        {/* --- LIVE GRAPH --- */}
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "28px",
            border: `1px solid ${colors.border}`,
            marginBottom: "25px",
          }}
        >
          <div style={{ display: "flex", gap: "20px", marginBottom: "30px", fontSize: "12px", fontWeight: "bold" }}>
            <span>
              <span style={{ color: colors.wellness }}>●</span> Wellness
            </span>
            <span style={{ color: "#6366F1" }}>● Recovery (Sleep)</span>
            <span style={{ color: colors.activity }}>● Activity (Exercise)</span>
          </div>

          <svg viewBox="0 0 420 180" style={{ width: "100%", height: "auto", overflow: "visible" }}>
            {/* Wellness (thick colored segments) */}
            {liveWellnessScores.map((score, i) =>
              i === 0 ? null : (
                <line
                  key={i}
                  x1={(i - 1) * GRAPH_SPACING + GRAPH_PADDING}
                  y1={CHART_BASELINE_Y - liveWellnessScores[i - 1] * WELLNESS_SCALE}
                  x2={i * GRAPH_SPACING + GRAPH_PADDING}
                  y2={CHART_BASELINE_Y - score * WELLNESS_SCALE}
                  stroke={getThemeColor(score)}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              )
            )}

            {/* Sleep (dashed) */}
            <path
              d={`M ${getPath(rawData.sleep, SLEEP_SCALE)}`}
              fill="none"
              stroke="#6366F1"
              strokeWidth="2"
              strokeDasharray="4"
            />

            {/* Activity (hot pink) */}
            <path
              d={`M ${getPath(rawData.activity, ACTIVITY_SCALE)}`}
              fill="none"
              stroke={colors.activity}
              strokeWidth="2"
            />

            {/* Labels */}
            {relativeLabels.map((label, i) => (
              <text
                key={i}
                x={i * GRAPH_SPACING + GRAPH_PADDING}
                y="165"
                textAnchor="middle"
                style={{
                  fontSize: "11px",
                  fill: label === "Now" ? colors.danger : colors.textMuted,
                  fontWeight: label === "Now" ? "900" : "700",
                }}
              >
                {label}
              </text>
            ))}
          </svg>
        </div>

        {/* --- HEALTH INDEX --- */}
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "28px",
            borderLeft: `8px solid ${currentThemeColor}`,
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ margin: 0, color: colors.textMuted }}>Current Wellness Index</h4>
          <span style={{ fontSize: "36px", fontWeight: "900", color: currentThemeColor }}>{avgWellness.toFixed(0)}%</span>
        </div>

        {/* --- ACTIVITY & SLEEP CONTROLS --- */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "25px", marginBottom: "25px" }}>
          <div style={{ backgroundColor: "white", padding: "28px", borderRadius: "28px", border: `1px solid ${colors.border}` }}>
            <h4 style={{ marginTop: 0, marginBottom: "20px" }}>Instant Activity State</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {Object.keys(activityMap).map((status) => (
                <button
                  key={status}
                  onClick={() => handleActivityUpdate(status)}
                  style={{
                    padding: "14px 10px",
                    borderRadius: "12px",
                    border: `2px solid ${currentActivity === status ? colors.activity : colors.border}`,
                    backgroundColor: currentActivity === status ? `${colors.activity}10` : "white",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: "white", padding: "28px", borderRadius: "28px", border: `1px solid ${colors.border}` }}>
            <h4 style={{ margin: 0 }}>Rest Index</h4>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={activePet?.stats?.sleepHours ?? 8}
              onChange={(e) => handleSleepUpdate(e.target.value)}
              style={{ width: "100%", marginTop: "20px", accentColor: colors.primary }}
            />
          </div>
        </div>

        {/* --- ANNUAL PROGRESS --- */}
        <div style={{ backgroundColor: "white", padding: "35px", borderRadius: "28px", border: `1px solid ${colors.border}`, marginBottom: "25px" }}>
          <h4 style={{ marginTop: 0, marginBottom: "25px" }}>2026 Annual Overview</h4>
          <svg viewBox="0 0 780 180" style={{ width: "100%", height: "auto", overflow: "visible" }}>
            {lifetimeScores.map((score, i) =>
              i === 0 ? null : (
                <line
                  key={i}
                  x1={(i - 1) * 68 + GRAPH_PADDING}
                  y1={CHART_BASELINE_Y - lifetimeScores[i - 1] * 1.1}
                  x2={i * 68 + GRAPH_PADDING}
                  y2={CHART_BASELINE_Y - score * 1.1}
                  stroke={getThemeColor(score)}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              )
            )}
            {months.map((m, i) => (
              <text
                key={i}
                x={i * 68 + GRAPH_PADDING}
                y="165"
                textAnchor="middle"
                style={{ fontSize: "11px", fill: colors.textMuted, fontWeight: "800" }}
              >
                {m}
              </text>
            ))}
          </svg>
        </div>

        {/* --- MEDICAL RECORDS --- */}
        <div style={{ backgroundColor: "white", padding: "35px", borderRadius: "28px", border: `1px solid ${colors.border}`, marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: colors.textMain }}>Medical Records</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: colors.textMuted }}>Centralized history for {activePet?.name}</p>
            </div>

            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                padding: "10px 20px",
                backgroundColor: colors.primary,
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(167, 139, 250, 0.3)",
              }}
            >
              + Upload Record
            </button>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.png,.jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            />
          </div>

          {uploadError && (
            <p style={{ margin: "0 0 16px 0", color: colors.danger, fontSize: "13px", fontWeight: "600" }}>{uploadError}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {allMedicalRecords.map((record) => (
              <div
                key={record.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "16px",
                  border: `1px solid ${colors.border}`,
                  backgroundColor: "#F9FAFB",
                }}
              >
                <div style={{ fontSize: "24px", marginRight: "16px" }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "700", color: colors.textMain, fontSize: "14px" }}>{record.name}</div>
                  <div style={{ fontSize: "12px", color: colors.textMuted }}>
                    Uploaded on {record.date} • {record.size}
                    {record.source === "api" ? " • Saved" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewRecord(record)}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.primary,
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- VIEWER MODAL --- */}
      {viewingRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.target === e.currentTarget && closeViewer()}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span style={{ fontWeight: "700", color: colors.textMain }}>{viewingRecord.record?.name || "Medical record"}</span>
              <button
                type="button"
                onClick={closeViewer}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: colors.textMuted, padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", minHeight: "70vh" }}>
              {viewingRecord.type === "mock" && (
                <p style={{ padding: "40px", color: colors.textMuted, textAlign: "center" }}>
                  Preview not available for this sample record. Upload a file to view it here.
                </p>
              )}

              {viewingRecord.type === "api" && loadingViewer && (
                <p style={{ padding: "40px", color: colors.textMuted, textAlign: "center" }}>Loading…</p>
              )}

              {viewingRecord.type === "api" && !loadingViewer && viewerBlobUrl && (() => {
                const mime = (viewingRecord.record?.mimeType || "").toLowerCase();
                const isImage = mime === "image/jpeg" || mime === "image/png";
                const isPdf = mime === "application/pdf";

                if (isImage) {
                  return (
                    <div style={{ padding: "20px", overflow: "auto", maxHeight: "85vh", textAlign: "center" }}>
                      <img
                        src={viewerBlobUrl}
                        alt={viewingRecord.record?.name}
                        style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
                      />
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <iframe
                      title="Medical record"
                      src={viewerBlobUrl}
                      style={{ width: "100%", height: "85vh", minHeight: "600px", border: "none" }}
                    />
                  );
                }

                return (
                  <div style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
                    <p style={{ marginBottom: "16px" }}>
                      Preview not available for this file type. Download it to open elsewhere.
                    </p>
                    <a href={viewerBlobUrl} download={viewingRecord.record?.name || "medical-record"} style={{ color: colors.primary, fontWeight: "700" }}>
                      Download file
                    </a>
                  </div>
                );
              })()}

              {viewingRecord.type === "api" && !loadingViewer && !viewerBlobUrl && (
                <p style={{ padding: "40px", color: colors.danger, textAlign: "center" }}>Could not load the file.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
