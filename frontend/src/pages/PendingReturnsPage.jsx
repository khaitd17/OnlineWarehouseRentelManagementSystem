import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import returnService from "../services/returnService";
import { useToast } from "../context/ToastContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null || amount === 0) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const statusConfig = {
  INITIATED: { bg: "#e0e7ff", color: "#6366f1", label: "Đã khởi tạo" },
  INSPECTING: { bg: "#fef3c7", color: "#d97706", label: "Đang kiểm tra" },
  PENDING_APPROVAL: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ duyệt" },
  APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
  COMPLETED: { bg: "#f1f5f9", color: "#64748b", label: "Hoàn thành" },
};

const PendingReturnsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [requiredActions, setRequiredActions] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await returnService.getPendingReturns();
      setReturns(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách yêu cầu trả kho");
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleApprove = async (returnRecord) => {
    if (!window.confirm(`Bạn có chắc muốn duyệt yêu cầu trả kho cho hợp đồng ${returnRecord.contractNumber}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await returnService.approveReturn(returnRecord.returnId);
      showToast("Đã phê duyệt yêu cầu trả kho thành công!", "success");
      fetchReturns();
    } catch (err) {
      showToast(err.response?.data?.message || "Có lỗi xảy ra khi duyệt yêu cầu", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (returnRecord) => {
    setSelectedReturn(returnRecord);
    setRejectReason("");
    setRequiredActions("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Vui lòng nhập lý do từ chối", "warning");
      return;
    }

    try {
      setActionLoading(true);
      await returnService.rejectReturn(selectedReturn.returnId, {
        reason: rejectReason,
        requiredActions: requiredActions,
      });
      showToast("Đã từ chối yêu cầu trả kho", "success");
      setShowRejectModal(false);
      fetchReturns();
    } catch (err) {
      showToast(err.response?.data?.message || "Có lỗi xảy ra khi từ chối yêu cầu", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const totalFees = (ret) => (ret.damageFee || 0) + (ret.penaltyFee || 0);

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
          Yêu cầu trả kho
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Duyệt các yêu cầu trả kho từ người thuê
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
      {returns.length === 0 && !error && (
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
            assignment_return
          </span>
          <h3 style={{ color: "#64748b", fontWeight: 600, marginBottom: "0.5rem" }}>
            Không có yêu cầu trả kho nào
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            Các yêu cầu trả kho từ người thuê sẽ hiển thị ở đây
          </p>
        </div>
      )}

      {/* Returns List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {returns.map((ret) => {
          const status = statusConfig[ret.status] || statusConfig.PENDING_APPROVAL;
          const fees = totalFees(ret);
          const hasIssues = !ret.isClean || !ret.isEquipmentIntact || !ret.isNoOutstandingDebt;

          return (
            <div
              key={ret.returnId}
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
                      onClick={() => navigate(`/contracts/${ret.contractId}`)}
                      style={{
                        fontWeight: 700,
                        color: "#0095c7",
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      {ret.contractNumber}
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
                    {hasIssues && (
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "12px",
                          backgroundColor: "#fef2f2",
                          color: "#dc2626",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        Có vấn đề
                      </span>
                    )}
                  </div>
                  <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    Yêu cầu lúc: {formatDate(ret.createdAt)}
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
                  <div style={{ fontWeight: 500, color: "#0f172a", marginTop: "4px" }}>{ret.renterName}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Kho
                  </span>
                  <div style={{ fontWeight: 500, color: "#0f172a", marginTop: "4px" }}>{ret.warehouseName}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Địa chỉ
                  </span>
                  <div style={{ fontWeight: 500, color: "#0f172a", marginTop: "4px", fontSize: "0.9rem" }}>
                    {ret.warehouseAddress}
                  </div>
                </div>
              </div>

              {/* Inspection Checklist */}
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>
                  Kết quả kiểm tra:
                </span>
                <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: ret.isClean ? "#dcfce7" : "#fee2e2",
                      color: ret.isClean ? "#16a34a" : "#dc2626",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {ret.isClean ? "check_circle" : "cancel"}
                    </span>
                    Sạch sẽ
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: ret.isEquipmentIntact ? "#dcfce7" : "#fee2e2",
                      color: ret.isEquipmentIntact ? "#16a34a" : "#dc2626",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {ret.isEquipmentIntact ? "check_circle" : "cancel"}
                    </span>
                    Thiết bị nguyên vẹn
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: ret.isNoOutstandingDebt ? "#dcfce7" : "#fee2e2",
                      color: ret.isNoOutstandingDebt ? "#16a34a" : "#dc2626",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {ret.isNoOutstandingDebt ? "check_circle" : "cancel"}
                    </span>
                    Không công nợ
                  </div>
                </div>
              </div>

              {/* Notes */}
              {ret.notes && (
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Ghi chú:</span>
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
                    {ret.notes}
                  </p>
                </div>
              )}

              {/* Fees */}
              {fees > 0 && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#fef2f2",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    border: "1px solid #fecaca",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#64748b" }}>Phí bồi thường:</span>
                    <span style={{ fontWeight: 500 }}>{formatCurrency(ret.damageFee)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#64748b" }}>Phí phạt:</span>
                    <span style={{ fontWeight: 500 }}>{formatCurrency(ret.penaltyFee)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "0.5rem",
                      borderTop: "1px dashed #fecaca",
                    }}
                  >
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>Tổng phí phát sinh:</span>
                    <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "1.1rem" }}>
                      {formatCurrency(fees)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {(ret.status === "PENDING_APPROVAL" || ret.status === "INSPECTING") && (
                <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => openRejectModal(ret)}
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
                    onClick={() => handleApprove(ret)}
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
                    Duyệt trả kho
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedReturn && (
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
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Từ chối yêu cầu trả kho
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Hợp đồng: <strong>{selectedReturn.contractNumber}</strong>
            </p>

            <div style={{ marginBottom: "1rem" }}>
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
                placeholder="Nhập lý do từ chối yêu cầu trả kho..."
                rows={3}
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
                Yêu cầu người thuê thực hiện
              </label>
              <textarea
                value={requiredActions}
                onChange={(e) => setRequiredActions(e.target.value)}
                placeholder="Ví dụ: Dọn dẹp kho, sửa chữa thiết bị hư hỏng..."
                rows={2}
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

export default PendingReturnsPage;
