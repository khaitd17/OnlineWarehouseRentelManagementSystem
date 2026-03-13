import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";

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
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
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
  };

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu thuê này?")) return;
    setCancelLoading(true);
    try {
      await rentalService.cancelRentalRequest(id);
      alert("Đã hủy yêu cầu thuê thành công!");
      fetchDetail();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi khi hủy yêu cầu");
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
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

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 2rem" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          ...linkBtnStyle,
          marginBottom: "1.5rem",
        }}
      >
        ← Quay lại
      </button>

      {/* Header */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "20px",
          padding: "2rem 2.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Yêu cầu thuê #{request.requestId}
            </h1>
            <p style={{ color: "#64748b", marginTop: "0.3rem" }}>
              Ngày tạo: {formatDate(request.createdAt)}
            </p>
          </div>
          <span
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              backgroundColor: status.bg,
              color: status.color,
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.2rem 2rem",
          }}
        >
          <InfoItem label="Mã kho" value={`#${request.warehouseId}`} />
          <InfoItem label="Tên kho" value={request.warehouseName || "—"} />
          <InfoItem label="Địa chỉ kho" value={request.warehouseAddress || "—"} />
          <InfoItem label="Diện tích thuê" value={`${request.requestedArea} m²`} />
          <InfoItem label="Ngày bắt đầu" value={formatDate(request.startDate)} />
          <InfoItem label="Thời hạn" value={`${request.durationMonths} tháng`} />
        </div>

        {request.notes && (
          <div style={{ marginTop: "1.2rem" }}>
            <InfoItem label="Ghi chú" value={request.notes} />
          </div>
        )}

        {/* Contract image section - shown when approved */}
        {request.status === "APPROVED" && request.contractImageUrl && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1.2rem 1.5rem",
              backgroundColor: "#f0fdf4",
              borderRadius: "14px",
              border: "1px solid #bbf7d0",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#16a34a",
                marginBottom: "0.8rem",
                marginTop: 0,
              }}
            >
              Hợp đồng thuê
            </h3>
            <a
              href={`http://localhost:5276${request.contractImageUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                color: "#0095c7",
                fontWeight: 600,
                textDecoration: "none",
                padding: "0.6rem 1.2rem",
                backgroundColor: "#fff",
                borderRadius: "10px",
                border: "1px solid #0095c7",
              }}
            >
              📄 Xem hợp đồng
            </a>
          </div>
        )}

        {/* Rejection reason */}
        {request.status === "REJECTED" && request.rejectionReason && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1.2rem 1.5rem",
              backgroundColor: "#fef2f2",
              borderRadius: "14px",
              border: "1px solid #fecaca",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#dc2626",
                marginBottom: "0.4rem",
                marginTop: 0,
              }}
            >
              Lý do từ chối
            </h3>
            <p style={{ color: "#7f1d1d", margin: 0, fontSize: "0.92rem" }}>
              {request.rejectionReason}
            </p>
          </div>
        )}

        {/* Review info */}
        {request.reviewedAt && (
          <div
            style={{
              marginTop: "1.2rem",
              color: "#94a3b8",
              fontSize: "0.85rem",
            }}
          >
            Duyệt bởi: {request.reviewedByName || `User #${request.reviewedBy}`}{" "}
            — {formatDate(request.reviewedAt)}
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <div style={{ marginTop: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              style={{
                padding: "0.7rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                backgroundColor: cancelLoading ? "#94a3b8" : "#ef4444",
                color: "#fff",
                fontWeight: 700,
                cursor: cancelLoading ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
              }}
            >
              {cancelLoading ? "Đang xử lý..." : "Hủy yêu cầu thuê"}
            </button>
            {request.status === "APPROVED" && (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.82rem",
                  marginTop: "0.5rem",
                }}
              >
                Bạn có thể hủy nếu không đồng ý với mức giá đã đưa ra.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, valueColor, valueBold }) => (
  <div>
    <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
      {label}
    </div>
    <div
      style={{
        fontSize: "0.95rem",
        color: valueColor || "#0f172a",
        fontWeight: valueBold ? 700 : 500,
      }}
    >
      {value}
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
