import React from "react";
import { Link } from "react-router-dom";
import { MOCK_POSTS_LIST } from "../data/mockData";

export default function Community() {
  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>Community</h2>
        <Link to="/community/new" style={{ padding: "10px 20px", background: "#A78BFA", color: "white", borderRadius: "12px", textDecoration: "none", fontWeight: "bold" }}>
          New Post
        </Link>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {MOCK_POSTS_LIST.map((post) => (
          <li
            key={post.id}
            style={{
              padding: "20px",
              marginBottom: "12px",
              background: "#FFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
            }}
          >
            <Link to={"/community/" + post.id} style={{ textDecoration: "none", color: "inherit" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{post.title}</h3>
              <p style={{ margin: "0 0 8px 0", color: "#64748B", fontSize: "14px" }}>{post.user_name}</p>
              <p style={{ margin: 0, fontSize: "15px" }}>{post.content}</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>{post.created_at}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
