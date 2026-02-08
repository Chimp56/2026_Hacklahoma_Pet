import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }
    navigate("/community", { replace: true });
  }

  return (
    <div className="page">
      <h2>New Post</h2>
      {error && <p style={{ color: "#B91C1C", marginBottom: "16px" }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Title (optional)</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }} />
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Content *</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }} required />
        <button type="submit" style={{ padding: "12px 24px", background: "#A78BFA", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
          Post
        </button>
        <button type="button" onClick={() => navigate("/community")} style={{ marginLeft: "12px", padding: "12px 24px", background: "#E2E8F0", border: "none", borderRadius: "12px", cursor: "pointer" }}>
          Cancel
        </button>
      </form>
    </div>
  );
}
