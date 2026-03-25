import React, { useState, useEffect, useRef } from "react";
import rentalService from "../services/rentalService";
import SignatureCanvas from "../components/SignatureCanvas";

const statusColors = {
  PENDING: { bg: "#fef3c7", color: "#d97706", label: "Chờ duyệt" },
  APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
};

const formatCurrency = (amount) => {
  if (!amount) return "---";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const calculateEndDate = (startDate, durationMonths) => {
  if (!startDate || !durationMonths) return "---";
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + parseInt(durationMonths));
  return start.toLocaleDateString("vi-VN");
};

const calculateTotalValue = (monthlyPayment, durationMonths) => {
  if (!monthlyPayment || !durationMonths) return 0;
  return parseFloat(monthlyPayment) * parseInt(durationMonths);
};

const generateDefaultTerms = (req) => {
  return `1. Bên A cho Bên B thuê diện tích ${req.requestedArea} m² tại kho ${req.warehouseName}, địa chỉ: ${req.warehouseAddress}.
2. Bên B sử dụng kho đúng mục đích thuê, không chứa hàng cấm, hàng nguy hiểm, dễ cháy nổ.
3. Bên B thanh toán tiền thuê hàng tháng, chậm nhất vào ngày 05 của mỗi tháng.
4. Nếu Bên B chậm thanh toán quá 15 ngày, Bên A có quyền đơn phương chấm dứt hợp đồng.
5. Tiền đặt cọc sẽ được hoàn trả khi hết hạn hợp đồng, sau khi trừ các khoản phí phát sinh (nếu có).
6. Hai bên có thể thỏa thuận gia hạn hợp đồng trước khi hết hạn ít nhất 30 ngày.`;
};

// Reusable section component for the contract modal
const ContractSection = ({ title, children }) => (
  <div style={{ marginBottom: "1.2rem" }}>
    <h3 style={{
      fontSize: "0.95rem", fontWeight: 700, color: "#0f172a",
      marginBottom: "0.8rem", paddingBottom: "0.5rem",
      borderBottom: "1px solid #f1f5f9",
    }}>
      {title}
    </h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem 1.5rem" }}>
      {children}
    </div>
  </div>
);

// Read-only info field
const ReadOnlyField = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
      {label}
    </span>
    <span style={{
      fontSize: "0.9rem", color: "#0f172a", fontWeight: 500,
      padding: "0.5rem 0.7rem", backgroundColor: "#f8fafc",
      borderRadius: "8px", border: "1px solid #f1f5f9",
    }}>
      {value || "---"}
    </span>
  </div>
);

const PendingRentalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [actionModal, setActionModal] = useState(null);
  const [contractForm, setContractForm] = useState({
    startDate: "",
    durationMonths: "",
    monthlyPayment: "",
    depositAmount: "",
    terms: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [contractImageFile, setContractImageFile] = useState(null);
  const [contractImagePreview, setContractImagePreview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const signatureCanvasRef = useRef(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getPendingRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Không thể tải danh sách yêu cầu chờ duyệt"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const openApproveModal = (req) => {
    setActionModal({ type: "approve", request: req });
    setContractForm({
      startDate: req.startDate ? req.startDate.split("T")[0] : "",
      durationMonths: req.durationMonths || "",
      monthlyPayment: "",
      depositAmount: "",
      terms: generateDefaultTerms(req),
    });
    setContractImageFile(null);
    setContractImagePreview(null);
  };

  const openRejectModal = (req) => {
    setActionModal({ type: "reject", request: req });
    setRejectReason("");
  };

  const closeModal = () => {
    setActionModal(null);
    setContractImageFile(null);
    setContractImagePreview(null);
    setCreatedContractId(null);
    setShowSignatureStep(false);
  };

  const handleFormChange = (field, value) => {
    setContractForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setContractImageFile(file);
    if (file.type.startsWith("image/")) {
      setContractImagePreview(URL.createObjectURL(file));
    } else {
      setContractImagePreview(null);
    }
  };

  const handleApprove = async () => {
    if (!contractForm.monthlyPayment || parseFloat(contractForm.monthlyPayment) <= 0) {
      alert("Vui lòng nhập giá thuê hàng tháng hợp lệ");
      return;
    }
    setActionLoading(true);
    try {
      let contractImageUrl = null;
      if (contractImageFile) {
        const uploadResult = await rentalService.uploadContractFile(contractImageFile);
        contractImageUrl = uploadResult.url;
      }

      const payload = {
        requestId: actionModal.request.requestId,
        contractImageUrl,
        monthlyPayment: parseFloat(contractForm.monthlyPayment),
        depositAmount: contractForm.depositAmount ? parseFloat(contractForm.depositAmount) : null,
        terms: contractForm.terms.trim() || null,
        startDate: contractForm.startDate || null,
        durationMonths: contractForm.durationMonths ? parseInt(contractForm.durationMonths) : null,
      };

      const result = await rentalService.approveRentalRequest(
        actionModal.request.requestId,
        payload
      );

      // Store contract ID and show signature step
      setCreatedContractId(result.contractId);
      setShowSignatureStep(true);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || err.message || "Có lỗi khi tạo hợp đồng"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOwnerSign = async () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      alert("Vui lòng ký tên trước khi gửi hợp đồng");
      return;
    }

    try {
      setActionLoading(true);
      const signatureBase64 = signatureCanvasRef.current.toBase64();
      await rentalService.ownerSignContract(createdContractId, signatureBase64);
      alert("Đã ký và gửi hợp đồng đến người thuê thành công!");
      closeModal();
      fetchPending();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi khi ký hợp đồng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearSignature = () => {
    signatureCanvasRef.current?.clear();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    setActionLoading(true);
    try {
      await rentalService.rejectRentalRequest(
        actionModal.request.requestId,
        { requestId: actionModal.request.requestId, rejectionReason: rejectReason }
      );
      alert("Đã từ chối yêu cầu thuê!");
      closeModal();
      fetchPending();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi khi từ chối yêu cầu");
    } finally {
      setActionLoading(false);
    }
  };

  const renderApproveModal = () => {
    const req = actionModal.request;
    const totalValue = calculateTotalValue(contractForm.monthlyPayment, contractForm.durationMonths);
    const endDate = calculateEndDate(contractForm.startDate, contractForm.durationMonths);

    // If showing signature step
    if (showSignatureStep) {
      return (
        <>
          <div style={{ marginBottom: "1.2rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.3rem" }}>
              Ký hợp đồng trước khi gửi
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
              Vẽ chữ ký của bạn để hoàn tất và gửi hợp đồng đến người thuê
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "#64748b", marginBottom: "1rem", fontSize: "0.9rem" }}>
              Vẽ chữ ký của bạn trên khung bên dưới
            </p>
            <SignatureCanvas ref={signatureCanvasRef} />
          </div>

          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={handleClearSignature}
              style={{
                padding: "0.7rem 1.5rem", borderRadius: "10px",
                border: "1px solid #e2e8f0", backgroundColor: "#fff",
                color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
              }}
            >
              Xóa chữ ký
            </button>
            <button
              onClick={() => setShowSignatureStep(false)}
              disabled={actionLoading}
              style={{
                padding: "0.7rem 1.5rem", borderRadius: "10px",
                border: "1px solid #e2e8f0", backgroundColor: "#fff",
                color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
              }}
            >
              Quay lại
            </button>
            <button
              onClick={handleOwnerSign}
              disabled={actionLoading}
              style={{
                padding: "0.7rem 1.5rem", borderRadius: "10px", border: "none",
                backgroundColor: actionLoading ? "#94a3b8" : "#2563eb",
                color: "#fff", fontWeight: 600,
                cursor: actionLoading ? "not-allowed" : "pointer", fontSize: "0.9rem",
              }}
            >
              {actionLoading ? "Đang gửi..." : "Ký và gửi hợp đồng"}
            </button>
          </div>
        </>
      );
    }

    // Original form view
    return (
      <>
        <div style={{ marginBottom: "1.2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.3rem" }}>
            Hợp đồng thuê kho hàng
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
            Xem xét và chỉnh sửa nội dung hợp đồng trước khi ký và gửi đến người thuê
          </p>
        </div>

        {/* Bên cho thuê (Bên A) */}
        <ContractSection title="Bên cho thuê (Bên A)">
          <ReadOnlyField label="Họ và tên" value={req.ownerName} />
          <ReadOnlyField label="Email" value={req.ownerEmail} />
          <ReadOnlyField label="Số điện thoại" value={req.ownerPhone} />
        </ContractSection>

        {/* Bên thuê (Bên B) */}
        <ContractSection title="Bên thuê (Bên B)">
          <ReadOnlyField label="Họ và tên" value={req.renterName} />
          <ReadOnlyField label="Email" value={req.renterEmail} />
        </ContractSection>

        {/* Thông tin kho hàng */}
        <ContractSection title="Thông tin kho hàng">
          <ReadOnlyField label="Tên kho" value={req.warehouseName} />
          <ReadOnlyField label="Địa chỉ" value={req.warehouseAddress} />
          <ReadOnlyField label="Diện tích thuê" value={`${req.requestedArea} m²`} />
        </ContractSection>

        {/* Thời hạn hợp đồng */}
        <ContractSection title="Thời hạn hợp đồng">
          <div style={groupStyle}>
            <label style={modalLabelStyle}>Ngày bắt đầu *</label>
            <input
              type="date"
              value={contractForm.startDate}
              onChange={(e) => handleFormChange("startDate", e.target.value)}
              style={modalInputStyle}
            />
          </div>
          <div style={groupStyle}>
            <label style={modalLabelStyle}>Thời hạn (tháng) *</label>
            <input
              type="number"
              min="1"
              max="120"
              value={contractForm.durationMonths}
              onChange={(e) => handleFormChange("durationMonths", e.target.value)}
              style={modalInputStyle}
            />
          </div>
          <ReadOnlyField label="Ngày kết thúc (tự động)" value={endDate} />
        </ContractSection>

        {/* Giá thuê và thanh toán */}
        <ContractSection title="Giá thuê và thanh toán">
          <div style={groupStyle}>
            <label style={modalLabelStyle}>Giá thuê/tháng (VNĐ) *</label>
            <input
              type="number"
              min="0"
              value={contractForm.monthlyPayment}
              onChange={(e) => handleFormChange("monthlyPayment", e.target.value)}
              placeholder="VD: 5000000"
              style={modalInputStyle}
            />
          </div>
          <div style={groupStyle}>
            <label style={modalLabelStyle}>Tiền đặt cọc (VNĐ)</label>
            <input
              type="number"
              min="0"
              value={contractForm.depositAmount}
              onChange={(e) => handleFormChange("depositAmount", e.target.value)}
              placeholder="Không bắt buộc"
              style={modalInputStyle}
            />
          </div>
          <ReadOnlyField label="Tổng giá trị hợp đồng" value={totalValue > 0 ? formatCurrency(totalValue) : "---"} />
        </ContractSection>

        {/* Điều khoản hợp đồng */}
        <div style={{ marginBottom: "1.2rem" }}>
          <h3 style={{
            fontSize: "0.95rem", fontWeight: 700, color: "#0f172a",
            marginBottom: "0.8rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid #f1f5f9",
          }}>
            Điều khoản hợp đồng
          </h3>
          <div style={groupStyle}>
            <textarea
              rows="8"
              value={contractForm.terms}
              onChange={(e) => handleFormChange("terms", e.target.value)}
              placeholder="Nhập các điều khoản hợp đồng..."
              style={{ ...modalInputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* Tài liệu đính kèm */}
        <div style={{ marginBottom: "1.2rem" }}>
          <h3 style={{
            fontSize: "0.95rem", fontWeight: 700, color: "#0f172a",
            marginBottom: "0.8rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid #f1f5f9",
          }}>
            Tài liệu đính kèm (tùy chọn)
          </h3>
          <label style={{
            display: "flex", alignItems: "center", gap: "0.8rem",
            padding: "0.8rem", borderRadius: "10px",
            border: "2px dashed #cbd5e1", cursor: "pointer",
            backgroundColor: contractImageFile ? "#f0f9ff" : "#f8fafc",
          }}>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: "1.2rem" }}>📎</span>
            <span style={{ fontSize: "0.88rem", color: "#64748b" }}>
              {contractImageFile ? contractImageFile.name : "Chọn file (JPG, PNG, PDF — tối đa 5MB)"}
            </span>
          </label>
          {contractImagePreview && (
            <img
              src={contractImagePreview}
              alt="preview"
              style={{ marginTop: "0.5rem", maxHeight: "120px", borderRadius: "8px", objectFit: "contain", border: "1px solid #e2e8f0" }}
            />
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
          <button
            onClick={closeModal}
            disabled={actionLoading}
            style={{
              padding: "0.7rem 1.5rem", borderRadius: "10px",
              border: "1px solid #e2e8f0", backgroundColor: "#fff",
              color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            style={{
              padding: "0.7rem 1.5rem", borderRadius: "10px", border: "none",
              backgroundColor: actionLoading ? "#94a3b8" : "#2563eb",
              color: "#fff", fontWeight: 600,
              cursor: actionLoading ? "not-allowed" : "pointer", fontSize: "0.9rem",
            }}
          >
            {actionLoading ? "Đang tạo..." : "Tiếp tục → Ký hợp đồng"}
          </button>
        </div>
      </>
    );
  };

  const renderRejectModal = () => (
    <>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
        Từ chối yêu cầu #{actionModal.request.requestId}
      </h2>
      <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Nhập lý do từ chối yêu cầu thuê
      </p>
      <div style={groupStyle}>
        <label style={modalLabelStyle}>Lý do từ chối *</label>
        <textarea
          rows="4"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối"
          style={{ ...modalInputStyle, resize: "vertical" }}
        />
      </div>
      <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
        <button
          onClick={closeModal}
          disabled={actionLoading}
          style={{
            padding: "0.6rem 1.2rem", borderRadius: "10px",
            border: "1px solid #e2e8f0", backgroundColor: "#fff",
            color: "#64748b", fontWeight: 600, cursor: "pointer",
          }}
        >
          Hủy
        </button>
        <button
          onClick={handleReject}
          disabled={actionLoading}
          style={{
            padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none",
            backgroundColor: actionLoading ? "#94a3b8" : "#dc2626",
            color: "#fff", fontWeight: 600,
            cursor: actionLoading ? "not-allowed" : "pointer",
          }}
        >
          {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
          Yêu cầu thuê chờ duyệt
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.3rem" }}>
          Xem xét và gửi hợp đồng hoặc từ chối các yêu cầu thuê kho
        </p>
      </div>

      {error && (
        <div style={{
          color: "#dc2626", padding: "12px 16px", marginBottom: "1.5rem",
          backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca",
        }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}

      {!loading && requests.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          <p style={{ fontSize: "1.1rem" }}>Không có yêu cầu thuê nào chờ duyệt.</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {requests.map((req) => {
            const status = statusColors[req.status] || {
              bg: "#f1f5f9", color: "#64748b", label: req.status,
            };
            return (
              <div
                key={req.requestId}
                style={{
                  backgroundColor: "#fff", borderRadius: "16px",
                  padding: "1.5rem 2rem", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: "1rem",
                }}>
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>
                        #{req.requestId} - {req.warehouseName}
                      </span>
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px",
                        backgroundColor: status.bg, color: status.color,
                        fontSize: "0.8rem", fontWeight: 600,
                      }}>
                        {status.label}
                      </span>
                    </div>

                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem 2rem", color: "#475569", fontSize: "0.9rem", marginTop: "0.8rem",
                    }}>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Người thuê: </span>
                        {req.renterName} ({req.renterEmail})
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Địa chỉ: </span>
                        {req.warehouseAddress}
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Diện tích: </span>
                        {req.requestedArea} m²
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Thời hạn: </span>
                        {req.durationMonths} tháng
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Ngày bắt đầu: </span>
                        {formatDate(req.startDate)}
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Ngày gửi: </span>
                        {formatDate(req.createdAt)}
                      </div>
                    </div>

                    {req.notes && (
                      <p style={{
                        color: "#64748b", fontSize: "0.88rem",
                        marginTop: "0.6rem", fontStyle: "italic",
                      }}>
                        Ghi chú: {req.notes}
                      </p>
                    )}
                  </div>

                  {req.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "0.8rem", alignSelf: "center" }}>
                      <button
                        onClick={() => openApproveModal(req)}
                        style={{
                          padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none",
                          backgroundColor: "#2563eb", color: "#fff",
                          fontWeight: 600, cursor: "pointer", fontSize: "0.88rem",
                        }}
                      >
                        Gửi hợp đồng
                      </button>
                      <button
                        onClick={() => openRejectModal(req)}
                        style={{
                          padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none",
                          backgroundColor: "#dc2626", color: "#fff",
                          fontWeight: 600, cursor: "pointer", fontSize: "0.88rem",
                        }}
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Overlay */}
      {actionModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 2000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#fff", borderRadius: "20px", padding: "2rem",
              width: "90%",
              maxWidth: actionModal.type === "approve" ? "800px" : "500px",
              maxHeight: "85vh", overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {actionModal.type === "approve" ? renderApproveModal() : renderRejectModal()}
          </div>
        </div>
      )}
    </div>
  );
};

const groupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const modalLabelStyle = {
  fontSize: "0.88rem",
  fontWeight: 600,
  color: "#64748b",
};

const modalInputStyle = {
  padding: "0.8rem",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "0.9rem",
};

export default PendingRentalRequests;
