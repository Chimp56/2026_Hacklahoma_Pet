import React from "react";
import { Link } from "react-router-dom";
import { MOCK_EVENTS } from "../data/mockData";

export default function Calendar() {
  return (
    <div className="page">
      <h2>Calendar</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {MOCK_EVENTS.map((ev) => (
          <li
            key={ev.id}
            style={{
              padding: "16px",
              marginBottom: "8px",
              background: "#F5F3FF",
              borderRadius: "12px",
              borderLeft: "4px solid #A78BFA",
            }}
          >
            <strong>{ev.date}</strong> – {ev.pet}: {ev.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
