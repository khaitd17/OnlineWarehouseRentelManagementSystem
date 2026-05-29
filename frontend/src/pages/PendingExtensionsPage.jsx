import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import contractExtensionService from "../services/contractExtensionService";
import { useToast } from "../context/ToastContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const statusConfig = {
  PENDING: { bg: "#fef3c7", color: "#d97706", label: "Chờ duyệt" },
  APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
  EXPIRED: { bg: "#fef3c7", color: "#d97706", label: "Hết hạn" },
};

const PendingExtensionsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractExtensionService.getPendingExtensions();
      setExtensions(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách yêu cầu gia hạn");
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const handleApprove = async (extension) => {
    if (!window.confirm(`Bạn có chắc muốn duyệt yêu cầu gia hạn hợp đồng ${extension.contractNumber}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await contractExtensionService.approveExtension(extension.extensionId);
      showToast("Đã phê duyệt yêu cầu gia hạn thành công!", "success");
      fetchExtensions();
    } catch (err) {
      showToast(err.response?.data?.message || "Có lỗi xảy ra khi duyệt yêu cầu", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (extension) => {
    setSelectedExtension(extension);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Vui lòng nhập lý do từ chối", "warning");
      return;
    }

    try {
      setActionLoading(true);
      await contractExtensionService.rejectExtension(selectedExtension.extensionId, {
        reason: rejectReason,
      });
      showToast("Đã từ chối yêu cầu gia hạn", "success");
      setShowRejectModal(false);
      fetchExtensions();
    } catch (err) {
      showToast(err.response?.data?.message || "Có lỗi xảy ra khi từ chối yêu cầu", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate new end date and cost
  const calculateNewEndDate = (currentEndDate, durationMonths) => {
    if (!currentEndDate) return null;
    const endDate = new Date(currentEndDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: "#64748b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="spinner" style={{ width: "20px", height: "20px" }}></div>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          Yêu cầu gia hạn hợp đồng
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Duyệt các yêu cầu gia hạn hợp đồng từ người thuê kho
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            color: "#dc2626",
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {extensions.length === 0 && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            backgroundColor: "#fff",
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "64px", color: "#cbd5e1", marginBottom: "1rem", display: "block" }}
          >
            event_repeat
          </span>
          <h3 style={{ color: "#64748b", fontWeight: 600, marginBottom: "0.5rem" }}>
            Không có yêu cầu gia hạn nào
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            Các yêu cầu gia hạn từ người thuê sẽ hiển thị ở đây
          </p>
        </div>
      )}

      {/* Extensions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {extensions.map((ext) => {
          const status = statusConfig[ext.status] || statusConfig.PENDING;
          const newEndDate = calculateNewEndDate(ext.currentEndDate, ext.durationMonths);
          const additionalCost = (ext.monthlyPayment || 0) * ext.durationMonths;

          return (
            <div
              key={ext.extensionId}
              style={{
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                border: "1px solid #f1f5f9",
              }}
            >
              {/* Header Row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
                    <span
                      onClick={() => navigate(`/contracts/${ext.contractId}`)}
                      style={{
                        fontWeight: 700,
                        color: "#0095c7",
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      {ext.contractNumber}
                    </span>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        backgroundColor: status.bg,
                        color: status.color,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    Yêu cầu lúc: {formatDate(ext.createdAt)}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1rem",
                  padding: "1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Người thuê
                  </span>
                  <div style={{ fontWeight: 500, color: "#0f172a", marginTop: "4px" }}>{ext.renterName}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Kho
                  </span>
                  <div style={{ fontWeight: 500, color: "#0f172a", marginTop: "4px" }}>{ext.warehouseName}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Thời gian gia hạn
                  </span>
                  <div style={{ fontWeight: 600, color: "#2563eb", marginTop: "4px" }}>{ext.durationMonths} tháng</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Chi phí dự kiến
                  </span>
                  <div style={{ fontWeight: 600, color: "#0f172a", marginTop: "4px" }}>{formatCurrency(additionalCost)}</div>
                </div>
              </div>

              {/* Date Summary */}
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  padding: "0.8rem 1rem",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Ngày kết thúc hiện tại:</span>
                  <span style={{ fontWeight: 500, marginLeft: "8px" }}>{formatDate(ext.currentEndDate)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Ngày kết thúc mới:</span>
                  <span style={{ fontWeight: 600, color: "#16a34a", marginLeft: "8px" }}>{formatDate(newEndDate)}</span>
                </div>
              </div>

              {/* Reason */}
              {ext.reason && (
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Lý do gia hạn:</span>
                  <p
                    style={{
                      color: "#475569",
                      fontSize: "0.9rem",
                      marginTop: "0.3rem",
                      padding: "0.8rem",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      borderLeft: "3px solid #0095c7",
                    }}
                  >
                    {ext.reason}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {ext.status === "PENDING" && (
                <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => openRejectModal(ext)}
                    disabled={actionLoading}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "8px",
                      border: "1px solid #dc2626",
                      backgroundColor: "#fff",
                      color: "#dc2626",
                      fontWeight: 600,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      fontSize: "0.88rem",
                    }}
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(ext)}
                    disabled={actionLoading}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      fontSize: "0.88rem",
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    Duyệt yêu cầu
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedExtension && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "450px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Từ chối yêu cầu gia hạn
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Hợp đồng: <strong>{selectedExtension.contractNumber}</strong>
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                Lý do từ chối <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối yêu cầu gia hạn..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  color: "#64748b",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingExtensionsPage;
