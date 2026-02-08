import { useState } from "react";
import FileUpload from "../components/FileUpload";
import Loading from "../components/Loading";
import ResultCard from "../components/ResultCard";

export default function Audio() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function handleUpload(file) {
    setLoading(true);

    setTimeout(() => {
      setResult({
        mood: "Stressed",
        confidence: "76%"
      });
      setLoading(false);
    }, 1200);
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
