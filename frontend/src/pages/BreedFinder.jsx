import { useState } from "react";
import FileUpload from "../components/FileUpload";
import Loading from "../components/Loading";
import ResultCard from "../components/ResultCard";

export default function BreedFinder() {
  const [loading, setLoading] = useState(false);
  const [breeds, setBreeds] = useState(null);

  function handleUpload(file) {
    setLoading(true);

    setTimeout(() => {
      setBreeds([
        { name: "Golden Retriever", pct: 62 },
        { name: "Labrador", pct: 21 },
        { name: "Mixed", pct: 17 }
      ]);
      setLoading(false);
    }, 1500);
  }

  return (
    <div className="page">
      <h2>Breed Finder</h2>

      <FileUpload label="Find Breed" onSubmit={handleUpload} />

      {loading && <Loading />}

      {breeds && (
        <ResultCard title="Breed Breakdown">
          {breeds.map((b) => (
            <p key={b.name}>
              {b.name}: {b.pct}%
            </p>
          ))}
        </ResultCard>
      )}
    </div>
  );
}
