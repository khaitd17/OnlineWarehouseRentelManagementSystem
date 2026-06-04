import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";
import { useToast } from "../context/ToastContext";

const statusColors = {
  DRAFT: { bg: "#e0f2fe", color: "#0369a1", label: "Nháp" },
  PENDING: { bg: "#fef3c7", color: "#d97706", label: "Chờ duyệt" },
  APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
};

const RentalRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getRentalRequestById(id);
      setRequest(data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Không thể tải thông tin yêu cầu thuê"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu thuê này?")) return;
    setCancelLoading(true);
    try {
      await rentalService.cancelRentalRequest(id);
      showToast("Đã hủy yêu cầu thuê thành công!", "success");
      fetchDetail();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Có lỗi khi hủy yêu cầu", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const formatUtcDate = (dateStr) => {
    if (!dateStr) return "—";
    const utcStr = dateStr.endsWith("Z") ? dateStr : (dateStr + "Z");
    return new Date(utcStr).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "3rem", maxWidth: "700px", margin: "0 auto" }}>
        <div
          style={{
            color: "#dc2626",
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ marginTop: "1rem", ...linkBtnStyle }}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  if (!request) return null;

  const status = statusColors[request.status] || {
    bg: "#f1f5f9",
    color: "#64748b",
    label: request.status,
  };

  const isRenter = user?.userId === request.renterId;
  const canCancel =
    isRenter && (request.status === "DRAFT" || request.status === "PENDING" || request.status === "APPROVED");

  const pulse = request.status === "PENDING" ? " pulse" : "";

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 2rem", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .back-btn {
          display: inline-flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 8px 18px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          margin-bottom: 1.5rem;
        }
        .back-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateX(-3px);
        }
        .back-btn span {
          transition: transform 0.2s ease;
        }
        .back-btn:hover span {
          transform: translateX(-2px);
        }

        .req-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.03), 0 1px 3px rgba(15, 23, 42, 0.02);
          border: 1px solid #f1f5f9;
          animation: cardSlideUp 0.35s ease-out;
        }

        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid currentColor;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
        }
        
        .status-dot.pulse {
          animation: statusGlow 1.5s infinite alternate;
        }
        
        @keyframes statusGlow {
          0% { box-shadow: 0 0 0 0px currentColor; opacity: 0.6; }
          100% { box-shadow: 0 0 8px 3px currentColor; opacity: 1; }
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 640px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
        }

        .info-card {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 1.2rem 1.4rem;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.22s ease;
        }
        .info-card:hover {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
          transform: translateY(-2px);
        }
        .info-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #f0f9ff;
          color: #0ea5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.22s ease;
        }
        
        .info-card:hover .info-icon-wrapper {
          background: #0ea5e9;
          color: #ffffff;
        }

        .note-card {
          margin-top: 1.5rem;
          padding: 1.2rem 1.5rem;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          border-left: 4px solid #94a3b8;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .contract-banner {
          margin-top: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 18px;
          border: 1px solid #bbf7d0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .contract-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #15803d;
          font-weight: 700;
          text-decoration: none;
          padding: 0.7rem 1.4rem;
          background: #ffffff;
          border-radius: 12px;
          border: 1.5px solid #16a34a;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.06);
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }
        .contract-btn:hover {
          background: #16a34a;
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.18);
          transform: translateY(-2px);
        }

        .reject-banner {
          margin-top: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-radius: 18px;
          border: 1px solid #fecaca;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .cancel-section {
          margin-top: 2.5rem;
          border-top: 1px dashed #e2e8f0;
          padding-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        
        .cancel-btn {
          padding: 0.75rem 1.6rem;
          border-radius: 12px;
          border: none;
          background: #ef4444;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.92rem;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.2);
          transition: all 0.2s ease;
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .cancel-btn:hover:not(:disabled) {
          background: #dc2626;
          box-shadow: 0 6px 22px rgba(220, 38, 38, 0.3);
          transform: translateY(-2px);
        }
        .cancel-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>

      {/* Nút Quay lại */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '6px' }}>arrow_back</span>
        Quay lại
      </button>

      {/* Card nội dung chính */}
      <div className="req-card">
        {/* Header chi tiết */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1.2rem",
            marginBottom: "2.2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Yêu cầu thuê #{request.requestId}
            </h1>
            <p style={{ color: "#64748b", marginTop: "0.4rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_today</span>
              Ngày tạo: {formatUtcDate(request.createdAt)}
            </p>
          </div>
          <span
            className="status-badge"
            style={{
              backgroundColor: status.bg,
              color: status.color,
            }}
          >
            <span className={`status-dot${pulse}`} />
            {status.label}
          </span>
        </div>

        {/* Lưới chi tiết thông tin */}
        <div className="info-grid">
          <InfoCard label="Mã kho" value={`#${request.warehouseId}`} icon="tag" iconBg="#f0fdfa" iconColor="#0d9488" />
          <InfoCard label="Tên kho" value={request.warehouseName || "—"} icon="warehouse" iconBg="#eff6ff" iconColor="#1d4ed8" />
          <InfoCard label="Diện tích thuê" value={`${request.requestedArea} m²`} icon="aspect_ratio" iconBg="#fdf2f8" iconColor="#db2777" />
          <InfoCard label="Thời hạn" value={`${request.durationMonths} tháng`} icon="schedule" iconBg="#fff7ed" iconColor="#ea580c" />
          <InfoCard label="Ngày bắt đầu" value={formatDate(request.startDate)} icon="event" iconBg="#f5f3ff" iconColor="#7c3aed" />
          <InfoCard label="Địa chỉ kho" value={request.warehouseAddress || "—"} icon="location_on" iconBg="#fff1f2" iconColor="#e11d48" span2 />
        </div>

        {/* Ghi chú */}
        {request.notes && (
          <div className="note-card">
            <span className="material-symbols-outlined" style={{ color: "#64748b", fontSize: "20px", marginTop: "2px" }}>sticky_note_2</span>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "4px" }}>
                Ghi chú của người thuê
              </div>
              <p style={{ color: "#334155", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
                {request.notes}
              </p>
            </div>
          </div>
        )}

        {/* Hợp đồng đính kèm khi được chấp nhận */}
        {request.status === "APPROVED" && request.contractImageUrl && (
          <div className="contract-banner">
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#16a34a" }}>verified_user</span>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#14532d", margin: 0 }}>
                  Hợp đồng thuê đã sẵn sàng
                </h3>
                <p style={{ color: "#166534", margin: "2px 0 0", fontSize: "0.85rem" }}>
                  Bản nháp hợp đồng đã được thiết lập bởi chủ kho.
                </p>
              </div>
            </div>
            <a
              href={`http://localhost:5276${request.contractImageUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="contract-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>description</span>
              Xem hợp đồng
            </a>
          </div>
        )}

        {/* Lý do từ chối */}
        {request.status === "REJECTED" && request.rejectionReason && (
          <div className="reject-banner">
            <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#dc2626", marginTop: "2px" }}>error</span>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#7f1d1d", margin: 0 }}>
                Yêu cầu bị từ chối
              </h3>
              <p style={{ color: "#991b1b", margin: "4px 0 0", fontSize: "0.92rem", lineHeight: 1.5 }}>
                {request.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* Thông tin người duyệt */}
        {request.reviewedAt && (
          <div
            style={{
              marginTop: "1.5rem",
              color: "#94a3b8",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f8fafc",
              padding: "8px 16px",
              borderRadius: "10px",
              width: "fit-content",
              border: "1px solid #f1f5f9"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>assignment_ind</span>
            <span>
              Người duyệt: <strong>{request.reviewedByName || `User #${request.reviewedBy}`}</strong> — {formatUtcDate(request.reviewedAt)}
            </span>
          </div>
        )}

        {/* Nút hủy yêu cầu */}
        {canCancel && (
          <div className="cancel-section">
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="cancel-btn"
            >
              {cancelLoading ? (
                <>
                  <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite", fontSize: "20px" }}>sync</span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>cancel</span>
                  Hủy yêu cầu thuê
                </>
              )}
            </button>
            {request.status === "APPROVED" && (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.82rem",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
                Bạn có thể hủy nếu không đồng ý với mức giá đã đưa ra.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ label, value, icon, iconBg = "#f0f9ff", iconColor = "#0284c7", span2 = false }) => (
  <div className="info-card" style={{ gridColumn: span2 ? "1 / -1" : undefined }}>
    <div className="info-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>
        {value}
      </div>
    </div>
  </div>
);

const linkBtnStyle = {
  background: "none",
  border: "none",
  color: "#0095c7",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
  padding: 0,
};

export default RentalRequestDetail;
