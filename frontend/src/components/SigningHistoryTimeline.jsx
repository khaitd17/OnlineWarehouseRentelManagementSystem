import React from "react";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const SigningHistoryTimeline = ({ history, loading, currentUserId }) => {
  if (loading) {
    return <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Đang tải lịch sử ký...</p>;
  }

  if (!history || history.length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Chưa có lịch sử ký</p>;
  }

  return (
    <div style={{ position: "relative", paddingLeft: "28px" }}>
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: "8px",
          top: "8px",
          bottom: "8px",
          width: "2px",
          backgroundColor: "#e2e8f0",
        }}
      />

      {history.map((event, index) => {
        // Determine display name: show "Bạn" if eventUserId === currentUserId
        const isCurrentUser = currentUserId && event.eventUserId && event.eventUserId === currentUserId;
        const displayName = isCurrentUser ? "Bạn" : event.userName;

        return (
          <div
            key={index}
            style={{
              position: "relative",
              marginBottom: index < history.length - 1 ? "1.5rem" : 0,
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: "-24px",
                top: "4px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: event.completed ? "#16a34a" : "#fbbf24",
                border: "3px solid #fff",
                boxShadow: "0 0 0 2px " + (event.completed ? "#dcfce7" : "#fef3c7"),
              }}
            />

            {/* Content */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "4px",
                  fontSize: "0.95rem",
                }}
              >
                {event.action}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>
                {displayName && (
                  <span style={{
                    fontWeight: isCurrentUser ? 700 : 400,
                    color: isCurrentUser ? "#0ea5e9" : "#64748b",
                  }}>
                    {displayName}
                  </span>
                )}
                {displayName && " • "}
                {formatDateTime(event.timestamp)}
              </div>
              {event.details && (
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>
                  {event.details}
                </div>
              )}
              {event.signatureUrl && (
                <img
                  src={
                    event.signatureUrl.startsWith("data:")
                      ? event.signatureUrl
                      : event.signatureUrl.startsWith("http")
                        ? event.signatureUrl
                        : `http://localhost:5276${event.signatureUrl}`
                  }
                  alt="Chữ ký"
                  style={{
                    maxHeight: "60px",
                    marginTop: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "4px",
                    backgroundColor: "#fff",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SigningHistoryTimeline;
