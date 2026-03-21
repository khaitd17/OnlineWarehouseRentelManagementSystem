import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";
import ContractSigningModal from "../components/ContractSigningModal";

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

const Section = ({ title, children }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.2rem",
      paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
      {title}
    </h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.2rem" }}>
      {children}
    </div>
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

  const reloadContract = () => {
    setRefreshKey(k => k + 1);
  };

  useEffect(() => {
    rentalService.getContractById(id)
      .then(setContract)
      .catch((err) => {
        if (err.response?.status === 403) setError("Bạn không có quyền xem hợp đồng này.");
        else if (err.response?.status === 404) setError("Không tìm thấy hợp đồng.");
        else setError("Không thể tải thông tin hợp đồng.");
      })
      .finally(() => setLoading(false));
  }, [id, refreshKey]);

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
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
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
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginTop: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            📎 Tài liệu đính kèm từ chủ kho
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
                  🔗 Xem ảnh gốc
                </a>
              </div>
            </div>
          ) : (
            <a href={`http://localhost:5276${contract.contractImageUrl}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
              📄 Xem tài liệu đính kèm
            </a>
          )}
        </div>
      )}

      {/* Thông báo DRAFT */}
      {contract.status === "DRAFT" && (
        <div style={{ marginTop: "1rem", padding: "1rem 1.5rem", backgroundColor: "#fefce8",
          borderRadius: "12px", border: "1px solid #fde047", color: "#854d0e", fontSize: "0.9rem" }}>
          <strong>Hợp đồng đang chờ ký.</strong> Nhấn nút bên dưới để bắt đầu quy trình ký hợp đồng.
        </div>
      )}

      {/* PDF Links */}
      {(contract.contractFileUrl || contract.ownerSignedFileUrl || contract.signedFileUrl) && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginTop: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Tài liệu hợp đồng
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {/* Hợp đồng đã ký đầy đủ (cả owner + renter) */}
            {contract.signedFileUrl && (
              <a href={`http://localhost:5276${contract.signedFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#16a34a", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                ✅ Hợp đồng đã ký đầy đủ ({formatDate(contract.signedAt)})
              </a>
            )}
            {/* Hợp đồng đã ký bởi chủ kho (chờ người thuê ký) */}
            {!contract.signedFileUrl && contract.ownerSignedFileUrl && (
              <a href={`http://localhost:5276${contract.ownerSignedFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                📝 Hợp đồng đã ký bởi chủ kho ({formatDate(contract.ownerSignedAt)})
              </a>
            )}
            {/* Hợp đồng gốc (chưa ký) */}
            {!contract.signedFileUrl && !contract.ownerSignedFileUrl && contract.contractFileUrl && (
              <a href={`http://localhost:5276${contract.contractFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#64748b", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                📄 Hợp đồng gốc (chưa ký)
              </a>
            )}
          </div>
        </div>
      )}

      {/* Signing Button - For DRAFT and PENDING_SIGNATURE status */}
      {(contract.status === "DRAFT" || contract.status === "PENDING_SIGNATURE") && (
        <button
          onClick={() => setShowSigningModal(true)}
          style={{
            marginTop: "1rem",
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
          ✍️ {contract.status === "DRAFT" ? "Bắt đầu ký hợp đồng" : "Ký hợp đồng"}
        </button>
      )}

      {/* Payment Button - For PENDING_PAYMENT or SIGNED status */}
      {(contract.status === "PENDING_PAYMENT" || contract.status === "SIGNED") && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{
            padding: "1rem 1.5rem",
            backgroundColor: "#fef3c7",
            borderRadius: "12px",
            border: "1px solid #fde047",
            color: "#854d0e",
            fontSize: "0.9rem",
            marginBottom: "1rem"
          }}>
            <strong>⏰ Hợp đồng đã ký thành công!</strong> Vui lòng thanh toán trong vòng 5 phút để kích hoạt hợp đồng.
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
            💳 Thanh toán ngay
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
    </div>
  );
};

const backBtnStyle = {
  padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0",
  backgroundColor: "#fff", color: "#64748b", fontWeight: 600,
  cursor: "pointer", fontSize: "0.88rem",
};

export default ContractDetail;
