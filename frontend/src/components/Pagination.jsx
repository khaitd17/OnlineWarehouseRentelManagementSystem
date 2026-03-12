import React from "react";

export default function Pagination({ page, pageSize, totalCount, totalPages, onPageChange }) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  const getPages = () => {
    const pages = [];
    const maxShow = 5;
    let startP = Math.max(1, page - Math.floor(maxShow / 2));
    let endP = Math.min(totalPages, startP + maxShow - 1);
    if (endP - startP < maxShow - 1) startP = Math.max(1, endP - maxShow + 1);
    for (let i = startP; i <= endP; i++) pages.push(i);
    return pages;
  };

  if (totalCount === 0) return null;

  return (
    <div className="admin-pagination">
      <span>Hiển thị {start}–{end} / {totalCount} kết quả</span>
      <div className="admin-pagination-controls">
        <button className="admin-pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
        {getPages().map((p) => (
          <button key={p} className={`admin-pagination-btn ${p === page ? "active" : ""}`} onClick={() => onPageChange(p)}>{p}</button>
        ))}
        <button className="admin-pagination-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>›</button>
      </div>
    </div>
  );
}
