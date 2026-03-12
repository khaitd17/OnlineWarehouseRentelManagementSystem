import React from "react";

const STATUS_MAP = {
  ACTIVE: "active", APPROVED: "approved", PAID: "paid", COMPLETED: "completed",
  LOCKED: "locked", REJECTED: "rejected", OVERDUE: "overdue",
  PENDING: "pending", OPEN: "open", HIDDEN: "hidden",
};

const LABEL_MAP = {
  ACTIVE: "Hoạt động", APPROVED: "Đã duyệt", PAID: "Đã thanh toán", COMPLETED: "Hoàn thành",
  LOCKED: "Bị khóa", REJECTED: "Từ chối", OVERDUE: "Quá hạn",
  PENDING: "Chờ duyệt", OPEN: "Đang mở", HIDDEN: "Đã ẩn",
};

export default function StatusBadge({ status }) {
  if (!status) return <span>—</span>;
  const upper = status.toUpperCase();
  const cls = STATUS_MAP[upper] || "pending";
  const label = LABEL_MAP[upper] || status;
  return <span className={`admin-badge admin-badge-${cls}`}>{label}</span>;
}
