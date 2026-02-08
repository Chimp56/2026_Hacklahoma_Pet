import { useEffect, useRef, useState } from "react";
import "./Monitor.css";

export default function Monitor() {
  const videoRef = useRef(null);
  const [mode, setMode] = useState("placeholder"); // "placeholder" | "webcam" | "backend"
  const [status, setStatus] = useState("Waiting for stream…");
  const [metric, setMetric] = useState({
    activity: "—",
    posture: "—",
    confidence: "—",
    lastEvent: "—",
  });

  // OPTIONAL: use your own webcam to test the layout
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
    <div className="mon">
      <div className="mon__header">
        <div>
          <h1 className="mon__title">Live Monitor</h1>
          <p className="mon__sub">{status}</p>
        </div>

        <div className="mon__controls">
          <button
            className={`mon__btn ${mode === "placeholder" ? "isActive" : ""}`}
            onClick={() => setMode("placeholder")}
          >
            Placeholder
          </button>
          <button
            className={`mon__btn ${mode === "webcam" ? "isActive" : ""}`}
            onClick={() => setMode("webcam")}
          >
            Test Webcam
          </button>
          <button
            className={`mon__btn ${mode === "backend" ? "isActive" : ""}`}
            onClick={() => {
              setMode("backend");
              setStatus("Waiting for backend stream URL…");
            }}
          >
            Backend Stream
          </button>
        </div>
      </div>

      <div className="mon__grid">
        {/* Video Panel */}
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
                <p className="mon__placeholderText">
                  Live feed.
                  <br />
                </p>
              </div>
            ) : (
              <video ref={videoRef} className="mon__video" autoPlay playsInline muted />
            )}

            {/* Overlay UI (fake for now, real later) */}
            
          </div>
        </div>

        {/* Insights Panel */}
        <aside className="mon__side">
          

          <div className="mon__panel">
            <h2 className="mon__h2">Notes</h2>
            <textarea className="mon__notes" placeholder="Storm started at 9:10 PM, barking increased…" />
            <button className="mon__btnWide">Save Note</button>
          </div>

          
        </aside>
      </div>
    </div>
  );
}
