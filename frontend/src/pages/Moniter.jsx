import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import FileUpload from "../components/FileUpload";
import Loading from "../components/Loading";
import ResultCard from "../components/ResultCard";
import api from "../api/api";

const DEFAULT_CHANNEL = "speedingchimp";

/** Proxy URL so backend fetches Twitch HLS (avoids 403 when browser hits Twitch directly). */
function getStreamProxyUrl() {
  return `${api.getBaseUrl()}/stream/proxy?channel=${encodeURIComponent(DEFAULT_CHANNEL)}`;
}

export default function Moniter() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [streamUrl] = useState(getStreamProxyUrl);
  const [streamError, setStreamError] = useState("");
  const [streamLoading, setStreamLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Attach HLS or native src to video when streamUrl is set (proxy URL)
  useEffect(() => {
    const video = videoRef.current;
    if (!streamUrl || !video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setStreamLoading(false));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hls.destroy();
          setStreamLoading(false);
          setStreamError(data.message || "Stream error. Channel may be offline.");
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      const onLoaded = () => setStreamLoading(false);
      const onErr = () => {
        setStreamLoading(false);
        setStreamError("Stream error. Channel may be offline.");
      };
      video.addEventListener("loadeddata", onLoaded);
      video.addEventListener("error", onErr);
      return () => {
        video.removeEventListener("loadeddata", onLoaded);
        video.removeEventListener("error", onErr);
        video.src = "";
      };
    }

    setStreamLoading(false);
    setStreamError("HLS playback not supported in this browser.");
  }, [streamUrl]);

  function handleUpload(file) {
    setAnalysisLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult({
        sleep: "38 minutes",
        meals: 1,
        activity: "Normal",
      });
      setAnalysisLoading(false);
    }, 1500);
  }

  return (
    <div className="page">
      <h2>Live Monitor</h2>

      {/* Live video via /api/v1/stream/proxy (avoids Twitch 403 in browser) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "900px",
          aspectRatio: "16/9",
          backgroundColor: "#111",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        {streamUrl && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            controls
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        )}
        {streamLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            Loading stream…
          </div>
        )}
        {streamError && !streamLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#EF4444",
              padding: "24px",
              textAlign: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            {streamError}
          </div>
        )}
      </div>
      <h3 style={{ marginTop: "8px", marginBottom: "12px" }}>Analyze video</h3>
      <FileUpload label="Analyze Video" onSubmit={handleUpload} />
      {analysisLoading && <Loading />}
      {result && (
        <ResultCard title="Results">
          <p>Sleep: {result.sleep}</p>
          <p>Meals: {result.meals}</p>
          <p>Activity: {result.activity}</p>
        </ResultCard>
      )}
    </div>
  );
}
