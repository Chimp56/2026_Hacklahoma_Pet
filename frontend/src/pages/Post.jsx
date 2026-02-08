import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MOCK_POSTS_BY_ID } from "../data/mockData";

export default function Post() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = id ? MOCK_POSTS_BY_ID[id] ?? MOCK_POSTS_BY_ID[1] : MOCK_POSTS_BY_ID[1];

  return (
    <div className="page">
      <button type="button" onClick={() => navigate("/community")} style={{ marginBottom: "16px", padding: "8px 16px", background: "#E2E8F0", border: "none", borderRadius: "8px", cursor: "pointer" }}>
        ← Back
      </button>
      <h2>{post.title}</h2>
      <p style={{ color: "#64748B", fontSize: "14px" }}>{post.user_name} · {post.created_at}</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
    </div>
  );
}
