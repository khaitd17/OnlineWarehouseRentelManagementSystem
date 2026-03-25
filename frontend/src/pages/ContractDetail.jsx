import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";
import ratingService from "../services/ratingService";
import ContractSigningModal from "../components/ContractSigningModal";

const statusConfig = {
  DRAFT:      { bg: "#f1f5f9", color: "#64748b", label: "Chờ ký" },
  PENDING_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  ACTIVE:     { bg: "#dcfce7", color: "#16a34a", label: "Đang hiệu lực" },
  EXPIRED:    { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  TERMINATED: { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
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
  const [existingRating, setExistingRating] = useState(null);
  const [ratingForm, setRatingForm] = useState({ star: 5, comment: '' });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMsg, setRatingMsg] = useState(null);
  const [showThankPopup, setShowThankPopup] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [hoveredStar, setHoveredStar] = useState(0);
  const imageInputRef = React.useRef(null);

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

  // Fetch existing rating for this contract
  useEffect(() => {
    if (contract && contract.contractId) {
      ratingService.getMyRatings()
        .then(ratings => {
          const found = ratings.find(r => r.contractId === contract.contractId);
          if (found) setExistingRating(found);
        })
        .catch(() => {});
    }
  }, [contract]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setUploadedImages(prev => [...prev, ...newImages].slice(0, 5));
    e.target.value = '';
  };

  const removeImage = (index) => {
    setUploadedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitRating = async () => {
    if (!contract) return;
    setRatingSubmitting(true);
    try {
      await ratingService.createRating({
        warehouseId: contract.warehouseId,
        contractId: contract.contractId,
        star: ratingForm.star,
        comment: ratingForm.comment
      });
      setShowThankPopup(true);
      // Reload rating
      const ratings = await ratingService.getMyRatings();
      const found = ratings.find(r => r.contractId === contract.contractId);
      if (found) setExistingRating(found);
      setUploadedImages([]);
    } catch (err) {
      setRatingMsg({ type: 'error', text: err.response?.data?.message || err.response?.data || 'Lỗi khi gửi đánh giá' });
      setTimeout(() => setRatingMsg(null), 4000);
    } finally {
      setRatingSubmitting(false);
    }
  };

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

      {/* ── Thank You Popup ── */}
      {showThankPopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 8px 20px rgba(245,158,11,0.15)',
            border: '1px solid rgba(253,230,138,0.6)',
            animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            position: 'relative',
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowThankPopup(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: '#64748b', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.12)'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#64748b'; }}
            >✕</button>

            {/* Animated star burst */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                {[1,2,3,4,5].map((s, i) => (
                  <svg key={s} width="28" height="28" viewBox="0 0 24 24" fill="#f59e0b"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.5))', animation: `starPop 0.4s ${i * 0.08}s both` }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
            </div>

            {/* Check icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.2rem auto',
              boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', lineHeight: 1.3 }}>
              Cảm ơn bạn đã đánh giá về kho chúng tôi!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
              Đánh giá của bạn giúp chúng tôi không ngừng cải thiện chất lượng dịch vụ. Rất trân trọng ý kiến đóng góp của bạn! 🙏
            </p>

            <button
              onClick={() => setShowThankPopup(false)}
              style={{
                padding: '12px 40px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.4)'; }}
            >
              Đóng
            </button>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes starPop { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 60% { transform: scale(1.3) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
          `}</style>
        </div>
      )}

      {/* ── Rating Section (for ACTIVE/EXPIRED contracts) ── */}
      {(contract.status === 'ACTIVE' || contract.status === 'EXPIRED') && (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem 2rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem',
            paddingBottom: '0.8rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" style={{ flexShrink: 0 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Đánh giá kho bãi
          </h2>

          {ratingMsg && (
            <div style={{ padding: '10px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600,
              backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {ratingMsg.text}
            </div>
          )}

          {existingRating ? (
            <div style={{ padding: '1.2rem', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>Đánh giá của bạn</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="18" height="18" viewBox="0 0 24 24"
                      fill={s <= existingRating.star ? '#f59e0b' : 'none'}
                      stroke={s <= existingRating.star ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth="1.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              {existingRating.comment && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p style={{ color: '#78716c', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{existingRating.comment}</p>
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Đã đánh giá ngày {existingRating.createdAt ? new Date(existingRating.createdAt).toLocaleDateString('vi-VN') : ''}
              </div>
              {existingRating.ownerReply && (
                <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Phản hồi từ chủ kho
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0 }}>{existingRating.ownerReply}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Star selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chọn số sao</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRatingForm(f => ({ ...f, star: s }))}
                      onMouseEnter={() => setHoveredStar(s)}
                      onMouseLeave={() => setHoveredStar(0)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                        transform: (hoveredStar >= s || ratingForm.star >= s) ? 'scale(1.18)' : 'scale(1)',
                        transition: 'transform 0.14s ease',
                        lineHeight: 1,
                      }}
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24"
                        fill={s <= (hoveredStar || ratingForm.star) ? '#f59e0b' : 'none'}
                        stroke={s <= (hoveredStar || ratingForm.star) ? '#f59e0b' : '#cbd5e1'}
                        strokeWidth="1.5"
                        style={{ filter: s <= (hoveredStar || ratingForm.star) ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.45))' : 'none', transition: 'all 0.14s' }}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>
                    {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][hoveredStar || ratingForm.star]}
                  </span>
                </div>
              </div>

              {/* Comment with icon */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Nhận xét (tùy chọn)
                </label>
                <div style={{ position: 'relative' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: 'absolute', top: '14px', left: '14px', pointerEvents: 'none' }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <textarea
                    value={ratingForm.comment}
                    onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))}
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm thuê kho của bạn..."
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px',
                      borderRadius: '12px', border: '1.5px solid #e2e8f0',
                      resize: 'vertical', fontSize: '0.9rem', outline: 'none',
                      boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                      color: '#0f172a', lineHeight: 1.6,
                      fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Image upload */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Hình ảnh đính kèm (tối đa 5 ảnh)
                </label>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />

                {/* Upload button */}
                {uploadedImages.length < 5 && (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 20px',
                      border: '2px dashed #e2e8f0', borderRadius: '12px',
                      background: '#f8fafc', color: '#64748b',
                      cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                      transition: 'all 0.2s',
                      marginBottom: uploadedImages.length > 0 ? '12px' : '0',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#d97706'; e.currentTarget.style.background = '#fffbeb'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Tải ảnh lên ({uploadedImages.length}/5)
                  </button>
                )}

                {/* Image previews */}
                {uploadedImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {uploadedImages.map((img, i) => (
                      <div key={i} style={{
                        position: 'relative', width: '90px', height: '90px',
                        borderRadius: '10px', overflow: 'hidden',
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        flexShrink: 0,
                      }}>
                        <img
                          src={img.preview}
                          alt={img.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          onClick={() => removeImage(i)}
                          style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: 'rgba(0,0,0,0.6)', border: 'none',
                            borderRadius: '50%', width: '22px', height: '22px',
                            cursor: 'pointer', color: '#fff', fontSize: '0.7rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.85)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmitRating}
                disabled={ratingSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 32px',
                  background: ratingSubmitting ? '#e2e8f0' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: ratingSubmitting ? '#94a3b8' : '#fff',
                  border: 'none', borderRadius: '12px',
                  fontWeight: 700, cursor: ratingSubmitting ? 'wait' : 'pointer',
                  fontSize: '0.95rem',
                  boxShadow: ratingSubmitting ? 'none' : '0 4px 14px rgba(245,158,11,0.35)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!ratingSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.5)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ratingSubmitting ? 'none' : '0 4px 14px rgba(245,158,11,0.35)'; }}
              >
                {ratingSubmitting ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Gửi đánh giá
                  </>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
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
