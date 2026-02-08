import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="page">
      <h2>Account Settings</h2>
      <p>Profile, pet info, logout.</p>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          marginTop: "16px",
          padding: "10px 20px",
          background: "none",
          color: "#EF4444",
          border: "1px solid #EF4444",
          borderRadius: "12px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}
