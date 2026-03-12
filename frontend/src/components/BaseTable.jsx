import React from "react";

export default function BaseTable({ columns, data, loading, sortBy, sortOrder, onSort, emptyText = "Không có dữ liệu." }) {
  const handleSort = (key) => {
    if (!onSort) return;
    if (sortBy === key) {
      onSort(key, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(key, "asc");
    }
  };

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : {}} onClick={() => col.sortable !== false && handleSort(col.key)}>
                {col.label}
                {col.sortable !== false && (
                  <span className={`sort-icon ${sortBy === col.key ? "active" : ""}`}>
                    {sortBy === col.key ? (sortOrder === "asc" ? " ↑" : " ↓") : " ↕"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length}><div className="admin-table-loading"><div className="spinner"></div>Đang tải...</div></td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length}><div className="admin-table-empty">{emptyText}</div></td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row.id || row.key || idx}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row[col.key], row, idx) : row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
