import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";

const statusColors = {
  DRAFT: { bg: "#e0f2fe", color: "#0369a1", label: "Nháp" },
  PENDING: { bg: "#fef3c7", color: "#d97706", label: "Chờ duyệt" },
  APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
};

const MyRentalRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getMyRentalRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Không thể tải danh sách yêu cầu thuê"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const handleSendRequest = async (e, requestId) => {
    e.stopPropagation(); // Prevent navigation to detail page
    
    if (!window.confirm("Bạn có chắc muốn gửi yêu cầu này đến chủ kho?")) {
      return;
    }

    try {
      await rentalService.sendRentalRequest(requestId);
      alert("Đã gửi yêu cầu thuê thành công!");
      // Refresh the list
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu"
      );
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}
        >
          Yêu cầu thuê của tôi
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.3rem" }}>
          Theo dõi trạng thái các yêu cầu thuê kho
        </p>
      </div>

      {error && (
        <div
          style={{
            color: "#dc2626",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            backgroundColor: "#fef2f2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}

      {!loading && requests.length === 0 && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "#94a3b8",
          }}
        >
          <p style={{ fontSize: "1.1rem" }}>
            Bạn chưa có yêu cầu thuê nào. Hãy xem các kho và lưu yêu cầu thuê từ trang chi tiết kho.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {requests.map((req) => {
            const status = statusColors[req.status] || {
              bg: "#f1f5f9",
              color: "#64748b",
              label: req.status,
            };
            return (
              <div
                key={req.requestId}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  padding: "1.5rem 2rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  cursor: req.status === "DRAFT" ? "default" : "pointer",
                  transition: "box-shadow 0.2s",
                }}
                onClick={() => {
                  if (req.status !== "DRAFT") {
                    navigate(`/rental-request/${req.requestId}`);
                  }
                }}
                onMouseEnter={(e) => {
                  if (req.status !== "DRAFT") {
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  }
                }}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)")}
              >
                <div style={{ flex: 1, minWidth: "250px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        color: "#0f172a",
                      }}
                    >
                      #{req.requestId} - {req.warehouseName}
                    </span>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        backgroundColor: status.bg,
                        color: status.color,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.88rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1.5rem",
                    }}
                  >
                    <span>📍 {req.warehouseAddress}</span>
                    <span>📐 {req.requestedArea} m²</span>
                    <span>📅 {formatDate(req.startDate)}</span>
                    <span>⏱ {req.durationMonths} tháng</span>
                  </div>
                  {req.notes && (
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.85rem",
                        marginTop: "0.4rem",
                      }}
                    >
                      Ghi chú: {req.notes}
                    </p>
                  )}
                  {req.status === "DRAFT" && (
                    <div style={{ marginTop: "1rem" }}>
                      <button
                        onClick={(e) => handleSendRequest(e, req.requestId)}
                        style={{
                          padding: "0.6rem 1.2rem",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "#0095c7",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                      >
                        📤 Gửi yêu cầu đến chủ kho
                      </button>
                    </div>
                  )}
                  {req.status === "APPROVED" && req.contractImageUrl && (
                    <p
                      style={{
                        color: "#16a34a",
                        fontSize: "0.88rem",
                        marginTop: "0.4rem",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Đã có hợp đồng - Click để xem chi tiết
                    </p>
                  )}
                  {req.status === "REJECTED" && req.rejectionReason && (
                    <p
                      style={{
                        color: "#dc2626",
                        fontSize: "0.85rem",
                        marginTop: "0.4rem",
                        fontStyle: "italic",
                      }}
                    >
                      Lý do từ chối: {req.rejectionReason}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    textAlign: "right",
                  }}
                >
                  <div>Ngày tạo: {formatDate(req.createdAt)}</div>
                  {req.reviewedAt && (
                    <div>Ngày duyệt: {formatDate(req.reviewedAt)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRentalRequests;
