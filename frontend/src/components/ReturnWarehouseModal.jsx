import React, { useState } from "react";
import returnService from "../services/returnService";

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
  maxWidth: "600px",
  width: "90%",
  maxHeight: "90vh",
  overflow: "auto",
  padding: "2rem",
};

const formatCurrency = (amount) => {
  if (amount == null || amount === "") return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const checklistItems = [
  {
    key: "isClean",
    label: "Kho sạch sẽ",
    description: "Kho đã được dọn dẹp sạch sẽ, không còn rác thải",
  },
  {
    key: "isEquipmentIntact",
    label: "Thiết bị nguyên vẹn",
    description: "Các thiết bị, cơ sở vật chất trong tình trạng tốt",
  },
  {
    key: "isNoOutstandingDebt",
    label: "Không còn công nợ",
    description: "Đã thanh toán đầy đủ các khoản phí",
  },
];

const ReturnWarehouseModal = ({ contract, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Confirm initiate, 2: Inspection checklist
  const [returnRecord, setReturnRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [inspectionData, setInspectionData] = useState({
    isClean: null,
    isEquipmentIntact: null,
    isNoOutstandingDebt: null,
    notes: "",
    damageFee: "",
    penaltyFee: "",
  });

  // Step 1: Initiate return
  const handleInitiateReturn = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await returnService.initiateReturn(contract.contractId);
      setReturnRecord(result);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi khởi tạo yêu cầu trả kho");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit inspection
  const handleSubmitInspection = async () => {
    // Validate all checklist items are answered
    const unanswered = checklistItems.filter((item) => inspectionData[item.key] === null);
    if (unanswered.length > 0) {
      setError("Vui lòng đánh giá tất cả các mục trong danh sách kiểm tra");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await returnService.submitInspection(returnRecord.returnId, {
        isClean: inspectionData.isClean,
        isEquipmentIntact: inspectionData.isEquipmentIntact,
        isNoOutstandingDebt: inspectionData.isNoOutstandingDebt,
        notes: inspectionData.notes,
        damageFee: inspectionData.damageFee ? parseFloat(inspectionData.damageFee) : 0,
        penaltyFee: inspectionData.penaltyFee ? parseFloat(inspectionData.penaltyFee) : 0,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi gửi kết quả kiểm tra");
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (key, value) => {
    setInspectionData((prev) => ({ ...prev, [key]: value }));
  };

  const totalFees =
    (inspectionData.damageFee ? parseFloat(inspectionData.damageFee) : 0) +
    (inspectionData.penaltyFee ? parseFloat(inspectionData.penaltyFee) : 0);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.3rem" }}>
            {step === 1 ? "Yêu cầu trả kho" : "Kiểm tra tình trạng kho"}
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Hợp đồng: <strong>{contract.contractNumber}</strong>
            {step === 2 && <span style={{ marginLeft: "8px", color: "#0095c7" }}>• Bước 2/2</span>}
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

        {/* Step 1: Confirm initiate */}
        {step === 1 && (
          <>
            {/* Info Box */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem",
                border: "1px solid #f1f5f9",
              }}
            >
              <div style={{ marginBottom: "0.8rem" }}>
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Kho:</span>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{contract.warehouseName}</div>
              </div>
              <div>
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Địa chỉ:</span>
                <div style={{ fontWeight: 500, color: "#0f172a" }}>{contract.warehouseAddress}</div>
              </div>
            </div>

            {/* Warning */}
            <div
              style={{
                color: "#854d0e",
                backgroundColor: "#fefce8",
                border: "1px solid #fde047",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              <strong>Lưu ý:</strong> Sau khi bắt đầu quy trình trả kho, bạn cần hoàn thành kiểm tra tình trạng kho và chờ chủ kho xác nhận.
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
                onClick={handleInitiateReturn}
                disabled={loading}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Đang xử lý..." : "Bắt đầu trả kho"}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Inspection checklist */}
        {step === 2 && (
          <>
            {/* Checklist */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "0.8rem",
                  display: "block",
                }}
              >
                Danh sách kiểm tra
              </label>
              {checklistItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "10px",
                    marginBottom: "0.8rem",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ flex: 1, marginRight: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{item.description}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleChecklistChange(item.key, true)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "8px",
                        border: inspectionData[item.key] === true ? "none" : "1px solid #e2e8f0",
                        backgroundColor: inspectionData[item.key] === true ? "#16a34a" : "#fff",
                        color: inspectionData[item.key] === true ? "#fff" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Đạt
                    </button>
                    <button
                      onClick={() => handleChecklistChange(item.key, false)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: inspectionData[item.key] === false ? "none" : "1px solid #e2e8f0",
                        backgroundColor: inspectionData[item.key] === false ? "#dc2626" : "#fff",
                        color: inspectionData[item.key] === false ? "#fff" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Không đạt
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
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
                Ghi chú
              </label>
              <textarea
                value={inspectionData.notes}
                onChange={(e) => setInspectionData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Nhập ghi chú về tình trạng kho (nếu có)..."
                rows={3}
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

            {/* Fees */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Phí bồi thường (VND)
                </label>
                <input
                  type="number"
                  value={inspectionData.damageFee}
                  onChange={(e) => setInspectionData((prev) => ({ ...prev, damageFee: e.target.value }))}
                  placeholder="0"
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Phí phạt (VND)
                </label>
                <input
                  type="number"
                  value={inspectionData.penaltyFee}
                  onChange={(e) => setInspectionData((prev) => ({ ...prev, penaltyFee: e.target.value }))}
                  placeholder="0"
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Total Fees */}
            {totalFees > 0 && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  border: "1px solid #fecaca",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#dc2626", fontWeight: 600 }}>Tổng phí phát sinh:</span>
                <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "1.1rem" }}>{formatCurrency(totalFees)}</span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setStep(1)}
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
                Quay lại
              </button>
              <button
                onClick={handleSubmitInspection}
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
                {loading ? "Đang gửi..." : "Gửi kết quả kiểm tra"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReturnWarehouseModal;
