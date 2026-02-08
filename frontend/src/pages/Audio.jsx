import { useState } from "react";
import FileUpload from "../components/FileUpload";
import Loading from "../components/Loading";
import ResultCard from "../components/ResultCard";
import api from "../api/api";

export default function Audio() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleUpload(file) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api.gemini.analyzeAudio(file);
      setResult({
        mood: data.mood || "Unknown",
        confidence: typeof data.confidence === "number" ? `${Math.round(data.confidence * 100)}%` : "—",
      });
    } catch (e) {
      setError(e.detail || e.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h2>Audio Detection</h2>
      <FileUpload label="Analyze Audio" onSubmit={handleUpload} />
      {loading && <Loading />}
      {result && (
        <ResultCard title="Vocal Analysis">
          <p>Mood: {result.mood}</p>
          <p>Confidence: {result.confidence}</p>
        </ResultCard>
      )}
    </div>
  );
}
