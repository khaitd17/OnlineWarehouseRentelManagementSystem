import React from "react";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getActionIcon = (action) => {
  const actionLower = (action || "").toLowerCase();
  if (actionLower.includes("create") || actionLower.includes("tạo")) return "add_circle";
  if (actionLower.includes("sign") || actionLower.includes("ký")) return "draw";
  if (actionLower.includes("approve") || actionLower.includes("duyệt")) return "check_circle";
  if (actionLower.includes("reject") || actionLower.includes("từ chối")) return "cancel";
  if (actionLower.includes("payment") || actionLower.includes("thanh toán")) return "payments";
  if (actionLower.includes("active") || actionLower.includes("kích hoạt")) return "verified";
  if (actionLower.includes("terminate") || actionLower.includes("chấm dứt")) return "block";
  if (actionLower.includes("extend") || actionLower.includes("gia hạn")) return "event_repeat";
  if (actionLower.includes("return") || actionLower.includes("trả")) return "assignment_return";
  return "info";
};

const getActionColor = (action) => {
  const actionLower = (action || "").toLowerCase();
  if (actionLower.includes("approve") || actionLower.includes("duyệt") || actionLower.includes("active")) return "#16a34a";
  if (actionLower.includes("reject") || actionLower.includes("từ chối") || actionLower.includes("terminate")) return "#dc2626";
  if (actionLower.includes("payment") || actionLower.includes("thanh toán")) return "#2563eb";
  return "#64748b";
};

const AuditLogList = ({ logs, loading }) => {
  if (loading) {
    return <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Đang tải nhật ký...</p>;
  }

  if (!logs || logs.length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Chưa có nhật ký hoạt động</p>;
  }

  return (
    <div style={{ maxHeight: "350px", overflowY: "auto" }}>
      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            padding: "12px 0",
            borderBottom: index < logs.length - 1 ? "1px solid #f1f5f9" : "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          {/* Icon */}
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "20px",
              color: getActionColor(log.action),
              marginTop: "2px",
            }}
          >
            {getActionIcon(log.action)}
          </span>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "4px",
                gap: "8px",
              }}
            >
              <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>
                {log.action}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                {formatDateTime(log.timestamp || log.createdAt)}
              </span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              {log.userName && <span style={{ fontWeight: 500 }}>{log.userName}</span>}
              {log.userName && log.details && " - "}
              {log.details && <span>{log.details}</span>}
            </div>
            {log.oldValue && log.newValue && (
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
                <span style={{ textDecoration: "line-through" }}>{log.oldValue}</span>
                {" → "}
                <span style={{ color: "#16a34a" }}>{log.newValue}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditLogList;
