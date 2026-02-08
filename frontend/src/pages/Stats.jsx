import React from "react";

const MOCK_HEIGHTS = [50, 80, 40, 95, 70, 60, 85];

export default function Stats() {
  return (
    <div className="page">
      <h2>Activity Stats</h2>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "200px", marginBottom: "24px" }}>
        {MOCK_HEIGHTS.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: "#A78BFA",
              height: `${h}%`,
              minHeight: "20px",
              borderRadius: "8px",
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    </div>
  );
}
