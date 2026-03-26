import React, { useState } from "react";
import contractExtensionService from "../services/contractExtensionService";

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
  maxWidth: "550px",
  width: "90%",
  maxHeight: "90vh",
  overflow: "auto",
  padding: "2rem",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const durationOptions = [
  { value: 1, label: "1 tháng" },
  { value: 2, label: "2 tháng" },
  { value: 3, label: "3 tháng" },
  { value: 6, label: "6 tháng" },
  { value: 9, label: "9 tháng" },
  { value: 12, label: "12 tháng (1 năm)" },
  { value: 18, label: "18 tháng" },
  { value: 24, label: "24 tháng (2 năm)" },
];

const reasonTemplates = [
  { value: "", label: "-- Chọn mẫu lý do --" },
  { value: "Tiếp tục nhu cầu lưu trữ hàng hóa cho hoạt động kinh doanh", label: "Tiếp tục kinh doanh" },
  { value: "Mở rộng quy mô hoạt động, cần tiếp tục sử dụng kho", label: "Mở rộng quy mô" },
  { value: "Hài lòng với dịch vụ, muốn tiếp tục hợp tác", label: "Hài lòng dịch vụ" },
  { value: "Chưa tìm được địa điểm thay thế phù hợp", label: "Chưa có địa điểm thay thế" },
];

const ExtensionRequestModal = ({ contract, onClose, onSuccess }) => {
  const [durationMonths, setDurationMonths] = useState(3);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate new end date
  const calculateNewEndDate = () => {
    if (!contract.endDate) return null;
    const endDate = new Date(contract.endDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  };

  // Calculate additional cost
  const calculateAdditionalCost = () => {
    if (!contract.monthlyPayment) return 0;
    return contract.monthlyPayment * durationMonths;
  };

  const newEndDate = calculateNewEndDate();
  const additionalCost = calculateAdditionalCost();

  const handleTemplateChange = (e) => {
    const templateValue = e.target.value;
    if (templateValue) {
      setReason(templateValue);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do gia hạn");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await contractExtensionService.requestExtension({
        contractId: contract.contractId,
        durationMonths,
        reason,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu gia hạn");
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
            Yêu cầu gia hạn hợp đồng
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Hợp đồng: <strong>{contract.contractNumber}</strong>
          </p>
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

        {/* Duration Select */}
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
            Thời gian gia hạn <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "0.9rem",
              boxSizing: "border-box",
              backgroundColor: "#fff",
            }}
          >
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Box */}
        <div
          style={{
            backgroundColor: "#f0fdf4",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid #bbf7d0",
          }}
        >
          <div style={{ marginBottom: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#64748b", fontSize: "0.88rem" }}>Ngày kết thúc hiện tại:</span>
              <span style={{ fontWeight: 500, color: "#0f172a", fontSize: "0.9rem" }}>
                {formatDate(contract.endDate)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#64748b", fontSize: "0.88rem" }}>Ngày kết thúc mới:</span>
              <span style={{ fontWeight: 600, color: "#16a34a", fontSize: "0.9rem" }}>
                {formatDate(newEndDate)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "0.5rem",
                borderTop: "1px dashed #bbf7d0",
              }}
            >
              <span style={{ color: "#64748b", fontSize: "0.88rem" }}>Chi phí gia hạn (dự kiến):</span>
              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
                {formatCurrency(additionalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Reason Template Select */}
        <div style={{ marginBottom: "0.5rem" }}>
          <label
            style={{
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#64748b",
              marginBottom: "0.5rem",
              display: "block",
            }}
          >
            Mẫu lý do
          </label>
          <select
            onChange={handleTemplateChange}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "0.9rem",
              boxSizing: "border-box",
              backgroundColor: "#fff",
            }}
          >
            {reasonTemplates.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reason Textarea */}
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
            Lý do gia hạn <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do yêu cầu gia hạn hợp đồng..."
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
              backgroundColor: "#0095c7",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Đang gửi..." : "Gửi yêu cầu gia hạn"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionRequestModal;
