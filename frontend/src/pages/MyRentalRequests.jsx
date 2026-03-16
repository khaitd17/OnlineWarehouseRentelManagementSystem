import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";

const statusConfig = {
  DRAFT:     { bg: "#e0f2fe", color: "#0369a1", label: "Nháp" },
  PENDING:   { bg: "#fef3c7", color: "#d97706", label: "Chờ duyệt" },
  APPROVED:  { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED:  { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const MyRentalRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getMyRentalRequests();
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách yêu cầu thuê");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e, requestId) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn gửi yêu cầu này đến chủ kho?")) return;
    try {
      await rentalService.sendRentalRequest(requestId);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu");
    }
  };

  const handleCancel = async (e, requestId) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn hủy yêu cầu này?")) return;
    try {
      await rentalService.cancelRentalRequest(requestId);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi hủy yêu cầu");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>Yêu cầu thuê của tôi</h1>
        <p style={{ color: "#64748b", marginTop: "0.3rem" }}>Theo dõi trạng thái các yêu cầu thuê kho</p>
      </div>

      {error && (
        <div style={{ color: "#dc2626", padding: "12px 16px", marginBottom: "1.5rem",
          backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}

      {!loading && requests.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          <p style={{ fontSize: "1.1rem" }}>Bạn chưa có yêu cầu thuê nào.</p>
          <button
            onClick={() => navigate("/search")}
            style={{ marginTop: "1rem", padding: "0.7rem 1.5rem", borderRadius: "10px",
              backgroundColor: "#0095c7", color: "#fff", border: "none",
              fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}>
            Tìm kho ngay
          </button>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {requests.map((req) => {
            const s = statusConfig[req.status] || { bg: "#f1f5f9", color: "#64748b", label: req.status };
            return (
              <div
                key={req.requestId}
                onClick={() => navigate(`/rental-request/${req.requestId}`)}
                style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9",
                  cursor: "pointer", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>
                      #{req.requestId} — {req.warehouseName}
                    </span>
                    <span style={{ padding: "4px 12px", borderRadius: "20px",
                      backgroundColor: s.bg, color: s.color, fontSize: "0.8rem", fontWeight: 600 }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem", textAlign: "right" }}>
                    <div>Tạo: {formatDate(req.createdAt)}</div>
                    {req.reviewedAt && <div>Duyệt: {formatDate(req.reviewedAt)}</div>}
                  </div>
                </div>

                {/* Info row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem", color: "#475569", fontSize: "0.88rem", marginBottom: "0.8rem" }}>
                  <span>📍 {req.warehouseAddress}</span>
                  <span>📐 {req.requestedArea} m²</span>
                  <span>📅 Bắt đầu: {formatDate(req.startDate)}</span>
                  <span>⏱ {req.durationMonths} tháng</span>
                </div>

                {req.notes && (
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.8rem" }}>
                    Ghi chú: {req.notes}
                  </p>
                )}

                {/* ── Status banners ── */}

                {/* APPROVED */}
                {req.status === "APPROVED" && (
                  <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: "10px", padding: "0.8rem 1rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
                    <div style={{ color: "#15803d", fontSize: "0.9rem", fontWeight: 600 }}>
                      ✅ Chủ kho đã gửi đề xuất! Hợp đồng đã được tạo — chờ bạn ký.
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate("/my-contracts"); }}
                      style={{ padding: "0.45rem 1rem", borderRadius: "8px", border: "none",
                        backgroundColor: "#16a34a", color: "#fff",
                        fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      Xem & ký hợp đồng →
                    </button>
                  </div>
                )}

                {/* REJECTED */}
                {req.status === "REJECTED" && (
                  <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: "10px", padding: "0.8rem 1rem" }}>
                    <div style={{ color: "#b91c1c", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                      ❌ Yêu cầu bị từ chối
                    </div>
                    {req.rejectionReason && (
                      <div style={{ color: "#dc2626", fontSize: "0.85rem" }}>
                        Lý do: {req.rejectionReason}
                      </div>
                    )}
                  </div>
                )}

                {/* PENDING */}
                {req.status === "PENDING" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
                    <span style={{ color: "#92400e", fontSize: "0.85rem" }}>
                      ⏳ Đang chờ chủ kho xem xét...
                    </span>
                    <button
                      onClick={(e) => handleCancel(e, req.requestId)}
                      style={{ padding: "0.4rem 0.9rem", borderRadius: "8px",
                        border: "1px solid #fecaca", backgroundColor: "#fff",
                        color: "#dc2626", fontWeight: 600, cursor: "pointer", fontSize: "0.82rem" }}>
                      Hủy yêu cầu
                    </button>
                  </div>
                )}

                {/* DRAFT */}
                {req.status === "DRAFT" && (
                  <button
                    onClick={(e) => handleSend(e, req.requestId)}
                    style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", border: "none",
                      backgroundColor: "#0095c7", color: "#fff",
                      fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}>
                    📤 Gửi đến chủ kho
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRentalRequests;
