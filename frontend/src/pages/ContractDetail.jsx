import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";
import ContractSigningModal from "../components/ContractSigningModal";
import TerminateContractModal from "../components/TerminateContractModal";
import ExtensionRequestModal from "../components/ExtensionRequestModal";
import ReturnWarehouseModal from "../components/ReturnWarehouseModal";
import SigningHistoryTimeline from "../components/SigningHistoryTimeline";
import AuditLogList from "../components/AuditLogList";

const statusConfig = {
  DRAFT:      { bg: "#f1f5f9", color: "#64748b", label: "Chờ ký" },
  PENDING_OWNER_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ chủ kho ký" },
  PENDING_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  SIGNED:     { bg: "#dbeafe", color: "#2563eb", label: "Đã ký" },
  PENDING_PAYMENT: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ thanh toán" },
  ACTIVE:     { bg: "#dcfce7", color: "#16a34a", label: "Đang hiệu lực" },
  COMPLETED:  { bg: "#e0e7ff", color: "#6366f1", label: "Đã hoàn thành" },
  CLOSED:     { bg: "#f1f5f9", color: "#64748b", label: "Đã đóng" },
  EXPIRED:    { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  TERMINATED: { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
  CANCELLED:  { bg: "#fee2e2", color: "#dc2626", label: "Đã hủy" },
  OVERDUE:    { bg: "#fee2e2", color: "#dc2626", label: "Quá hạn" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </span>
    <span style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: 500 }}>{value}</span>
  </div>
);

const Section = ({ title, children, action }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem",
      paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
        {title}
      </h2>
      {action}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.2rem" }}>
      {children}
    </div>
  </div>
);

const CollapsibleSection = ({ title, isOpen, onToggle, children }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
    <div
      onClick={onToggle}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
        {title}
      </h2>
      <span className="material-symbols-outlined" style={{ color: "#64748b", fontSize: "20px" }}>
        {isOpen ? "expand_less" : "expand_more"}
      </span>
    </div>
    {isOpen && (
      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
        {children}
      </div>
    )}
  </div>
);

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // New states for additional features
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [signingHistory, setSigningHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSigningHistory, setShowSigningHistory] = useState(true);

  // Modal states
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const reloadContract = () => {
    setRefreshKey(k => k + 1);
  };

  // Fetch contract
  useEffect(() => {
    setLoading(true);
    rentalService.getContractById(id)
      .then(setContract)
      .catch((err) => {
        if (err.response?.status === 403) setError("Bạn không có quyền xem hợp đồng này.");
        else if (err.response?.status === 404) setError("Không tìm thấy hợp đồng.");
        else setError("Không thể tải thông tin hợp đồng.");
      })
      .finally(() => setLoading(false));
  }, [id, refreshKey]);

  // Fetch signing history
  useEffect(() => {
    if (contract?.contractId) {
      setLoadingHistory(true);
      rentalService.getContractSigningHistory(contract.contractId)
        .then(setSigningHistory)
        .catch(() => setSigningHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [contract?.contractId]);

  // Fetch audit logs when expanded
  useEffect(() => {
    if (showAuditLogs && contract?.contractId && auditLogs.length === 0) {
      setLoadingLogs(true);
      rentalService.getContractAuditLogs(contract.contractId)
        .then(setAuditLogs)
        .catch(() => setAuditLogs([]))
        .finally(() => setLoadingLogs(false));
    }
  }, [showAuditLogs, contract?.contractId, auditLogs.length]);

  // Download PDF handler
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await rentalService.downloadContractPdf(contract.contractId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HopDong_${contract.contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("Không thể tải PDF hợp đồng. Vui lòng thử lại.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Calculate action button visibility
  const canTerminate = contract?.status === "ACTIVE";
  const daysUntilExpiry = contract?.endDate
    ? Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  const canRequestExtension = contract?.status === "ACTIVE" && daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  const canReturn = ["ACTIVE", "COMPLETED"].includes(contract?.status);

  if (loading) return <div style={{ padding: "2rem", color: "#64748b" }}>Đang tải...</div>;

  if (error) return (
    <div style={{ padding: "2rem" }}>
      <div style={{ color: "#dc2626", padding: "12px 16px", backgroundColor: "#fef2f2",
        borderRadius: "12px", border: "1px solid #fecaca", marginBottom: "1rem" }}>
        {error}
      </div>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Quay lại</button>
    </div>
  );

  if (!contract) return null;

  const status = statusConfig[contract.status] || { bg: "#f1f5f9", color: "#64748b", label: contract.status };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>← Quay lại</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
              Hợp đồng {contract.contractNumber}
            </h1>
            <span style={{
              padding: "4px 14px", borderRadius: "20px",
              backgroundColor: status.bg, color: status.color,
              fontSize: "0.85rem", fontWeight: 600,
            }}>
              {status.label}
            </span>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "0.2rem" }}>
            Tạo ngày {formatDate(contract.createdAt)}
          </p>
        </div>
        {/* Download PDF Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            color: "#0095c7",
            fontWeight: 600,
            cursor: downloadingPdf ? "not-allowed" : "pointer",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: downloadingPdf ? 0.6 : 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
          {downloadingPdf ? "Đang tải..." : "Tải PDF"}
        </button>
      </div>

      {/* Bên cho thuê (Bên A) */}
      {contract.ownerName && (
        <Section title="Bên cho thuê (Bên A)">
          <InfoRow label="Họ tên" value={contract.ownerName} />
        </Section>
      )}

      {/* Thông tin kho */}
      <Section title="Thông tin kho">
        <InfoRow label="Tên kho" value={contract.warehouseName} />
        <InfoRow label="Địa chỉ" value={contract.warehouseAddress} />
      </Section>

      {/* Bên thuê (Bên B) */}
      <Section title="Bên thuê (Bên B)">
        <InfoRow label="Họ tên" value={contract.renterName} />
        <InfoRow label="Email" value={contract.renterEmail} />
      </Section>

      {/* Thời hạn hợp đồng */}
      <Section title="Thời hạn hợp đồng">
        <InfoRow label="Ngày bắt đầu" value={formatDate(contract.startDate)} />
        <InfoRow label="Ngày kết thúc" value={formatDate(contract.endDate)} />
        {contract.status === "ACTIVE" && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{
              padding: "8px 12px",
              backgroundColor: "#fef3c7",
              borderRadius: "8px",
              color: "#92400e",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}>
              ⏰ Còn {daysUntilExpiry} ngày nữa hết hạn hợp đồng
            </div>
          </div>
        )}
      </Section>

      {/* Thông tin tài chính */}
      <Section title="Thông tin tài chính">
        <InfoRow label="Giá thuê/tháng" value={formatCurrency(contract.monthlyPayment)} />
        <InfoRow label="Tổng giá trị hợp đồng" value={formatCurrency(contract.totalValue)} />
        {contract.depositAmount != null && (
          <InfoRow label="Tiền đặt cọc" value={formatCurrency(contract.depositAmount)} />
        )}
      </Section>

      {/* Điều khoản */}
      {contract.terms && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Điều khoản hợp đồng
          </h2>
          <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {contract.terms}
          </p>
        </div>
      )}

      {/* Ảnh / tài liệu đính kèm từ chủ kho */}
      {contract.contractImageUrl && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Tài liệu đính kèm từ chủ kho
          </h2>
          {/\.(jpg|jpeg|png|gif|webp)$/i.test(contract.contractImageUrl) ? (
            <div>
              <img
                src={`http://localhost:5276${contract.contractImageUrl}`}
                alt="Tài liệu hợp đồng"
                style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "10px",
                  objectFit: "contain", border: "1px solid #e2e8f0" }}
              />
              <div style={{ marginTop: "0.8rem" }}>
                <a href={`http://localhost:5276${contract.contractImageUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                  Xem ảnh gốc
                </a>
              </div>
            </div>
          ) : (
            <a href={`http://localhost:5276${contract.contractImageUrl}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
              Xem tài liệu đính kèm
            </a>
          )}
        </div>
      )}

      {/* Thông báo DRAFT */}
      {contract.status === "DRAFT" && (
        <div style={{ marginBottom: "1rem", padding: "1rem 1.5rem", backgroundColor: "#fefce8",
          borderRadius: "12px", border: "1px solid #fde047", color: "#854d0e", fontSize: "0.9rem" }}>
          <strong>Hợp đồng đang chờ ký.</strong> Nhấn nút bên dưới để bắt đầu quy trình ký hợp đồng.
        </div>
      )}

      {/* PDF Links */}
      {(contract.contractFileUrl || contract.ownerSignedFileUrl || contract.signedFileUrl) && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Tài liệu hợp đồng
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {contract.signedFileUrl && (
              <a href={`http://localhost:5276${contract.signedFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#16a34a", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified</span>
                Hợp đồng đã ký đầy đủ ({formatDate(contract.signedAt)})
              </a>
            )}
            {!contract.signedFileUrl && contract.ownerSignedFileUrl && (
              <a href={`http://localhost:5276${contract.ownerSignedFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit_document</span>
                Hợp đồng đã ký bởi chủ kho ({formatDate(contract.ownerSignedAt)})
              </a>
            )}
            {!contract.signedFileUrl && !contract.ownerSignedFileUrl && contract.contractFileUrl && (
              <a href={`http://localhost:5276${contract.contractFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#64748b", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>description</span>
                Hợp đồng gốc (chưa ký)
              </a>
            )}
          </div>
        </div>
      )}

      {/* Signing History Section */}
      <CollapsibleSection
        title="Lịch sử ký hợp đồng"
        isOpen={showSigningHistory}
        onToggle={() => setShowSigningHistory(!showSigningHistory)}
      >
        <SigningHistoryTimeline history={signingHistory} loading={loadingHistory} />
      </CollapsibleSection>

      {/* Audit Log Section */}
      <CollapsibleSection
        title="Nhật ký hoạt động"
        isOpen={showAuditLogs}
        onToggle={() => setShowAuditLogs(!showAuditLogs)}
      >
        <AuditLogList logs={auditLogs} loading={loadingLogs} />
      </CollapsibleSection>

      {/* Actions Section */}
      {(canTerminate || canRequestExtension || canReturn) && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Thao tác
          </h2>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            {canRequestExtension && (
              <button
                onClick={() => setShowExtensionModal(true)}
                style={{
                  padding: "0.7rem 1.2rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event_repeat</span>
                Yêu cầu gia hạn
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => setShowReturnModal(true)}
                style={{
                  padding: "0.7rem 1.2rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>assignment_return</span>
                Trả kho
              </button>
            )}
            {canTerminate && (
              <button
                onClick={() => setShowTerminateModal(true)}
                style={{
                  padding: "0.7rem 1.2rem",
                  borderRadius: "10px",
                  border: "1px solid #dc2626",
                  backgroundColor: "#fff",
                  color: "#dc2626",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>cancel</span>
                Kết thúc sớm
              </button>
            )}
          </div>
        </div>
      )}

      {/* Signing Button - For DRAFT and PENDING_SIGNATURE status */}
      {(contract.status === "DRAFT" || contract.status === "PENDING_SIGNATURE") && (
        <button
          onClick={() => setShowSigningModal(true)}
          style={{
            marginTop: "0.5rem",
            width: "100%",
            padding: "1rem",
            backgroundColor: "#0095c7",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0077a3"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#0095c7"}
        >
          {contract.status === "DRAFT" ? "Bắt đầu ký hợp đồng" : "Ký hợp đồng"}
        </button>
      )}

      {/* Payment Button - For PENDING_PAYMENT or SIGNED status */}
      {(contract.status === "PENDING_PAYMENT" || contract.status === "SIGNED") && (
        <div style={{ marginTop: "0.5rem" }}>
          <div style={{
            padding: "1rem 1.5rem",
            backgroundColor: "#fef3c7",
            borderRadius: "12px",
            border: "1px solid #fde047",
            color: "#854d0e",
            fontSize: "0.9rem",
            marginBottom: "1rem"
          }}>
            <strong>Hợp đồng đã ký thành công!</strong> Vui lòng thanh toán trong vòng 5 phút để kích hoạt hợp đồng.
          </div>
          <button
            onClick={() => navigate(`/contracts/${id}/payment`)}
            style={{
              width: "100%",
              padding: "1rem",
              backgroundColor: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#15803d"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#16a34a"}
          >
            Thanh toán ngay
          </button>
        </div>
      )}

      {/* Signing Modal */}
      {showSigningModal && (
        <ContractSigningModal
          contract={contract}
          onClose={() => setShowSigningModal(false)}
          onSignSuccess={reloadContract}
        />
      )}

      {/* Terminate Modal */}
      {showTerminateModal && (
        <TerminateContractModal
          contract={contract}
          onClose={() => setShowTerminateModal(false)}
          onSuccess={reloadContract}
        />
      )}

      {/* Extension Modal */}
      {showExtensionModal && (
        <ExtensionRequestModal
          contract={contract}
          onClose={() => setShowExtensionModal(false)}
          onSuccess={reloadContract}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <ReturnWarehouseModal
          contract={contract}
          onClose={() => setShowReturnModal(false)}
          onSuccess={reloadContract}
        />
      )}
    </div>
  );
};

const backBtnStyle = {
  padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0",
  backgroundColor: "#fff", color: "#64748b", fontWeight: 600,
  cursor: "pointer", fontSize: "0.88rem",
};

export default ContractDetail;
