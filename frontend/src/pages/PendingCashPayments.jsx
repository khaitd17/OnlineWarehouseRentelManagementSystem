import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import paymentService from "../services/paymentService";

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PendingCashPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getOwnerCashPayments();
      setPayments(data);
      setError(null);
    } catch (err) {
      console.error("Error loading pending payments:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleApprove = async (paymentId) => {
    if (!window.confirm("Xác nhận đã nhận thanh toán tiền mặt?")) {
      return;
    }

    try {
      setProcessingId(paymentId);
      await paymentService.confirmCashPayment(paymentId, true);
      alert("Đã xác nhận thanh toán thành công!");
      loadPayments(); // Reload list
    } catch (err) {
      console.error("Error confirming payment:", err);
      alert(err.response?.data?.message || "Không thể xác nhận thanh toán");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (paymentId) => {
    setRejectPaymentId(paymentId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setProcessingId(rejectPaymentId);
      await paymentService.confirmCashPayment(rejectPaymentId, false, rejectReason);
      alert("Đã từ chối thanh toán");
      setShowRejectModal(false);
      loadPayments();
    } catch (err) {
      console.error("Error rejecting payment:", err);
      alert(err.response?.data?.message || "Không thể từ chối thanh toán");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#64748b" }}>Đang tải danh sách thanh toán...</div>
      </div>
    );
  }

  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const matchPayment = (payment) => {
    if (!normalizedKeyword) return true;
    const searchable = [
      payment.paymentCode,
      payment.contract?.contractNumber,
      payment.contract?.renterName,
      payment.contract?.warehouse?.name,
      payment.amount
    ].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(normalizedKeyword);
  };

  const pendingPayments = payments.filter((p) => p.status === "PENDING_CONFIRMATION");
  const confirmedPayments = payments.filter((p) => p.status === "COMPLETED");
  const filteredPendingPayments = pendingPayments.filter(matchPayment);
  const filteredConfirmedPayments = confirmedPayments.filter(matchPayment);

  const renderCard = (payment, isPending) => (
    <div
      key={payment.paymentId}
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: "250px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{
              backgroundColor: isPending ? "#fef3c7" : "#dcfce7",
              color: isPending ? "#92400e" : "#166534",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 600
            }}>
              {isPending ? "Chờ xác nhận" : "Đã xác nhận"}
            </span>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
              {payment.paymentCode}
            </span>
          </div>

          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            {formatCurrency(payment.amount)}
          </div>

          <div style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            📝 Hợp đồng: <strong>{payment.contract?.contractNumber}</strong>
          </div>
          <div style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            👤 Khách thuê: <strong>{payment.contract?.renterName || "N/A"}</strong>
          </div>
          <div style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            🏠 Kho: <strong>{payment.contract?.warehouse?.name || "N/A"}</strong>
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            🕐 {isPending ? "Yêu cầu lúc" : "Xác nhận lúc"}: {formatDate(payment.updatedAt || payment.paidAt || payment.createdAt)}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {isPending && (
            <>
              <button
                onClick={() => handleApprove(payment.paymentId)}
                disabled={processingId === payment.paymentId}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  cursor: processingId === payment.paymentId ? "not-allowed" : "pointer",
                  opacity: processingId === payment.paymentId ? 0.6 : 1
                }}
              >
                ✓ Xác nhận đã nhận tiền
              </button>
              <button
                onClick={() => handleRejectClick(payment.paymentId)}
                disabled={processingId === payment.paymentId}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  color: "#dc2626",
                  border: "2px solid #dc2626",
                  fontWeight: 600,
                  cursor: processingId === payment.paymentId ? "not-allowed" : "pointer",
                  opacity: processingId === payment.paymentId ? 0.6 : 1
                }}
              >
                ✗ Từ chối
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/contracts/${payment.contract?.contractId}`)}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "10px",
              backgroundColor: "#f1f5f9",
              color: "#64748b",
              border: "none",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Xem hợp đồng
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          💵 Xác nhận thanh toán tiền mặt
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Hiển thị cả thanh toán đã xác nhận và chưa xác nhận
        </p>
      </div>

      {error && (
        <div style={{
          color: "#dc2626", padding: "1rem 1.5rem", backgroundColor: "#fef2f2",
          borderRadius: "12px", border: "1px solid #fecaca", marginBottom: "1rem"
        }}>
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          backgroundColor: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <div style={{ color: "#64748b", fontSize: "1.1rem" }}>
            Không có thanh toán nào cần xác nhận
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                flex: 1,
                padding: "0.9rem 1rem",
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "pending" ? "#eff6ff" : "#fff",
                color: activeTab === "pending" ? "#2563eb" : "#334155",
                fontWeight: 700
              }}
            >
              Chưa xác nhận ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab("confirmed")}
              style={{
                flex: 1,
                padding: "0.9rem 1rem",
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "confirmed" ? "#eff6ff" : "#fff",
                color: activeTab === "confirmed" ? "#2563eb" : "#334155",
                fontWeight: 700
              }}
            >
              Đã xác nhận ({confirmedPayments.length})
            </button>
          </div>

          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo mã thanh toán, mã hợp đồng, khách thuê, tên kho..."
              style={{
                width: "100%",
                maxWidth: "560px",
                padding: "0.7rem 0.9rem",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
            {activeTab === "pending" ? (
              filteredPendingPayments.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  {normalizedKeyword ? "Không tìm thấy thanh toán phù hợp." : "Không có thanh toán chờ xác nhận."}
                </div>
              ) : (
                filteredPendingPayments.map((payment) => renderCard(payment, true))
              )
            ) : (
              filteredConfirmedPayments.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  {normalizedKeyword ? "Không tìm thấy thanh toán phù hợp." : "Chưa có thanh toán nào đã xác nhận."}
                </div>
              ) : (
                filteredConfirmedPayments.map((payment) => renderCard(payment, false))
              )
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Từ chối thanh toán
            </h2>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>
              Vui lòng nhập lý do từ chối thanh toán:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Chưa nhận được tiền mặt từ khách..."
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "0.95rem",
                minHeight: "100px",
                resize: "vertical",
                marginBottom: "1rem"
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processingId}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  cursor: processingId ? "not-allowed" : "pointer",
                  opacity: processingId ? 0.6 : 1
                }}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingCashPayments;
