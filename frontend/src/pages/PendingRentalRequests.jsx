import React, { useState, useEffect } from "react";
import rentalService from "../services/rentalService";
import warehouseService from "../services/warehouseService";
import contractTemplateService from "../services/contractTemplateService";
import ProposedZonePreviewModal from "../components/warehouse/ProposedZonePreviewModal";
import CustomAreaSelectorModal from "../components/warehouse/CustomAreaSelectorModal";
import axiosClient from "../services/axiosClient";

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

const applyTemplateVariables = (content, req) => {
  if (!content) return "";
  const replacementMap = {
    "{requestedArea}": `${req.requestedArea ?? ""}`,
    "{warehouseName}": req.warehouseName ?? "",
    "{warehouseAddress}": req.warehouseAddress ?? "",
    "{renterName}": req.renterName ?? "",
    "{durationMonths}": `${req.durationMonths ?? ""}`,
    "[Diện tích thuê]": `${req.requestedArea ?? ""}`,
    "[Tên kho]": req.warehouseName ?? "",
    "[Địa chỉ kho]": req.warehouseAddress ?? "",
    "[Người thuê]": req.renterName ?? "",
    "[Thời hạn]": `${req.durationMonths ?? ""}`,
  };

  return Object.entries(replacementMap).reduce(
    (result, [key, value]) => result.split(key).join(value),
    content
  );
};

const generateTermsFromTemplate = (template, req) => {
  if (!template) return generateDefaultTerms(req);

  const baseSections = [
    template.useBasicInfoSection ? template.basicInfoContent : null,
    template.usePaymentSection ? template.paymentContent : null,
    template.useViolationSection ? template.violationContent : null,
    template.useTerminationSection ? template.terminationContent : null,
    template.useSignatureSection ? template.signatureContent : null,
  ]
    .map((section) => (section || "").trim())
    .filter(Boolean)
    .map((section) => applyTemplateVariables(section, req));

  const additionalSections = (template.additionalTermsContent || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => applyTemplateVariables(line, req));

  const rawSections = [...baseSections, ...additionalSections];

  if (rawSections.length === 0) {
    return generateDefaultTerms(req);
  }

  return rawSections.map((content, index) => `${index + 1}. ${content}`).join("\n");
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

  // Zone preview modal
  const [zonePreview, setZonePreview] = useState(null); // { request, warehouseData, areas }

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

  // Owner zone assignment
  const [showZoneAssignment, setShowZoneAssignment] = useState(false);
  const [zoneAssignmentData, setZoneAssignmentData] = useState(null); // warehouse data + areas for modal
  const [assignedZone, setAssignedZone] = useState(null); // { posX, posY, width, length, baseAreaId }
  const [defaultContractTemplate, setDefaultContractTemplate] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  useEffect(() => {
    fetchDefaultTemplate();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getOwnerRequests(activeTab);
      console.log(`[RentalRequests] Tab: ${activeTab}, Data:`, data);
      
      // Thay đổi 1: Sort tab PENDING theo tổng giá trị hợp đồng giảm dần
      const sorted = activeTab === "PENDING"
        ? [...data].sort((a, b) => {
            const valA = Number(a.totalValue) || 0;
            const valB = Number(b.totalValue) || 0;
            return valB - valA;
          })
        : data;
      setRequests(sorted);
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

  const fetchDefaultTemplate = async () => {
    try {
      const template = await contractTemplateService.getOwnerDefaultTemplate();
      setDefaultContractTemplate(template || null);
    } catch (err) {
      console.error("Không thể tải template hợp đồng mặc định:", err);
      setDefaultContractTemplate(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const openZonePreview = async (req) => {
    try {
      const [warehouse, areasRes] = await Promise.all([
        warehouseService.getWarehouseById(req.warehouseId),
        axiosClient.get(`/RentalAreas/warehouse/${req.warehouseId}`),
      ]);
      setZonePreview({
        request: req,
        warehouseData: warehouse,
        areas: areasRes.data || [],
      });
    } catch (err) {
      console.error('Failed to load zone preview:', err);
      alert('Không thể tải bản đồ khu vực. Vui lòng thử lại.');
    }
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
        terms: generateTermsFromTemplate(defaultContractTemplate, req),
        pricePerM2: pricePerM2, // Lưu giá/m2 để hiển thị
      });
      setContractImageFile(null);
      setContractImagePreview(null);
      setAssignedZone(null); // Reset zone assignment
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
    setAssignedZone(null);
    setShowZoneAssignment(false);
    setZoneAssignmentData(null);
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
    // If contract was already created (user went back from send draft step),
    // just show the send draft step again instead of calling API
    if (createdContractId) {
      setShowSignatureStep(true);
      return;
    }

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

      // Include owner-assigned zone if set
      if (assignedZone) {
        payload.assignedPositionX = assignedZone.posX;
        payload.assignedPositionY = assignedZone.posY;
        payload.assignedWidth = assignedZone.width;
        payload.assignedLength = assignedZone.length;
        payload.assignedBaseAreaId = assignedZone.baseAreaId || null;

        // L-shaped extension zone
        if (assignedZone.extensionZone) {
          payload.assignedHasExtensionZone = true;
          payload.assignedExtensionPositionX = assignedZone.extensionZone.posX;
          payload.assignedExtensionPositionY = assignedZone.extensionZone.posY;
          payload.assignedExtensionWidth = assignedZone.extensionZone.width;
          payload.assignedExtensionLength = assignedZone.extensionZone.length;
        }

        // Multi-zone: additional non-adjacent rectangles
        if (assignedZone.additionalZones && assignedZone.additionalZones.length > 0) {
          payload.assignedAdditionalZonesJson = JSON.stringify(assignedZone.additionalZones);
        }
      }

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
        err.response?.data?.error || err.response?.data?.message || "Có lỗi khi tạo hợp đồng"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendDraft = async () => {
    try {
      setActionLoading(true);
      await rentalService.sendContractDraft(createdContractId);
      closeModal();
      fetchRequests(); // Reload list after sending
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi khi gửi bản nháp hợp đồng");
    } finally {
      setActionLoading(false);
    }
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

    // A zone is valid if owner just assigned one, OR renter already had a proposal/selected an area
    const hasValidZone = !!assignedZone || !!req.isCustomArea || !!req.rentalAreaName;

    // If showing signature step
    if (showSignatureStep) {
      return (
        <>
          <div style={{ marginBottom: "1.2rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.3rem" }}>
              Gửi bản nháp hợp đồng
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
              Xác nhận gửi bản nháp hợp đồng đến người thuê để bắt đầu đàm phán
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
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
              onClick={handleSendDraft}
              disabled={actionLoading}
              style={{
                padding: "0.7rem 1.5rem", borderRadius: "10px", border: "none",
                backgroundColor: actionLoading ? "#94a3b8" : "#2563eb",
                color: "#fff", fontWeight: 600,
                cursor: actionLoading ? "not-allowed" : "pointer", fontSize: "0.9rem",
              }}
            >
              {actionLoading ? "Đang gửi..." : "Gửi bản nháp"}
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

        {/* ── Zone Assignment (Owner picks zone for renter) ── */}
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
            background: "linear-gradient(135deg, #8b5cf614 0%, #8b5cf608 100%)",
            borderBottom: "2px solid #8b5cf622",
          }}>
            <Icon name="location_on" size={17} color="#8b5cf6" />
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#8b5cf6" }}>Chỉ định vị trí khu vực</span>
          </div>
          <div style={{ padding: "0.9rem 1rem", backgroundColor: "#fff" }}>
            {req.isCustomArea ? (
              /* Renter already proposed a custom zone */
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  background: "#fffbeb", border: "1px solid #fde68a",
                }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Người thuê đã chọn vị trí</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#92400e" }}>
                    {req.proposedWidth}m × {req.proposedLength}m{req.hasExtensionZone ? ` + ${req.extensionWidth}m × ${req.extensionLength}m` : ''}
                  </div>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    openZonePreview(req);
                  }}
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                    color: "#fff", fontWeight: 700, fontSize: "0.78rem",
                    cursor: "pointer", whiteSpace: "nowrap",
                    boxShadow: "0 2px 6px rgba(245,158,11,0.35)",
                  }}
                >
                  Xem bản đồ ↗
                </button>
              </div>
            ) : req.rentalAreaName ? (
              /* Renter picked an existing area */
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "#f0fdf4", border: "1px solid #86efac",
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Ô khu đã chọn bởi người thuê</div>
                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#166534" }}>
                  {req.rentalAreaName} — {req.rentalAreaSize} m²
                </div>
              </div>
            ) : (
              /* No zone chosen yet — Owner can assign */
              <div>
                {assignedZone ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      flex: 1, padding: "10px 14px", borderRadius: 10,
                      background: "#f0fdf4", border: "1px solid #86efac",
                    }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        ✓ Vị trí đã chỉ định{assignedZone.extensionZone ? " (L-shape)" : ""}
                      </div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#166534" }}>
                        {assignedZone.width}m × {assignedZone.length}m
                        {assignedZone.extensionZone && (
                          <span style={{ display: "block", fontSize: "0.8rem", color: "#d97706", marginTop: 2 }}>
                            + Mở rộng: {assignedZone.extensionZone.width}m × {assignedZone.extensionZone.length}m
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const [warehouse, areasRes] = await Promise.all([
                            warehouseService.getWarehouseById(req.warehouseId),
                            axiosClient.get(`/RentalAreas/warehouse/${req.warehouseId}`),
                          ]);
                          setZoneAssignmentData({
                            warehouseData: warehouse,
                            areas: areasRes.data || [],
                            requestedM3: req.requestedArea,
                          });
                          setShowZoneAssignment(true);
                        } catch (err) {
                          console.error('Failed to load zone data:', err);
                          alert('Không thể tải dữ liệu khu vực. Vui lòng thử lại.');
                        }
                      }}
                      style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid #93c5fd",
                        background: "#eff6ff", color: "#2563eb", fontWeight: 600,
                        fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      Xem lại
                    </button>
                    <button
                      onClick={() => setAssignedZone(null)}
                      style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid #fca5a5",
                        background: "#fff", color: "#dc2626", fontWeight: 600,
                        fontSize: "0.78rem", cursor: "pointer",
                      }}
                    >Xóa</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    {/* ── Warning: zone is required ── */}
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      padding: "10px 14px", borderRadius: 10,
                      background: "#fff7ed", border: "1.5px solid #fed7aa",
                      width: "100%", boxSizing: "border-box",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ea580c", flexShrink: 0, marginTop: 1 }}>warning</span>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#c2410c", marginBottom: 2 }}>Bắt buộc chỉ định vị trí</div>
                        <div style={{ fontSize: "0.78rem", color: "#9a3412", lineHeight: 1.5 }}>
                          Người thuê chưa chọn vị trí cụ thể. Bạn <strong>phải</strong> chỉ định khu vực trên bản đồ trước khi duyệt hợp đồng.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const [warehouse, areasRes] = await Promise.all([
                            warehouseService.getWarehouseById(req.warehouseId),
                            axiosClient.get(`/RentalAreas/warehouse/${req.warehouseId}`),
                          ]);
                          setZoneAssignmentData({
                            warehouseData: warehouse,
                            areas: areasRes.data || [],
                            requestedM3: req.requestedArea,
                          });
                          setShowZoneAssignment(true);
                        } catch (err) {
                          console.error('Failed to load zone data:', err);
                          alert('Không thể tải dữ liệu khu vực. Vui lòng thử lại.');
                        }
                      }}
                      style={{
                        padding: "10px 24px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                        color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                        cursor: "pointer",
                        boxShadow: "0 3px 12px rgba(139,92,246,0.35)",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <Icon name="map" size={16} color="#fff" />
                      Chỉ định vị trí trên bản đồ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
          {!hasValidZone && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0.5rem 0.9rem", borderRadius: 8,
              background: "#fff7ed", border: "1px solid #fed7aa",
              fontSize: "0.78rem", color: "#c2410c", fontWeight: 600,
            }}>
              Vui lòng chỉ định vị trí khu vực trước
            </div>
          )}
          <button
            onClick={handleApprove}
            disabled={actionLoading || !hasValidZone}
            title={!hasValidZone ? "Bạn phải chỉ định vị trí khu vực thuê trước khi duyệt" : ""}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem 1.6rem", borderRadius: "10px", border: "none",
              background: (actionLoading || !hasValidZone) ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff", fontWeight: 700,
              cursor: (actionLoading || !hasValidZone) ? "not-allowed" : "pointer", fontSize: "0.88rem",
              boxShadow: (actionLoading || !hasValidZone) ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
              transition: "all 0.15s",
            }}
          >
            {actionLoading ? "Đang gửi..." : (<><Icon name="draw" size={16} color="#fff" />Gửi bản nháp hợp đồng</>)}
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !actionLoading) {
              e.preventDefault();
              handleReject();
            }
          }}
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
          {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ padding: "0 2rem 3rem", maxWidth: 1200, margin: "0 auto", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes cardIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ow-card { transition: all 0.25s cubic-bezier(.4,0,.2,1); }
        .ow-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06) !important; }
        .ow-btn { transition: all 0.18s ease; }
        .ow-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .ow-btn:active { transform: translateY(0); }
        .ow-tab { position: relative; transition: all 0.2s; }
        .ow-tab::after { content:''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; border-radius: 3px 3px 0 0; background: transparent; transition: background 0.2s; }
        .ow-tab.active::after { background: #0ea5e9; }
      `}</style>

      {/* ── Hero Header ── */}
      <div style={{
        margin: "0 -2rem 32px -2rem",
        padding: "36px 40px 32px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
        borderRadius: "0 0 24px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(14,165,233,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(14,165,233,0.05)" }} />
        <div style={{ position: "absolute", top: 10, right: 140, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <h1 style={{
          fontSize: "1.85rem", fontWeight: 800, color: "#fff", margin: "0 0 8px",
          letterSpacing: "-0.02em", position: "relative",
        }}>
          Yêu cầu thuê kho
        </h1>
        <p style={{ color: "rgba(148,163,184,0.9)", margin: 0, fontSize: "0.92rem", position: "relative" }}>
          Xem xét và gửi hợp đồng hoặc từ chối các yêu cầu thuê kho
        </p>
        {!loading && requests.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginTop: 20, position: "relative", flexWrap: "wrap" }}>
            <div style={{
              padding: "10px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{requests.length}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(148,163,184,0.8)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {activeTab === "PENDING" ? "Chờ duyệt" : "Đã duyệt"}
              </div>
            </div>
            {/* Thay đổi 7: Stat giá trị cao nhất (chỉ tab PENDING) */}
            {activeTab === "PENDING" && (() => {
              const top = requests[0];
              const topVal = top?.totalValue || 0;
              return topVal > 0 ? (
                <div style={{
                  padding: "10px 20px", borderRadius: 12,
                  background: "rgba(245,158,11,0.18)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(245,158,11,0.35)",
                }}>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fbbf24", lineHeight: 1.3 }}>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(topVal)}
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(253,211,77,0.85)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Giá trị cao nhất
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 28, display: "flex", gap: 0, borderBottom: "2px solid #f1f5f9" }}>
        {["PENDING", "APPROVED"].map(tab => (
          <button
            key={tab}
            className={`ow-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 28px",
              fontSize: "0.92rem",
              fontWeight: activeTab === tab ? 700 : 500,
              border: "none", background: "none",
              color: activeTab === tab ? "#0ea5e9" : "#64748b",
              cursor: "pointer", marginBottom: "-2px",
            }}
          >
            {tab === "PENDING" ? "Chờ duyệt" : "Đã duyệt"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "16px 20px", marginBottom: 24,
          background: "linear-gradient(135deg, #fef2f2, #fff1f2)",
          borderRadius: 14, border: "1px solid #fecaca",
          fontSize: "0.9rem", fontWeight: 600, color: "#991b1b",
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "4px solid #e2e8f0", borderTopColor: "#0ea5e9",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ fontWeight: 600, color: "#64748b", fontSize: "0.95rem" }}>Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && requests.length === 0 && !error && (
        <div style={{
          textAlign: "center", padding: "5rem 2rem",
          background: "#fff", borderRadius: 20,
          border: "2px dashed #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: "1.5rem", fontWeight: 900, color: "#64748b",
          }}>—</div>
          <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#334155", margin: "0 0 6px" }}>
            {activeTab === "PENDING" ? "Không có yêu cầu nào đang chờ duyệt" : "Chưa có yêu cầu nào đã duyệt"}
          </p>
          <p style={{ fontSize: "0.88rem", color: "#94a3b8", margin: 0 }}>
            Các yêu cầu mới từ người thuê sẽ xuất hiện tại đây
          </p>
        </div>
      )}

      {/* ── Cards ── */}
      {!loading && requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {requests.map((req, idx) => {
            const status = statusColors[req.status] || { bg: "#f1f5f9", color: "#64748b", label: req.status };
            const accentColor = req.status === "PENDING" ? "#f59e0b" : req.status === "APPROVED" ? "#22c55e" : "#94a3b8";
            // Thay đổi 2: Xác định card ưu tiên cao nhất (Top 1 sau khi sort)
            const totalValue = Number(req.totalValue) || 0;
            const isTopPriority = activeTab === "PENDING" && idx === 0 && totalValue > 0;
            return (
              <div
                key={req.requestId}
                className="ow-card"
                style={{
                  // Thay đổi 3: Card top 1 có viền vàng + nền amber nhạt
                  background: isTopPriority
                    ? "linear-gradient(180deg, #fffbeb 0%, #fff 100px)"
                    : "#fff",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: isTopPriority
                    ? "0 8px 32px rgba(245,158,11,0.2), 0 2px 8px rgba(0,0,0,0.06)"
                    : "0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
                  border: isTopPriority
                    ? "2px solid #fbbf24"
                    : "1px solid #eef1f6",
                  animation: `cardIn 0.4s ease ${idx * 0.06}s both`,
                }}
              >
                {/* Thay đổi 4: Top accent bar — vàng cho card top 1 */}
                <div style={{
                  height: isTopPriority ? 5 : 4,
                  background: isTopPriority
                    ? "linear-gradient(90deg, #f59e0b, #fbbf24 40%, #fde68a 70%, transparent)"
                    : `linear-gradient(90deg, ${accentColor}, ${accentColor}88, transparent)`,
                }} />

                <div style={{ padding: "22px 28px 0" }}>
                  {/* ── Header row: YC+badge left | dates right ── */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: 16, marginBottom: 18,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 800,
                          color: accentColor, letterSpacing: "0.08em", textTransform: "uppercase",
                        }}>
                          YC-{req.requestId}
                        </span>
                        <span style={{
                          padding: "4px 14px", borderRadius: 20,
                          backgroundColor: status.bg, color: status.color,
                          fontSize: "0.75rem", fontWeight: 700,
                          border: `1.5px solid ${accentColor}30`,
                        }}>
                          {status.label}
                        </span>
                        {/* Thay đổi 5: Badge ưu tiên cao nhất */}
                        {isTopPriority && (
                          <span style={{
                            padding: "3px 12px", borderRadius: 20,
                            background: "linear-gradient(90deg, #f59e0b, #d97706)",
                            color: "#fff",
                            fontSize: "0.7rem", fontWeight: 800,
                            letterSpacing: "0.03em",
                            display: "flex", alignItems: "center", gap: 3,
                            boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
                            whiteSpace: "nowrap",
                          }}>
                            Ưu tiên cao nhất
                          </span>
                        )}
                      </div>
                      <h3 style={{
                        fontSize: "1.18rem", fontWeight: 800, color: "#0f172a",
                        margin: 0, letterSpacing: "-0.01em",
                      }}>
                        {req.warehouseName}
                      </h3>
                    </div>

                    {/* Dates top-right (same as renter side) */}
                    <div style={{
                      textAlign: "right", flexShrink: 0,
                      padding: "8px 14px", borderRadius: 10,
                      background: "#f8fafc", border: "1px solid #f1f5f9",
                    }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ngày gửi</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>{formatDate(req.createdAt)}</div>
                      {req.reviewedAt && (
                        <>
                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 6 }}>Duyệt</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>{formatDate(req.reviewedAt)}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Info chips (same layout as renter side) ── */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: req.notes ? 14 : 18 }}>
                    {[
                      { label: "Người thuê", value: `${req.renterName} (${req.renterEmail})`, wide: true },
                      { label: "Địa chỉ", value: req.warehouseAddress, wide: true },
                      { label: "Diện tích yêu cầu", value: `${req.requestedArea} m²` },
                      req.isCustomArea
                        ? (() => {
                          const ownerAssigned = !!req.isOwnerAssigned;
                          const label = ownerAssigned ? "Khu vực chủ kho đã sắp xếp" : "Khu vực người thuê tự vẽ";
                          const w = req.proposedWidth;
                          const l = req.proposedLength;
                          let value = `${w}m × ${l}m`;
                          if (req.additionalZonesJson) {
                            try {
                              const addZones = JSON.parse(req.additionalZonesJson);
                              value = `${1 + addZones.length} vùng — Tổng ${req.requestedArea} m²`;
                            } catch (e) { }
                          }
                          return {
                            label,
                            value,
                            highlighted: ownerAssigned,
                            customZone: !ownerAssigned,
                            ownerZone: ownerAssigned,
                          };
                        })()
                        : (req.rentalAreaName ? { label: "Ô khu đã chọn", value: `${req.rentalAreaName} — ${req.rentalAreaSize} m²`, highlighted: true } : null),
                      { label: "Thời hạn", value: `${req.durationMonths} tháng` },
                      { label: "Ngày bắt đầu", value: formatDate(req.startDate) },
                      // Thay đổi 6: Chip tổng giá trị hợp đồng
                      totalValue > 0
                        ? {
                          label: "Tổng giá trị HĐ",
                          value: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalValue),
                          highlighted: isTopPriority,
                          isTotalValue: true,
                        }
                        : null,
                    ].filter(Boolean).map(item => (
                      <div key={item.label} style={{
                        padding: "8px 14px", borderRadius: 10,
                        background: item.ownerZone ? "#f0fdf4" : item.customZone ? "#fffbeb" : item.highlighted ? "#f0fdf4" : "#f8fafc",
                        border: item.ownerZone ? "1px solid #86efac" : item.customZone ? "1px solid #fde68a" : item.highlighted ? "1px solid #86efac" : "1px solid #f1f5f9",
                        display: "flex", flexDirection: "column", gap: 4,
                        flex: "1 1 100%",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: item.ownerZone ? "#15803d" : item.customZone ? "#b45309" : item.highlighted ? "#15803d" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {item.label}
                          </span>
                          {item.customZone && (
                            <button
                              onClick={e => { e.stopPropagation(); openZonePreview(req); }}
                              style={{
                                padding: "3px 12px", borderRadius: 8, border: "none",
                                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                                color: "#fff", fontWeight: 700, fontSize: "0.72rem",
                                cursor: "pointer", whiteSpace: "nowrap",
                                boxShadow: "0 2px 6px rgba(245,158,11,0.35)",
                              }}
                            >
                              Xem bản đồ vị trí ↗
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: item.ownerZone ? "#166534" : item.customZone ? "#92400e" : item.highlighted ? "#166534" : "#334155" }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* ── Notes ── */}
                  {req.notes && (
                    <div style={{
                      padding: "12px 16px", marginBottom: 18,
                      background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                      borderRadius: 10, borderLeft: "4px solid #f59e0b",
                      fontSize: "0.85rem", color: "#92400e", lineHeight: 1.6,
                    }}>
                      <span style={{ fontWeight: 700 }}>Ghi chú: </span>{req.notes}
                    </div>
                  )}
                </div>

                {/* ── Action footer (bottom, separated, same pattern as renter) ── */}
                {req.status === "PENDING" && (
                  <div style={{
                    display: "flex", justifyContent: "flex-end", alignItems: "center",
                    gap: 10, padding: "14px 28px",
                    borderTop: "1px solid #f1f5f9",
                    background: "#fafbfd",
                  }}>
                    <button
                      className="ow-btn"
                      onClick={() => openApproveModal(req)}
                      style={{
                        padding: "10px 28px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                        color: "#fff", fontWeight: 700, cursor: "pointer",
                        fontSize: "0.88rem",
                        boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
                      }}
                    >
                      Gửi hợp đồng
                    </button>
                    <button
                      className="ow-btn"
                      onClick={() => openRejectModal(req)}
                      style={{
                        padding: "10px 24px", borderRadius: 10,
                        border: "1.5px solid #fca5a5",
                        background: "#fff", color: "#dc2626",
                        fontWeight: 700, cursor: "pointer",
                        fontSize: "0.88rem",
                      }}
                    >
                      Từ chối
                    </button>
                  </div>
                )}
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

      {/* ── Zone Preview Modal ── */}
      {zonePreview && (
        <ProposedZonePreviewModal
          open={!!zonePreview}
          onClose={() => setZonePreview(null)}
          request={zonePreview.request}
          warehouseData={zonePreview.warehouseData}
          areas={zonePreview.areas}
        />
      )}

      {/* ── Owner Zone Assignment Modal ── */}
      {showZoneAssignment && zoneAssignmentData && (
        <CustomAreaSelectorModal
          open={showZoneAssignment}
          onClose={() => { setShowZoneAssignment(false); setZoneAssignmentData(null); }}
          warehouseData={zoneAssignmentData.warehouseData}
          areas={zoneAssignmentData.areas}
          requestedM3={zoneAssignmentData.requestedM3}
          isOwnerMode={true}
          initialZone={assignedZone}
          onConfirm={(ca) => {
            setAssignedZone(ca); // ca includes extensionZone if L-shape
            setShowZoneAssignment(false);
            setZoneAssignmentData(null);
          }}
        />
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
