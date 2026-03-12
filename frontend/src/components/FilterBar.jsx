import React from "react";

export default function FilterBar({ filters, values, onChange, onSearch, searchPlaceholder = "Tìm kiếm..." }) {
  return (
    <div className="admin-filter-bar">
      <div className="search-input">
        <input
          className="admin-input"
          type="text"
          placeholder={searchPlaceholder}
          value={values.search || ""}
          onChange={(e) => onChange("search", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch && onSearch()}
          style={{ width: "100%" }}
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.key}
          className="admin-select"
          value={values[f.key] || ""}
          onChange={(e) => onChange(f.key, e.target.value)}
          style={{ minWidth: 140 }}
        >
          <option value="">{f.label}</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}
