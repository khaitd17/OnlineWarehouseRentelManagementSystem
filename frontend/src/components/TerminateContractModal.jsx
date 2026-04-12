import React, { useState } from "react";
import rentalService from "../services/rentalService";

const modalOverlayStyle = {
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
};

const modalContentStyle = {
  backgroundColor: "#fff",
  borderRadius: "16px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  maxWidth: "500px",
  width: "90%",
  maxHeight: "90vh",
  overflow: "auto",
  padding: "2rem",
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const TerminateContractModal = ({ contract, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do kết thúc sớm");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await rentalService.terminateContractEarly(
        contract.contractId,
        reason
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi kết thúc hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.3rem" }}>
            Kết thúc hợp đồng sớm
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Hợp đồng: <strong>{contract.contractNumber}</strong>
          </p>
        </div>

        {/* Warning */}
        <div
          style={{
            color: "#854d0e",
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          <strong>⚠️ Cảnh báo:</strong> Việc kết thúc hợp đồng sớm có thể phát sinh phí phạt theo điều khoản hợp đồng.
        </div>

        {/* Contract Info */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "10px",
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", fontSize: "0.9rem" }}>
            <div>
              <span style={{ color: "#94a3b8" }}>Kho:</span>
              <div style={{ fontWeight: 500, color: "#0f172a" }}>{contract.warehouseName}</div>
            </div>
            <div>
              <span style={{ color: "#94a3b8" }}>Giá thuê/tháng:</span>
              <div style={{ fontWeight: 500, color: "#0f172a" }}>{formatCurrency(contract.monthlyPayment)}</div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div
            style={{
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
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
            Lý do kết thúc sớm <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do kết thúc hợp đồng sớm..."
            rows={4}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "0.9rem",
              boxSizing: "border-box",
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.7rem 1.5rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              color: "#64748b",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "0.7rem 1.5rem",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#dc2626",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Đang xử lý..." : "Xác nhận kết thúc"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminateContractModal;
