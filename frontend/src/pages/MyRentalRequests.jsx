import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import rentalService from "../services/rentalService";
import warehouseService from "../services/warehouseService";
import axiosClient from "../services/axiosClient";
import CancelRequestButton from "../components/CancelRequestButton";
import ProposedZonePreviewModal from "../components/warehouse/ProposedZonePreviewModal";

const statusConfig = {
  DRAFT:     { bg: "#e0f2fe", color: "#0369a1", accent: "#0ea5e9", label: "Nháp" },
  PENDING:   { bg: "#fef3c7", color: "#92400e", accent: "#f59e0b", label: "Chờ duyệt" },
  APPROVED:  { bg: "#dcfce7", color: "#166534", accent: "#22c55e", label: "Đã duyệt" },
  REJECTED:  { bg: "#fee2e2", color: "#991b1b", accent: "#ef4444", label: "Từ chối" },
  CANCELLED: { bg: "#f1f5f9", color: "#475569", accent: "#94a3b8", label: "Đã hủy" },
  NEGOTIATING:          { bg: "#dbeafe", color: "#2563eb", accent: "#3b82f6", label: "Đang đàm phán" },
  REVISION_REQUESTED:   { bg: "#fef3c7", color: "#d97706", accent: "#f59e0b", label: "Yêu cầu chỉnh sửa" },
  APPROVED_FOR_SIGNING: { bg: "#dcfce7", color: "#16a34a", accent: "#22c55e", label: "Sẵn sàng ký" },
  PENDING_OWNER_SIGNATURE:  { bg: "#dbeafe", color: "#1e40af", accent: "#3b82f6", label: "Chờ chủ kho ký" },
  PENDING_RENTER_SIGNATURE: { bg: "#fef3c7", color: "#92400e", accent: "#f59e0b", label: "Chờ người thuê ký" },
  PENDING_SIGNATURE:        { bg: "#fef3c7", color: "#92400e", accent: "#f59e0b", label: "Chờ xác thực ký" },
  SIGNED:            { bg: "#dbeafe", color: "#1e40af", accent: "#3b82f6", label: "Đã ký" },
  PENDING_PAYMENT:   { bg: "#fef3c7", color: "#92400e", accent: "#f59e0b", label: "Chờ thanh toán" },
  PAYMENT_FAILED:    { bg: "#fee2e2", color: "#991b1b", accent: "#ef4444", label: "Thanh toán thất bại" },
  ACTIVE:            { bg: "#dcfce7", color: "#166534", accent: "#22c55e", label: "Đang hiệu lực" },
  CLOSED:            { bg: "#f1f5f9", color: "#475569", accent: "#94a3b8", label: "Đã đóng" },
  TERMINATED:        { bg: "#f1f5f9", color: "#475569", accent: "#94a3b8", label: "Đã kết thúc" },
  PENDING_CLOSE:     { bg: "#fef3c7", color: "#92400e", accent: "#f59e0b", label: "Chờ đóng" },
  PENDING_TERMINATION: { bg: "#fef3c7", color: "#92400e", accent: "#f59e0b", label: "Chờ kết thúc" },
  EXPIRED:           { bg: "#fee2e2", color: "#991b1b", accent: "#ef4444", label: "Đã hết hạn" },
  CANCELLED_BY_USER: { bg: "#f1f5f9", color: "#475569", accent: "#94a3b8", label: "Đã hủy" },
  CANCELLED_BY_OWNER:{ bg: "#f1f5f9", color: "#475569", accent: "#94a3b8", label: "Chủ kho hủy" },
  CANCELLED_NO_PAYMENT: { bg: "#f1f5f9", color: "#475569", accent: "#94a3b8", label: "Hủy - Không thanh toán" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const MyRentalRequests = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zonePreview, setZonePreview] = useState(null);

  const openZonePreview = async (req) => {
    try {
      const [warehouse, areasRes] = await Promise.all([
        warehouseService.getWarehouseById(req.warehouseId),
        axiosClient.get(`/RentalAreas/warehouse/${req.warehouseId}`),
      ]);
      setZonePreview({ request: req, warehouseData: warehouse, areas: areasRes.data || [] });
    } catch (err) {
      showToast('Không thể tải bản đồ khu vực.', 'error');
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getMyRentalRequests();
      const filteredRequests = data.filter(req => {
        const cStatus = req.contractStatus;
        return !['ACTIVE', 'CLOSED', 'TERMINATED', 'EXPIRED'].includes(cStatus);
      });
      setRequests(filteredRequests);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách yêu cầu thuê");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e, requestId) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn gửi yêu cầu này đến chủ kho?")) return;
    try {
      await rentalService.sendRentalRequest(requestId);
      fetchRequests();
      showToast("Gửi yêu cầu thuê thành công!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu", "error");
    }
  };

  return (
    <div style={{ padding: "0 2rem 3rem", maxWidth: 1100, margin: "0 auto", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes cardIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .rr-card { transition: all 0.25s cubic-bezier(.4,0,.2,1); }
        .rr-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06) !important; }
        .rr-btn { transition: all 0.18s ease; }
        .rr-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .rr-btn:active { transform: translateY(0); }
      `}</style>

      {/* ── Hero Header ── */}
      <div style={{
        margin: "0 -2rem 32px -2rem",
        padding: "36px 40px 32px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
        borderRadius: "0 0 24px 24px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative shapes */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(14,165,233,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(14,165,233,0.05)" }} />
        <div style={{ position: "absolute", top: 10, right: 140, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <h1 style={{
          fontSize: "1.85rem", fontWeight: 800, color: "#fff", margin: "0 0 8px",
          letterSpacing: "-0.02em", position: "relative",
        }}>
          Yêu cầu thuê của tôi
        </h1>
        <p style={{ color: "rgba(148,163,184,0.9)", margin: 0, fontSize: "0.92rem", position: "relative" }}>
          Theo dõi trạng thái các yêu cầu thuê kho
        </p>
        {/* Stats */}
        {!loading && requests.length > 0 && (
          <div style={{ display: "flex", gap: 24, marginTop: 20, position: "relative" }}>
            {[
              { label: "Tổng yêu cầu", value: requests.length },
              { label: "Chờ duyệt", value: requests.filter(r => r.status === "PENDING").length },
              { label: "Đã duyệt", value: requests.filter(r => r.status === "APPROVED").length },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: "10px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{stat.value}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(148,163,184,0.8)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
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
            margin: "0 auto 20px", fontSize: "1.8rem", fontWeight: 900, color: "#0ea5e9",
          }}>?</div>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>
            Chưa có yêu cầu thuê nào
          </p>
          <p style={{ fontSize: "0.88rem", color: "#94a3b8", margin: "0 0 24px" }}>
            Hãy tìm kho phù hợp và gửi yêu cầu thuê
          </p>
          <button
            className="rr-btn"
            onClick={() => navigate("/search")}
            style={{
              padding: "13px 32px", borderRadius: 12,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "#fff", border: "none", fontWeight: 700,
              cursor: "pointer", fontSize: "0.95rem",
              boxShadow: "0 6px 20px rgba(14,165,233,0.35)",
            }}
          >
            Tìm kho ngay
          </button>
        </div>
      )}

      {/* ── Cards ── */}
      {!loading && requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {requests.map((req, idx) => {
            const displayStatus = req.contractStatus || req.status;
            const s = statusConfig[displayStatus] || { bg: "#f1f5f9", color: "#475569", accent: "#94a3b8", label: displayStatus };
            const cancelledStatuses = ["CANCELLED", "CANCELLED_BY_USER", "CANCELLED_BY_OWNER", "CANCELLED_NO_PAYMENT"];
            const isFullyCancelled = cancelledStatuses.includes(req.status) || cancelledStatuses.includes(req.contractStatus || "");
            const isCardDisabled = req.status === "PENDING" || req.status === "APPROVED" || isFullyCancelled || req.status === "REJECTED";

            return (
              <div
                key={req.requestId}
                className="rr-card"
                onClick={() => { if (!isCardDisabled) navigate(`/rental-request/${req.requestId}`); }}
                style={{
                  background: "#fff", borderRadius: 18,
                  overflow: "hidden",
                  cursor: isFullyCancelled || req.status === "REJECTED" ? "default" : isCardDisabled ? "default" : "pointer",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
                  border: "1px solid #eef1f6",
                  animation: `cardIn 0.4s ease ${idx * 0.06}s both`,
                  opacity: isFullyCancelled ? 0.65 : 1,
                }}
              >
                {/* Card top accent bar */}
                <div style={{
                  height: 4,
                  background: `linear-gradient(90deg, ${s.accent}, ${s.accent}88, transparent)`,
                }} />

                <div style={{ padding: "22px 28px 24px" }}>
                  {/* Row 1: Header */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: 16, marginBottom: 18,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 800,
                          color: s.accent, letterSpacing: "0.08em", textTransform: "uppercase",
                        }}>
                          YC-{req.requestId}
                        </span>
                        <span style={{
                          padding: "4px 14px", borderRadius: 20,
                          backgroundColor: s.bg, color: s.color,
                          fontSize: "0.75rem", fontWeight: 700,
                          border: `1.5px solid ${s.accent}30`,
                        }}>
                          {s.label}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: "1.18rem", fontWeight: 800, color: "#0f172a",
                        margin: 0, letterSpacing: "-0.01em",
                      }}>
                        {req.warehouseName}
                      </h3>
                    </div>
                    <div style={{
                      textAlign: "right", flexShrink: 0,
                      padding: "8px 14px", borderRadius: 10,
                      background: "#f8fafc", border: "1px solid #f1f5f9",
                    }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ngày tạo</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>{formatDate(req.createdAt)}</div>
                      {req.reviewedAt && (
                        <>
                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 6 }}>Duyệt</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>{formatDate(req.reviewedAt)}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Info chips */}
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18,
                  }}>
                    {[
                      { label: "Địa chỉ", value: req.warehouseAddress },
                      { label: "Diện tích yêu cầu", value: `${req.requestedArea} m²` },
                      req.isCustomArea
                        ? (() => {
                            const hasAdditional = !!req.additionalZonesJson;
                            let zoneDesc = `${req.proposedWidth}m × ${req.proposedLength}m`;
                            if (req.hasExtensionZone) zoneDesc += ` + ${req.extensionWidth}m × ${req.extensionLength}m`;
                            if (hasAdditional) {
                              try {
                                const addZones = JSON.parse(req.additionalZonesJson);
                                zoneDesc = `${1 + addZones.length} vùng — Tổng ${req.requestedArea} m²`;
                              } catch(e) {}
                            }
                            return {
                              label: req.isOwnerAssigned ? "Khu vực chủ kho đã sắp xếp" : "Khu vực người thuê tự vẽ",
                              value: zoneDesc,
                              customZone: !req.isOwnerAssigned,
                              highlighted: !!req.isOwnerAssigned,
                            };
                          })()
                        : (req.rentalAreaName ? { label: "Ô khu đã chọn", value: `${req.rentalAreaName} — ${req.rentalAreaSize} m²`, highlighted: true } : null),
                      { label: "Bắt đầu", value: formatDate(req.startDate) },
                      { label: "Thời hạn", value: `${req.durationMonths} tháng` },
                    ].filter(Boolean).map(item => (
                      <div key={item.label} style={{
                        padding: "8px 14px", borderRadius: 10,
                        background: item.customZone ? "#fffbeb" : item.highlighted ? "#f0fdf4" : "#f8fafc",
                        border: item.customZone ? "1px solid #fde68a" : item.highlighted ? "1px solid #86efac" : "1px solid #f1f5f9",
                        display: "flex", flexDirection: "column", gap: 4,
                        flex: (item.label === "Địa chỉ" || item.customZone) ? "1 1 100%" : "0 0 auto",
                        minWidth: item.customZone ? undefined : 120,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: item.customZone ? "#b45309" : item.highlighted ? "#15803d" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                              Xem bản đồ vị trí
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: item.customZone ? "#92400e" : item.highlighted ? "#166534" : "#334155" }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {req.notes && (
                    <div style={{
                      padding: "12px 16px", marginBottom: 16,
                      background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                      borderRadius: 10, borderLeft: "4px solid #f59e0b",
                      fontSize: "0.85rem", color: "#92400e", lineHeight: 1.6,
                    }}>
                      <span style={{ fontWeight: 700 }}>Ghi chú: </span>{req.notes}
                    </div>
                  )}

                  {/* ── Status Actions ── */}

                  {/* APPROVED — check contractStatus to determine what to show */}
                  {req.status === "APPROVED" && (() => {
                    const cs = req.contractStatus || "";
                    const isCancelled = ["CANCELLED", "CANCELLED_BY_USER", "CANCELLED_BY_OWNER", "CANCELLED_NO_PAYMENT"].includes(cs);
                    const isDeclined = cs === "REJECTED";

                    if (isCancelled) {
                      return (
                        <div style={{
                          background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                          border: "1px solid #e2e8f0",
                          borderRadius: 14, padding: "16px 22px",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          flexWrap: "wrap", gap: 12,
                        }}>
                          <div>
                            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                              Hợp đồng đã bị hủy
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                              Bạn có thể tìm kho khác phù hợp hơn.
                            </div>
                          </div>
                          <button
                            className="rr-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.scrollTo(0, 0);
                              navigate("/search");
                            }}
                            style={{
                              padding: "11px 24px", borderRadius: 10, border: "none",
                              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                              color: "#fff", fontWeight: 700, cursor: "pointer",
                              fontSize: "0.88rem", whiteSpace: "nowrap",
                              boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
                            }}
                          >
                            Tìm kho mới
                          </button>
                        </div>
                      );
                    }

                    if (isDeclined) {
                      return (
                        <div style={{
                          background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                          border: "1px solid #fca5a5",
                          borderRadius: 14, padding: "16px 22px",
                        }}>
                          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#991b1b", marginBottom: 2 }}>
                            Bạn đã từ chối hợp đồng này
                          </div>
                          <div style={{ fontSize: "0.82rem", color: "#b91c1c" }}>
                            Hợp đồng không còn hiệu lực.
                          </div>
                        </div>
                      );
                    }

                    // Normal APPROVED — contract still valid, show sign button
                    return (
                      <div style={{
                        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                        border: "1px solid #86efac",
                        borderRadius: 14, padding: "16px 22px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        flexWrap: "wrap", gap: 12,
                      }}>
                        <div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#166534", marginBottom: 2 }}>
                            Hợp đồng đã được tạo
                          </div>
                          <div style={{ fontSize: "0.82rem", color: "#15803d" }}>
                            Chủ kho đã gửi đề xuất — chờ bạn ký xác nhận.
                          </div>
                        </div>
                        <button
                          className="rr-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (req.contractId) navigate(`/contracts/${req.contractId}`);
                            else showToast("Không tìm thấy hợp đồng.", "warning");
                          }}
                          style={{
                            padding: "11px 24px", borderRadius: 10, border: "none",
                            background: "linear-gradient(135deg, #16a34a, #15803d)",
                            color: "#fff", fontWeight: 700, cursor: "pointer",
                            fontSize: "0.88rem", whiteSpace: "nowrap",
                            boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
                          }}
                        >
                          Xem và ký hợp đồng →
                        </button>
                      </div>
                    );
                  })()}

                  {/* REJECTED */}
                  {req.status === "REJECTED" && (
                    <div style={{
                      background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                      border: "1px solid #fca5a5",
                      borderRadius: 14, padding: "16px 22px",
                    }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>
                        Yêu cầu bị từ chối
                      </div>
                      {req.rejectionReason && (
                        <div style={{ color: "#b91c1c", fontSize: "0.85rem", lineHeight: 1.6 }}>
                          Lý do: {req.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PENDING */}
                  {req.status === "PENDING" && (
                    <div
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        flexWrap: "wrap", gap: 12,
                        padding: "14px 20px",
                        background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                        borderRadius: 12, border: "1px solid #fde68a",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#92400e" }}>
                          Đang chờ chủ kho xem xét
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#b45309", marginTop: 2, animation: "pulse 2s ease-in-out infinite" }}>
                          Thời gian duyệt thường từ 1-3 ngày làm việc
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <CancelRequestButton
                          requestId={req.requestId}
                          requestStatus={req.status}
                          onCancelSuccess={() => fetchRequests()}
                          variant="button"
                        />
                      </div>
                    </div>
                  )}

                  {/* DRAFT */}
                  {req.status === "DRAFT" && (
                    <button
                      className="rr-btn"
                      onClick={(e) => handleSend(e, req.requestId)}
                      style={{
                        padding: "11px 28px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                        color: "#fff", fontWeight: 700, cursor: "pointer",
                        fontSize: "0.88rem",
                        boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
                      }}
                    >
                      Gửi đến chủ kho
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {zonePreview && (
        <ProposedZonePreviewModal
          open={!!zonePreview}
          onClose={() => setZonePreview(null)}
          request={zonePreview.request}
          warehouseData={zonePreview.warehouseData}
          areas={zonePreview.areas}
        />
      )}
    </div>
  );
};

export default MyRentalRequests;
