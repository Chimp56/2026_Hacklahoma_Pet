import { useState } from "react";
import FileUpload from "../components/FileUpload";
import Loading from "../components/Loading";
import ResultCard from "../components/ResultCard";

export default function Camera() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function handleUpload(file) {
    setLoading(true);

    // fake AI result
    setTimeout(() => {
      setResult({
        sleep: "38 minutes",
        meals: 1,
        activity: "Normal"
      });
      setLoading(false);
    }, 1500);
  }

  return (
    <div className="page">
      <h2>Camera Analysis</h2>

      <FileUpload label="Analyze Video" onSubmit={handleUpload} />

      {loading && <Loading />}

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
