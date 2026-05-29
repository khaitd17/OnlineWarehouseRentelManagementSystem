import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import contractTemplateService from "../services/contractTemplateService";
import { useToast } from "../context/ToastContext";

const statusConfig = {
  DRAFT: { bg: "#f1f5f9", color: "#64748b", label: "Bản nháp" },
  NEGOTIATING: { bg: "#dbeafe", color: "#2563eb", label: "Đang đàm phán" },
  REVISION_REQUESTED: { bg: "#fef3c7", color: "#d97706", label: "Yêu cầu chỉnh sửa" },
  APPROVED_FOR_SIGNING: { bg: "#dcfce7", color: "#16a34a", label: "Sẵn sàng ký" },
  PENDING_RENTER_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ người thuê ký" },
  PENDING_OWNER_SIGNATURE: { bg: "#dbeafe", color: "#2563eb", label: "Chờ chủ kho ký" },
  PENDING_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  SIGNED: { bg: "#dbeafe", color: "#2563eb", label: "Đã ký" },
  PENDING_PAYMENT: { bg: "#fef3c7", color: "#d97706", label: "Chờ thanh toán" },
  PAYMENT_FAILED: { bg: "#fee2e2", color: "#dc2626", label: "Thanh toán thất bại" },
  ACTIVE: { bg: "#dcfce7", color: "#16a34a", label: "Đang hiệu lực" },
  COMPLETED: { bg: "#e0f2fe", color: "#0284c7", label: "Hoàn thành" },
  CLOSED: { bg: "#e0f2fe", color: "#0284c7", label: "Đã đóng" },
  TERMINATED: { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
  PENDING_TERMINATION: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ chấm dứt" },
  PENDING_CLOSE: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ đóng" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
  CANCELLED_BY_USER: { bg: "#f1f5f9", color: "#64748b", label: "Người dùng hủy" },
  CANCELLED_BY_OWNER: { bg: "#f1f5f9", color: "#64748b", label: "Chủ kho hủy" },
  CANCELLED_NO_PAYMENT: { bg: "#f1f5f9", color: "#64748b", label: "Hủy - Không TT" },
  OVERDUE: { bg: "#fee2e2", color: "#dc2626", label: "Quá hạn" },
  EXPIRED: { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  EXPIRED_SIGNATURE: { bg: "#fee2e2", color: "#dc2626", label: "Hết hạn ký" },
  EXPIRED_PAYMENT: { bg: "#fee2e2", color: "#dc2626", label: "Hết hạn TT" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const OwnerContracts = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contractTemplates, setContractTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    templateName: "",
    useBasicInfoSection: true,
    usePaymentSection: true,
    useViolationSection: true,
    useTerminationSection: true,
    useSignatureSection: true,
    basicInfoContent: "Bên A cho Bên B thuê diện tích [Diện tích thuê] m² tại kho [Tên kho], địa chỉ [Địa chỉ kho].",
    paymentContent: "Bên B thanh toán tiền thuê hàng tháng đúng hạn theo thỏa thuận của hai bên.",
    violationContent: "Nếu Bên B vi phạm nghĩa vụ thanh toán quá 15 ngày, Bên A có quyền áp dụng chế tài theo hợp đồng.",
    terminationContent: "Hai bên có quyền đề nghị chấm dứt hợp đồng theo điều kiện và quy trình đã thỏa thuận.",
    signatureContent: "Hợp đồng có hiệu lực khi cả hai bên hoàn tất chữ ký điện tử trên hệ thống.",
    additionalTermsContent: "",
  });
  const itemsPerPage = 8; // Adjust to prevent scrolling

  useEffect(() => {
    loadContracts();
    loadTemplates();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/rental-contracts/owner-contracts");
      setContracts(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplateLoading(true);
      const templates = await contractTemplateService.getOwnerTemplates();
      setContractTemplates(Array.isArray(templates) ? templates : []);
    } catch (err) {
      console.error("Error loading contract templates:", err);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleTemplateFieldChange = (field, value) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.templateName.trim()) {
      showToast("Vui lòng nhập tên mẫu hợp đồng", "warning");
      return;
    }

    const hasEnabledSection = [
      templateForm.useBasicInfoSection,
      templateForm.usePaymentSection,
      templateForm.useViolationSection,
      templateForm.useTerminationSection,
      templateForm.useSignatureSection,
    ].some(Boolean);

    if (!hasEnabledSection) {
      showToast("Cần bật ít nhất 1 nhóm trường trong mẫu hợp đồng", "warning");
      return;
    }

    setTemplateSubmitting(true);
    try {
      const result = await contractTemplateService.createOwnerTemplate(templateForm);
      const shouldSetDefault = window.confirm("Đã lưu mẫu hợp đồng. Bạn có muốn đặt mẫu này làm mặc định không?");
      if (shouldSetDefault && result?.templateId) {
        await contractTemplateService.setDefaultTemplate(result.templateId);
      }
      await loadTemplates();
      setShowTemplateModal(false);
      showToast("Tạo mẫu hợp đồng thành công!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Không thể tạo mẫu hợp đồng", "error");
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleSetDefaultTemplate = async (templateId) => {
    try {
      await contractTemplateService.setDefaultTemplate(templateId);
      await loadTemplates();
      showToast("Đã đặt mẫu hợp đồng mặc định thành công", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Không thể đặt mẫu hợp đồng mặc định", "error");
    }
  };

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const filteredContracts = contracts.filter((c) => {
    const statusMatched = filterStatus === "ALL" || c.status === filterStatus;
    if (!statusMatched) return false;

    if (!normalizedKeyword) return true;

    const searchableText = [
      c.contractNumber,
      c.warehouseName,
      c.renterName,
      c.renterEmail,
      c.renterPhone
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedKeyword);
  });

  const statusCounts = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const defaultTemplate = contractTemplates.find((t) => t.isDefault);

  // Pagination logic
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const currentContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter or search change
  }, [filterStatus, searchKeyword]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ color: "#0284c7", fontWeight: 600, display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite" }}>sync</span>
          Đang tải danh sách hợp đồng...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</div>
        <button
          onClick={loadContracts}
          style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", backgroundColor: "#0284c7", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: "0 2rem 3rem", maxWidth: 1100, margin: "0 auto",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* ── Hero Header ── */}
      <div style={{
        margin: "0 -2rem 28px -2rem",
        padding: "32px 40px 28px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
        borderRadius: "0 0 24px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(14,165,233,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(14,165,233,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", position: "relative" }}>
          <div>
            <h1 style={{
              fontSize: "1.65rem", fontWeight: 800, color: "#fff", margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}>
              Quản lý hợp đồng
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", margin: 0 }}>
              Quản lý, theo dõi tình trạng và cập nhật hợp đồng thuê kho của bạn.
            </p>
          </div>

          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(14,165,233,0.22)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>note_add</span>
            Tạo mẫu hợp đồng
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 16, marginTop: 20, position: "relative",
        }}>
          <div style={{
            padding: "10px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tất cả
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#38bdf8" }}>
              {contracts.length}
            </div>
          </div>
          <div style={{
            padding: "10px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Đang hiệu lực
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4ade80" }}>
              {contracts.filter(c => c.status === "ACTIVE").length}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ 
          backgroundColor: "#fff", 
          borderRadius: "16px", 
          padding: "1.5rem", 
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0" 
        }}>

          {/* Search Bar */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ position: "relative", maxWidth: "600px" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>search</span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tra cứu mã hợp đồng, tên kho, thông tin người thuê..."
                style={{
                  width: "100%", padding: "0.85rem 1rem 0.85rem 2.75rem", borderRadius: "12px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem", color: "#0f172a", backgroundColor: "#f8fafc", transition: "all 0.2s"
                }}
                onFocus={e => { e.target.style.borderColor = "#0284c7"; e.target.style.backgroundColor = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(2,132,199,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.backgroundColor = "#f8fafc"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#0ea5e9" }}>description</span>
                Mẫu hợp đồng mặc định
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                {defaultTemplate ? defaultTemplate.templateName : "Chưa đặt mẫu hợp đồng mặc định"}
              </div>
            </div>
            <button
              onClick={() => setShowTemplatePicker(true)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #0284c7",
                backgroundColor: "#fff",
                color: "#0284c7",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
              }}
            >
              Chọn mẫu
            </button>
          </div>

          {/* Status Filter Cards */}
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px", marginBottom: "1rem" }}>
            <div
              onClick={() => setFilterStatus("ALL")}
              style={{
                backgroundColor: filterStatus === "ALL" ? "#0284c7" : "#f1f5f9",
                color: filterStatus === "ALL" ? "#fff" : "#475569",
                borderRadius: "10px", padding: "10px 16px", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, fontWeight: 600, fontSize: "0.9rem", border: filterStatus === "ALL" ? "none" : "1px solid #e2e8f0"
              }}
            >
              Tất cả
              <span style={{ backgroundColor: filterStatus === "ALL" ? "rgba(255,255,255,0.2)" : "#e2e8f0", padding: "2px 8px", borderRadius: "20px", fontSize: "0.8rem" }}>{contracts.length}</span>
            </div>
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = statusCounts[status] || 0;
              if (count === 0) return null;
              const isActive = filterStatus === status;
              return (
                <div
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    backgroundColor: isActive ? config.bg : "#fff",
                    color: isActive ? config.color : "#475569",
                    borderRadius: "10px", padding: "10px 16px", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, fontWeight: 600, fontSize: "0.9rem", border: `1px solid ${isActive ? config.color : "#e2e8f0"}`
                  }}
                >
                  {config.label}
                  <span style={{ backgroundColor: isActive ? "#fff" : "#f1f5f9", padding: "2px 8px", borderRadius: "20px", fontSize: "0.8rem" }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Table */}
          {filteredContracts.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#94a3b8" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", marginBottom: "1rem" }}>search_off</span>
              <h3 style={{ margin: 0, fontWeight: 600 }}>Không tìm thấy hợp đồng nào</h3>
              <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    {["Mã HĐ / Kho", "Người thuê", "Thời hạn", "Diện tích", "Giá trị / Tháng", "Trạng thái", "Thao tác"].map((h, i) => (
                      <th key={i} style={{ padding: "12px 16px", textAlign: i === 6 ? "right" : "left", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "2px solid #e2e8f0", borderTop: "1px solid #e2e8f0", borderLeft: i===0?"1px solid #e2e8f0":"none", borderRight: i===6?"1px solid #e2e8f0":"none", borderTopLeftRadius: i===0?"8px":"0", borderTopRightRadius: i===6?"8px":"0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentContracts.map((contract, index) => {
                    const config = statusConfig[contract.status] || { bg: "#f1f5f9", color: "#64748b", label: contract.status };
                    const isLast = index === currentContracts.length - 1;
                    return (
                      <tr key={contract.contractId} style={{ transition: "background-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#fefce8"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", borderLeft: "1px solid #e2e8f0", borderBottomLeftRadius: isLast?"8px":"0" }}>
                          <div style={{ fontWeight: 700, color: "#0284c7" }}>
                            {contract.contractNumber || `#${contract.contractId}`}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginTop: "2px", maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={contract.warehouseName}>
                            {contract.warehouseName || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b", maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={contract.renterName}>
                            {contract.renterName || "—"}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {contract.renterPhone || contract.renterEmail || ""}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>Từ: {formatDate(contract.startDate)}</div>
                          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Đến: {formatDate(contract.endDate)}</div>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
                          <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700, display: "inline-block" }}>
                            {contract.requestedArea || 0} m²
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {formatCurrency(contract.monthlyPayment)}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
                          <span style={{ backgroundColor: config.bg, color: config.color, padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, display: "inline-block", whiteSpace: "nowrap" }}>
                            {config.label}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", borderBottomRightRadius: isLast?"8px":"0" }}>
                          <button
                            onClick={() => navigate(`/contracts/${contract.contractId}`)}
                            style={{ padding: "6px 14px", borderRadius: "8px", backgroundColor: "#fff", color: "#0284c7", border: "1px solid #0284c7", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s", whiteSpace: "nowrap" }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#0284c7"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.color = "#0284c7"; }}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredContracts.length)} trong số {filteredContracts.length} hợp đồng
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: currentPage === 1 ? "#f1f5f9" : "#fff", color: currentPage === 1 ? "#94a3b8" : "#0f172a", border: "1px solid #cbd5e1", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 600, transition: "background-color 0.2s" }}
                  onMouseEnter={e => { if(currentPage !== 1) e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                  onMouseLeave={e => { if(currentPage !== 1) e.currentTarget.style.backgroundColor = "#fff"; }}
                >
                  Trước
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: currentPage === page ? "#0284c7" : "transparent", color: currentPage === page ? "#fff" : "#475569", border: currentPage === page ? "none" : "1px solid transparent", cursor: "pointer", fontWeight: 600 }}
                      onMouseEnter={e => { if(currentPage !== page) e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                      onMouseLeave={e => { if(currentPage !== page) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: currentPage === totalPages ? "#f1f5f9" : "#fff", color: currentPage === totalPages ? "#94a3b8" : "#0f172a", border: "1px solid #cbd5e1", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: 600, transition: "background-color 0.2s" }}
                  onMouseEnter={e => { if(currentPage !== totalPages) e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                  onMouseLeave={e => { if(currentPage !== totalPages) e.currentTarget.style.backgroundColor = "#fff"; }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {showTemplateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(2, 6, 23, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => !templateSubmitting && setShowTemplateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "#fff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 40px rgba(15,23,42,0.22)",
              padding: "1.1rem 1.2rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>Tạo mẫu hợp đồng</h3>
              <button onClick={() => !templateSubmitting && setShowTemplateModal(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", fontSize: "1.25rem" }}>×</button>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Tên mẫu *</label>
              <input
                type="text"
                value={templateForm.templateName}
                onChange={(e) => handleTemplateFieldChange("templateName", e.target.value)}
                placeholder="Ví dụ: Mẫu hợp đồng kho tiêu chuẩn"
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", marginBottom: "12px" }}>
              {[
                ["useBasicInfoSection", "Thông tin cơ bản"],
                ["usePaymentSection", "Điều khoản thanh toán"],
                ["useViolationSection", "Điều khoản vi phạm"],
                ["useTerminationSection", "Điều khoản chấm dứt"],
                ["useSignatureSection", "Điều khoản chữ ký"],
              ].map(([field, label]) => (
                <label key={field} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={templateForm[field]}
                    onChange={(e) => handleTemplateFieldChange(field, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {[
                ["basicInfoContent", "Nội dung thông tin cơ bản", templateForm.useBasicInfoSection],
                ["paymentContent", "Nội dung điều khoản thanh toán", templateForm.usePaymentSection],
                ["violationContent", "Nội dung điều khoản vi phạm", templateForm.useViolationSection],
                ["terminationContent", "Nội dung điều khoản chấm dứt", templateForm.useTerminationSection],
                ["signatureContent", "Nội dung điều khoản chữ ký", templateForm.useSignatureSection],
              ].map(([field, label, enabled]) => (
                <div key={field}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: enabled ? "#475569" : "#94a3b8", marginBottom: "4px" }}>{label}</label>
                  <textarea
                    rows={3}
                    disabled={!enabled}
                    value={templateForm[field]}
                    onChange={(e) => handleTemplateFieldChange(field, e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "vertical", backgroundColor: enabled ? "#fff" : "#f8fafc" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Điều khoản bổ sung (tự ghi)</label>
                <textarea
                  rows={3}
                  value={templateForm.additionalTermsContent}
                  onChange={(e) => handleTemplateFieldChange("additionalTermsContent", e.target.value)}
                  placeholder="Mỗi dòng sẽ được tính là 1 điều khoản bổ sung."
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "12px", fontSize: "0.8rem", color: "#64748b", backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "8px 10px" }}>
              Gợi ý chèn thông tin tự động: <strong>[Diện tích thuê]</strong>, <strong>[Tên kho]</strong>, <strong>[Địa chỉ kho]</strong>, <strong>[Người thuê]</strong>, <strong>[Thời hạn]</strong>.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button onClick={() => !templateSubmitting && setShowTemplateModal(false)} disabled={templateSubmitting} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={handleCreateTemplate} disabled={templateSubmitting} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: templateSubmitting ? "#94a3b8" : "#0284c7", color: "#fff", fontWeight: 700, cursor: templateSubmitting ? "not-allowed" : "pointer" }}>
                {templateSubmitting ? "Đang lưu..." : "Lưu mẫu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplatePicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(2, 6, 23, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setShowTemplatePicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "80vh",
              overflowY: "auto",
              backgroundColor: "#fff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 40px rgba(15,23,42,0.22)",
              padding: "1.1rem 1.2rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: "#0f172a" }}>Chọn mẫu hợp đồng</h3>
              <button onClick={() => setShowTemplatePicker(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", fontSize: "1.25rem" }}>×</button>
            </div>

            {templateLoading && <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Đang tải...</div>}
            {!templateLoading && contractTemplates.length === 0 && (
              <div style={{ fontSize: "0.88rem", color: "#64748b" }}>
                Chưa có mẫu hợp đồng nào. Hãy tạo mẫu trước khi chọn mặc định.
              </div>
            )}
            {contractTemplates.length > 0 && (
              <div style={{ display: "grid", gap: "8px" }}>
                {contractTemplates.map((template) => (
                  <div key={template.templateId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                        {template.templateName}
                        {template.isDefault && (
                          <span style={{ fontSize: "0.72rem", color: "#065f46", backgroundColor: "#d1fae5", borderRadius: "999px", padding: "2px 8px" }}>
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Tạo ngày: {formatDate(template.createdAt)}
                      </div>
                    </div>
                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefaultTemplate(template.templateId)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: "1px solid #0284c7",
                          backgroundColor: "#fff",
                          color: "#0284c7",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "0.82rem",
                        }}
                      >
                        Đặt mặc định
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerContracts;
