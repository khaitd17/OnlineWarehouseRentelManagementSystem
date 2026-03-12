import React from "react";

export default function StatCard({ icon, value, label, color = "blue" }) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="admin-stat-value">{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}
