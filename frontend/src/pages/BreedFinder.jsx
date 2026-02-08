import { useState } from "react";
import FileUpload from "../components/FileUpload";
import Loading from "../components/Loading";
import ResultCard from "../components/ResultCard";
import api from "../api/api";

export default function BreedFinder() {
  const [loading, setLoading] = useState(false);
  const [breeds, setBreeds] = useState(null);
  const [species, setSpecies] = useState(null);
  const [error, setError] = useState("");

  async function handleUpload(file) {
    setLoading(true);
    setError("");
    setBreeds(null);
    setSpecies(null);
    try {
      const data = await api.gemini.analyzePet(file);
      setSpecies(Array.isArray(data.species) ? data.species : []);
      setBreeds(Array.isArray(data.breeds) ? data.breeds.map((b) => ({ name: b.breed, pct: Math.round(b.percentage ?? 0) })) : []);
    } catch (e) {
      setError(e.detail || e.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h2>Breed Finder</h2>

      <FileUpload label="Find Breed" onSubmit={handleUpload} />
      {loading && <Loading />}
      {breeds && (
        <ResultCard title="Breed Breakdown">
          {breeds.map((b) => (
            <p key={b.name}>{b.name}: {b.pct}%</p>
          ))}
        </ResultCard>
      )}
    </div>
  );
}
