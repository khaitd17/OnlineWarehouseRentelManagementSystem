import React, { useState, useEffect, useRef } from "react";
import rentalService from "../services/rentalService";
import warehouseService from "../services/warehouseService";
import SignatureCanvas from "../components/SignatureCanvas";

const statusColors = {
  PENDING: { bg: "#fef3c7", color: "#d97706", label: "Chờ duyệt" },
  APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
  EXPIRED: { bg: "#fef3c7", color: "#b45309", label: "Hết hạn" },
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

// Icon helper
const Icon = ({ name, size = 16, color = "currentColor" }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, color, verticalAlign: "middle", lineHeight: 1 }}>{name}</span>
);

// Reusable section card for the contract modal
const ContractSection = ({ title, icon, accent = "#3b82f6", children }) => (
  <div style={{
    marginBottom: "1rem",
    borderRadius: "14px",
    border: "1px solid #e8edf3",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
  }}>
    <div style={{
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.7rem 1rem",
      background: `linear-gradient(135deg, ${accent}14 0%, ${accent}08 100%)`,
      borderBottom: `2px solid ${accent}22`,
    }}>
      {icon && <Icon name={icon} size={17} color={accent} />}
      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: accent, letterSpacing: "0.01em" }}>{title}</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", padding: "0.9rem 1rem", backgroundColor: "#fff" }}>
      {children}
    </div>
  </div>
);

// Read-only info field
const ReadOnlyField = ({ label, value, fullWidth }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "3px", ...(fullWidth ? { gridColumn: "1 / -1" } : {}) }}>
    <span style={{ fontSize: "0.73rem", color: "#8898aa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
    <span style={{
      fontSize: "0.88rem", color: "#1e293b", fontWeight: 500,
      padding: "0.45rem 0.75rem",
      backgroundColor: "#f7f9fc",
      borderRadius: "8px",
      border: "1px solid #e8edf3",
      minHeight: "34px",
      display: "flex", alignItems: "center",
    }}>
      {value || <span style={{ color: "#c0c9d4" }}>---</span>}
    </span>
  </div>
);

const PendingRentalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING"); // "PENDING" or "APPROVED"

  // Modal state
  const [actionModal, setActionModal] = useState(null);
  const [contractForm, setContractForm] = useState({
    startDate: "",
    durationMonths: "",
    monthlyPayment: "",
    depositAmount: "",
    terms: "",
    pricePerM2: "", // Thêm field để lưu giá/m2
  });
  const [rejectReason, setRejectReason] = useState("");
  const [contractImageFile, setContractImageFile] = useState(null);
  const [contractImagePreview, setContractImagePreview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const signatureCanvasRef = useRef(null);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getOwnerRequests(activeTab);
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Không thể tải danh sách yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const openApproveModal = async (req) => {
    try {
      // Fetch warehouse details để lấy PricePerM2
      const warehouse = await warehouseService.getWarehouseById(req.warehouseId);
      const pricePerM2 = warehouse.pricePerM2 || 0;
      const calculatedMonthlyPayment = req.requestedArea * pricePerM2;

      setActionModal({ type: "approve", request: req });
      setContractForm({
        startDate: req.startDate ? req.startDate.split("T")[0] : "",
        durationMonths: req.durationMonths || "",
        monthlyPayment: calculatedMonthlyPayment.toFixed(0), // Tự động tính giá
        depositAmount: "",
        terms: generateDefaultTerms(req),
        pricePerM2: pricePerM2, // Lưu giá/m2 để hiển thị
      });
      setContractImageFile(null);
      setContractImagePreview(null);
    } catch (err) {
      console.error("Error fetching warehouse:", err);
      alert("Không thể tải thông tin kho. Vui lòng thử lại.");
    }
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
    if (!contractForm.startDate) {
      alert("Vui lòng chọn ngày bắt đầu hợp đồng");
      return;
    }
    if (!contractForm.durationMonths || parseInt(contractForm.durationMonths) < 1 || parseInt(contractForm.durationMonths) > 120) {
      alert("Vui lòng nhập thời hạn hợp đồng từ 1-120 tháng");
      return;
    }
    
    // Validate Tiền đặt cọc
    const deposit = parseFloat(contractForm.depositAmount);
    const totalContractValue = calculateTotalValue(contractForm.monthlyPayment, contractForm.durationMonths);
    if (contractForm.depositAmount !== "" && (isNaN(deposit) || deposit < 0)) {
        alert("Tiền đặt cọc không được nhỏ hơn 0.");
        return;
    }
    if (deposit > totalContractValue) {
        alert("Tiền đặt cọc không được vượt quá tổng giá trị hợp đồng.");
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
        depositAmount: contractForm.depositAmount ? parseFloat(contractForm.depositAmount) : 0,
        terms: contractForm.terms.trim() || null,
        startDate: contractForm.startDate,
        durationMonths: parseInt(contractForm.durationMonths),
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
      fetchRequests(); // Reload list after signing
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
      fetchRequests(); // Reload list after rejecting
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
        {/* ── Modal Header ── */}
        <div style={{
          margin: "-2rem -2rem 1.2rem -2rem",
          padding: "1.5rem 2rem 1.2rem",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0c4a8f 100%)",
          borderRadius: "20px 20px 0 0",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "absolute", top: 10, right: 40, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="description" size={20} color="#93c5fd" />
            </div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
              Hợp đồng thuê kho hàng
            </h2>
          </div>
          <p style={{ margin: 0, color: "rgba(148,163,184,0.9)", fontSize: "0.82rem", paddingLeft: "3rem" }}>
            Xem xét và chỉnh sửa trước khi ký và gửi đến người thuê
          </p>
          {/* Close button */}
          <button onClick={closeModal} style={{
            position: "absolute", top: 14, right: 16,
            background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: 8, width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8",
            fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>

        {/* ── Two-party info side by side ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
          <ContractSection title="Bên A — Cho thuê" icon="business" accent="#2563eb">
            <ReadOnlyField label="Họ và tên" value={req.ownerName} />
            <ReadOnlyField label="Email" value={req.ownerEmail} />
            <ReadOnlyField label="Số điện thoại" value={req.ownerPhone} fullWidth />
          </ContractSection>
          <ContractSection title="Bên B — Người thuê" icon="person" accent="#7c3aed">
            <ReadOnlyField label="Họ và tên" value={req.renterName} />
            <ReadOnlyField label="Email" value={req.renterEmail} />
          </ContractSection>
        </div>

        {/* ── Warehouse info ── */}
        <ContractSection title="Thông tin kho hàng" icon="warehouse" accent="#0891b2">
          <ReadOnlyField label="Tên kho" value={req.warehouseName} />
          <ReadOnlyField label="Diện tích thuê" value={`${req.requestedArea} m²`} />
          <ReadOnlyField label="Địa chỉ" value={req.warehouseAddress} fullWidth />
        </ContractSection>

        {/* ── Contract duration ── */}
        <ContractSection title="Thời hạn hợp đồng" icon="calendar_month" accent="#059669">
          <div style={groupStyle}>
            <label style={{ ...modalLabelStyle, fontSize: "0.73rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ngày bắt đầu *</label>
            <input
              type="date"
              value={contractForm.startDate}
              onChange={(e) => handleFormChange("startDate", e.target.value)}
              style={modalInputStyle}
            />
          </div>
          <div style={groupStyle}>
            <label style={{ ...modalLabelStyle, fontSize: "0.73rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Thời hạn (tháng) *</label>
            <input
              type="number"
              min="1"
              max="120"
              value={contractForm.durationMonths}
              onChange={(e) => handleFormChange("durationMonths", e.target.value)}
              style={modalInputStyle}
            />
          </div>
          <ReadOnlyField label="Ngày kết thúc (tự động)" value={endDate} fullWidth />
        </ContractSection>

        {/* ── Pricing ── */}
        <ContractSection title="Giá thuê và thanh toán" icon="payments" accent="#d97706">
          <ReadOnlyField label="Giá/m² (VNĐ)" value={formatCurrency(contractForm.pricePerM2)} />
          <ReadOnlyField label="Diện tích thuê" value={`${req.requestedArea} m²`} />
          <ReadOnlyField
            label={`Giá thuê/tháng (${req.requestedArea}m² × ${formatCurrency(contractForm.pricePerM2)})`}
            value={formatCurrency(contractForm.monthlyPayment)}
            fullWidth
          />
          <div style={groupStyle}>
            <label style={{ ...modalLabelStyle, fontSize: "0.73rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tiền đặt cọc (VNĐ)</label>
            <input
              type="text"
              value={contractForm.depositAmount ? new Intl.NumberFormat('vi-VN').format(contractForm.depositAmount) : ""}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                handleFormChange("depositAmount", rawValue);
              }}
              placeholder="Không bắt buộc"
              style={modalInputStyle}
            />
          </div>
          <ReadOnlyField label="Tổng giá trị hợp đồng" value={totalValue > 0 ? formatCurrency(totalValue) : "---"} />
        </ContractSection>

        {/* ── Terms ── */}
        <div style={{
          marginBottom: "0.8rem",
          borderRadius: "14px",
          border: "1px solid #e8edf3",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.7rem 1rem",
            background: "linear-gradient(135deg, #64748b14 0%, #64748b08 100%)",
            borderBottom: "2px solid #64748b22",
          }}>
            <Icon name="gavel" size={17} color="#64748b" />
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#64748b" }}>Điều khoản hợp đồng</span>
          </div>
          <div style={{ padding: "0.9rem 1rem", backgroundColor: "#fff" }}>
            <textarea
              rows="6"
              value={contractForm.terms}
              onChange={(e) => handleFormChange("terms", e.target.value)}
              placeholder="Nhập các điều khoản hợp đồng..."
              style={{ ...modalInputStyle, width: "100%", resize: "vertical", lineHeight: 1.65, fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* ── Attachment ── */}
        <div style={{
          marginBottom: "1rem",
          borderRadius: "14px",
          border: "1px solid #e8edf3",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.7rem 1rem",
            background: "linear-gradient(135deg, #06b6d414 0%, #06b6d408 100%)",
            borderBottom: "2px solid #06b6d422",
          }}>
            <Icon name="attach_file" size={17} color="#0891b2" />
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0891b2" }}>Tài liệu đính kèm <span style={{ fontWeight: 400, color: "#94a3b8" }}>(tùy chọn)</span></span>
          </div>
          <div style={{ padding: "0.9rem 1rem", backgroundColor: "#fff" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: "0.8rem",
              padding: "0.75rem 1rem", borderRadius: "10px",
              border: `2px dashed ${contractImageFile ? "#0891b2" : "#cbd5e1"}`,
              cursor: "pointer",
              backgroundColor: contractImageFile ? "#f0f9ff" : "#f8fafc",
              transition: "all 0.2s",
            }}>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleImageSelect} style={{ display: "none" }} />
              <Icon name="upload_file" size={20} color={contractImageFile ? "#0891b2" : "#94a3b8"} />
              <span style={{ fontSize: "0.85rem", color: contractImageFile ? "#0891b2" : "#94a3b8", fontWeight: 500 }}>
                {contractImageFile ? contractImageFile.name : "Chọn file đính kèm (JPG, PNG, PDF — tối đa 5MB)"}
              </span>
            </label>
            {contractImagePreview && (
              <img src={contractImagePreview} alt="preview" style={{ marginTop: "0.6rem", maxHeight: "100px", borderRadius: "8px", objectFit: "contain", border: "1px solid #e2e8f0" }} />
            )}
          </div>
        </div>

        {/* ── Footer Buttons ── */}
        <div style={{
          display: "flex", gap: "0.75rem", justifyContent: "flex-end",
          marginTop: "1rem", paddingTop: "1rem",
          borderTop: "1px solid #f1f5f9"
        }}>
          <button
            onClick={closeModal}
            disabled={actionLoading}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.65rem 1.4rem", borderRadius: "10px",
              border: "1.5px solid #e2e8f0", backgroundColor: "#fff",
              color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem",
              transition: "all 0.15s",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem 1.6rem", borderRadius: "10px", border: "none",
              background: actionLoading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff", fontWeight: 700,
              cursor: actionLoading ? "not-allowed" : "pointer", fontSize: "0.88rem",
              boxShadow: actionLoading ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
              transition: "all 0.15s",
            }}
          >
            {actionLoading ? "Đang tạo..." : (<><Icon name="draw" size={16} color="#fff" />Tiếp tục — Ký hợp đồng</>)}
          </button>
        </div>
      </>
    );
  };

  const renderRejectModal = () => (
    <>
      {/* Reject header */}
      <div style={{
        margin: "-2rem -2rem 1.5rem -2rem",
        padding: "1.4rem 2rem 1.2rem",
        background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
        borderRadius: "20px 20px 0 0",
        position: "relative",
      }}>
        <button onClick={closeModal} style={{
          position: "absolute", top: 14, right: 16,
          background: "rgba(255,255,255,0.1)", border: "none",
          borderRadius: 8, width: 30, height: 30, cursor: "pointer",
          color: "rgba(255,255,255,0.7)", fontSize: 18, lineHeight: 1,
        }}>×</button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="cancel" size={20} color="#fca5a5" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#fff" }}>
              Từ chối yêu cầu #{actionModal.request.requestId}
            </h2>
            <p style={{ margin: 0, color: "rgba(252,165,165,0.85)", fontSize: "0.8rem" }}>Nhập lý do để người thuê được biết</p>
          </div>
        </div>
      </div>

      <div style={groupStyle}>
        <label style={{ ...modalLabelStyle, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>Lý do từ chối *</label>
        <textarea
          rows="5"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Vui lòng nêu rõ lý do để người thuê hiểu..."
          style={{ ...modalInputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
        />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
        <button
          onClick={closeModal}
          disabled={actionLoading}
          style={{
            padding: "0.65rem 1.3rem", borderRadius: "10px",
            border: "1.5px solid #e2e8f0", backgroundColor: "#fff",
            color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem",
          }}
        >
          Hủy
        </button>
        <button
          onClick={handleReject}
          disabled={actionLoading}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.65rem 1.4rem", borderRadius: "10px", border: "none",
            background: actionLoading ? "#94a3b8" : "linear-gradient(135deg, #dc2626, #b91c1c)",
            color: "#fff", fontWeight: 700,
            cursor: actionLoading ? "not-allowed" : "pointer", fontSize: "0.88rem",
            boxShadow: actionLoading ? "none" : "0 4px 14px rgba(220,38,38,0.35)",
          }}
        >
          {actionLoading ? "Đang xử lý..." : (<><Icon name="block" size={15} color="#fff" />Xác nhận từ chối</>)}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
          Yêu cầu thuê kho
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.3rem" }}>
          Xem xét và gửi hợp đồng hoặc từ chối các yêu cầu thuê kho
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem", borderBottom: "2px solid #f1f5f9" }}>
        <button
          onClick={() => setActiveTab("PENDING")}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            border: "none",
            background: "none",
            color: activeTab === "PENDING" ? "#0095c7" : "#64748b",
            borderBottom: activeTab === "PENDING" ? "3px solid #0095c7" : "none",
            marginBottom: activeTab === "PENDING" ? "-2px" : "0",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Chờ duyệt
        </button>
        <button
          onClick={() => setActiveTab("APPROVED")}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            border: "none",
            background: "none",
            color: activeTab === "APPROVED" ? "#0095c7" : "#64748b",
            borderBottom: activeTab === "APPROVED" ? "3px solid #0095c7" : "none",
            marginBottom: activeTab === "APPROVED" ? "-2px" : "0",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Đã duyệt
        </button>
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
            backgroundColor: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 2000,
            padding: "1rem",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "20px",
              padding: "2rem",
              width: "100%",
              maxWidth: actionModal.type === "approve" ? "820px" : "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 32px 80px rgba(15,23,42,0.3), 0 0 0 1px rgba(255,255,255,0.08)",
              animation: "modalSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalSlideIn {
                from { opacity: 0; transform: scale(0.94) translateY(12px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
              }
              .contract-section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
            `}</style>
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
