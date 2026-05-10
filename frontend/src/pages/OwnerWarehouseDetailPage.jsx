import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/axiosClient";
import ratingService from "../services/ratingService";
import RentalAreaManagement from "../components/warehouse/RentalAreaManagement";
import WarehouseFloorPlanView from "../components/warehouse/WarehouseFloorPlanView";

// ─── Status helpers ────────────────────────────────────────────────────────
const STATUS_BADGE = {
  APPROVED:  { bg: "#dcfce7", color: "#166534", label: "Đã Phê Duyệt" },
  PENDING:   { bg: "#fef9c3", color: "#854d0e", label: "Đang Chờ Duyệt" },
  REJECTED:  { bg: "#fee2e2", color: "#991b1b", label: "Bị Từ Chối" },
  HIDDEN:    { bg: "#f1f5f9", color: "#475569", label: "Chưa Duyệt" },
  DELETED:   { bg: "#f9fafb", color: "#9ca3af", label: "Đã Xóa" },
};

const getStatusBadge = (status) => {
  const s = STATUS_BADGE[status?.toUpperCase()] || { bg: "#f1f5f9", color: "#475569", label: status || "Không rõ" };
  return (
    <span style={{ padding: "4px 14px", background: s.bg, color: s.color, borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const AREA_STATUS_BADGE = (isRented) => isRented
  ? <span style={{ padding: "2px 10px", background: "#fee2e2", color: "#b91c1c", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Đã thuê</span>
  : <span style={{ padding: "2px 10px", background: "#dcfce7", color: "#166534", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>Trống</span>;

const CONTRACT_STATUS = {
  ACTIVE:              { bg: "#dcfce7", color: "#166534", label: "Hiệu lực" },
  PENDING:             { bg: "#fef9c3", color: "#854d0e", label: "Chờ ký" },
  EXPIRED:             { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  CANCELLED:           { bg: "#fee2e2", color: "#991b1b", label: "Đã hủy" },
  CANCELLED_BY_USER:   { bg: "#fee2e2", color: "#dc2626", label: "Người dùng hủy" },
  CANCELLED_BY_OWNER:  { bg: "#fee2e2", color: "#dc2626", label: "Chủ kho hủy" },
  CANCELLED_NO_PAYMENT:{ bg: "#f1f5f9", color: "#64748b", label: "Hủy - Không TT" },
  TERMINATED:          { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
  COMPLETED:           { bg: "#e0f2fe", color: "#0284c7", label: "Đã hoàn thành" },
  CLOSED:              { bg: "#f1f5f9", color: "#64748b", label: "Đã đóng" },
  DRAFT:               { bg: "#f1f5f9", color: "#64748b", label: "Bản nháp" },
  SIGNED:              { bg: "#dbeafe", color: "#1e40af", label: "Đã ký" },
  PENDING_PAYMENT:     { bg: "#fef3c7", color: "#d97706", label: "Chờ thanh toán" },
  PENDING_OWNER_SIGNATURE:  { bg: "#dbeafe", color: "#1e40af", label: "Chờ chủ kho ký" },
  PENDING_RENTER_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ người thuê ký" },
  PENDING_SIGNATURE:   { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  PENDING_TERMINATION: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ chấm dứt" },
  PENDING_CLOSE:       { bg: "#fef3c7", color: "#f59e0b", label: "Chờ đóng" },
  OVERDUE:             { bg: "#fee2e2", color: "#dc2626", label: "Quá hạn" },
};

const getContractBadge = (status) => {
  const s = CONTRACT_STATUS[status?.toUpperCase()] || CONTRACT_STATUS[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  return <span style={{ padding: "2px 10px", background: s.bg, color: s.color, borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>{s.label}</span>;
};

const fmt = (val) => val != null ? Number(val).toLocaleString("vi-VN") : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const getImageUrl = (img) => {
  if (!img) return null;
  const raw = img.url || img.Url || img.mediaUrl || img.MediaUrl || (typeof img === "string" ? img : null);
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return `http://localhost:5276${raw.startsWith("/") ? raw : "/" + raw}`;
};

// ─── Tabs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "map",       icon: "map",              label: "Sơ đồ & Khu vực" },
  { id: "contracts", icon: "description",      label: "Hợp đồng thuê" },
  { id: "revenue",   icon: "bar_chart",        label: "Doanh thu" },
  { id: "info",      icon: "info",             label: "Thông tin kho" },
  { id: "ratings",   icon: "star",             label: "Đánh giá" },
];

// ─── Main ──────────────────────────────────────────────────────────────────
const OwnerWarehouseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState(null);
  const [areas, setAreas]         = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("map");
  const [activeImage, setActiveImage] = useState(0);
  const [ratingsData, setRatingsData] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyLoading, setReplyLoading] = useState(false);
  const [editReplyId, setEditReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState({});
  const [replyActionLoading, setReplyActionLoading] = useState(null);

  const fetchRatings = async () => {
    try {
      const data = await ratingService.getWarehouseRatings(id);
      setRatingsData(data);
    } catch (err) { console.error('Failed to load ratings:', err); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [whRes, areasRes, contractsRes] = await Promise.allSettled([
          api.get(`/Warehouse/${id}`),
          api.get(`/RentalAreas/warehouse/${id}`),
          api.get(`/rental-contracts/warehouse/${id}`),
        ]);
        if (whRes.status === "fulfilled")        setWarehouse(whRes.value.data);
        if (areasRes.status === "fulfilled")     setAreas(areasRes.value.data || []);
        if (contractsRes.status === "fulfilled") setContracts(contractsRes.value.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
    fetchRatings();
  }, [id]);

  const handleReplySubmit = async (ratingId) => {
    if (!replyText[ratingId]?.trim()) return;
    setReplyLoading(true);
    try {
      await ratingService.replyToRating(ratingId, replyText[ratingId].trim());
      setRatingsData(prev => ({
        ...prev,
        ratings: prev.ratings.map(r =>
          r.ratingId === ratingId ? { ...r, ownerReply: replyText[ratingId] } : r
        )
      }));
      setReplyText(prev => ({ ...prev, [ratingId]: '' }));
      window.dispatchEvent(new Event('replyChanged'));
    } catch (err) {
      console.error('Failed to reply:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleUpdateReply = async (ratingId) => {
    if (!editReplyText[ratingId]?.trim()) return;
    setReplyActionLoading(ratingId);
    try {
      await ratingService.updateReply(ratingId, editReplyText[ratingId].trim());
      setRatingsData(prev => ({
        ...prev,
        ratings: prev.ratings.map(r =>
          r.ratingId === ratingId ? { ...r, ownerReply: editReplyText[ratingId].trim() } : r
        )
      }));
      setEditReplyId(null);
      // badge không cần thay đổi vì reply đã tồn tại
    } catch (err) {
      console.error('Failed to update reply:', err);
    } finally {
      setReplyActionLoading(null);
    }
  };

  const handleDeleteReply = async (ratingId) => {
    setReplyActionLoading(ratingId + '_del');
    try {
      await ratingService.deleteReply(ratingId);
      setRatingsData(prev => ({
        ...prev,
        ratings: prev.ratings.map(r =>
          r.ratingId === ratingId ? { ...r, ownerReply: null, repliedAt: null } : r
        )
      }));
      window.dispatchEvent(new Event('replyChanged'));
    } catch (err) {
      console.error('Failed to delete reply:', err);
    } finally {
      setReplyActionLoading(null);
    }
  };



  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 16 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#0284c7", animation: "spin 1.2s linear infinite" }}>sync</span>
      <p style={{ color: "#64748b" }}>Đang tải dữ liệu kho...</p>
    </div>
  );

  if (!warehouse) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#ef4444" }}>error</span>
      <p>Không tìm thấy kho</p>
    </div>
  );

  // ── Revenue calculations ─────────────────────────────────────────────────
  const activeContracts     = contracts.filter(c => c.status?.toUpperCase() === "ACTIVE");
  const totalMonthlyRevenue = activeContracts.reduce((s, c) => s + (c.monthlyPayment || 0), 0);
  const totalContractValue  = contracts.reduce((s, c) => s + (c.totalValue || 0), 0);
  
  // New: Calculate total rented area directly from active contracts
  const totalRentedArea     = activeContracts.reduce((s, c) => s + (c.requestedArea || 0), 0);
  
  // Use either the DB value or a calculated value if the DB hasn't been updated
  const displayAvailableArea = Math.min(warehouse.availableArea, warehouse.totalArea - totalRentedArea);

  const rentedAreaIds       = new Set(activeContracts.map(c => c.rentalAreaId).filter(id => id !== null));
  const rentedAreas         = areas.filter(a => rentedAreaIds.has(a.id));

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      {(() => {
        const allImages = warehouse.images || warehouse.Images || [];
        const primaryImg = allImages.find(img => img.isPrimary || img.IsPrimary) || allImages[0];
        const heroBg = getImageUrl(primaryImg);
        return (
          <div style={{
            position: "relative",
            padding: "2rem 2.5rem 3rem",
            overflow: "hidden",
            minHeight: 260
          }}>
            {/* Background image */}
            {heroBg && (
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `url(${heroBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.45)"
              }} />
            )}
            {/* Gradient overlay (always shown — stronger when no image) */}
            <div style={{
              position: "absolute", inset: 0,
              background: heroBg
                ? "linear-gradient(135deg, rgba(2,132,199,0.75) 0%, rgba(3,105,161,0.6) 100%)"
                : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
            }} />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <button
                    onClick={() => navigate("/my-warehouses")}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: "0.875rem" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                    Quay lại
                  </button>
                  <h1 style={{ margin: 0, color: "#fff", fontSize: "1.8rem", fontWeight: 800, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{warehouse.name}</h1>
                  <p style={{ marginTop: 6, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                    {warehouse.address}
                  </p>
                  <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {getStatusBadge(warehouse.status)}
                    {warehouse.mainDoorDirection && (
                      <span style={{ 
                        padding: "4px 14px", 
                        background: "rgba(255,255,255,0.2)", 
                        color: "#fff", 
                        borderRadius: "20px", 
                        fontSize: "0.82rem", 
                        fontWeight: 700,
                        border: "1px solid rgba(255,255,255,0.3)",
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6,
                        backdropFilter: "blur(4px)"
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fact_check</span>
                        {warehouse.mainDoorDirection}
                      </span>
                    )}
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>
                      #{`WHS-${String(warehouse.warehouseId || id).padStart(4,"0")}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/warehouse-edit/${id}`)}
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10, padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, backdropFilter: "blur(8px)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                  Chỉnh sửa kho
                </button>
              </div>

              {/* Quick stats */}
              <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
                {[
                  { icon: "straighten",  label: "Diện tích sàn",  value: `${warehouse.totalArea} m²`,     color: "#38bdf8" },
                  { icon: "check_circle", label: "Còn trống",       value: `${warehouse.availableArea} m²`, color: "#4ade80" },
                  { icon: "grid_view",   label: "Khu vực",         value: `${areas.length} khu`,            color: "#fb923c" },
                  { icon: "description", label: "Hợp đồng HLực",  value: `${activeContracts.length}`,      color: "#f472b6" },
                  { icon: "payments",    label: "Doanh thu/tháng", value: `${fmt(totalMonthlyRevenue)} ₫`,  color: "#a78bfa" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 20px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", minWidth: 140 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                    </div>
                    <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}


      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 2.5rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            // Số đánh giá chưa reply trên tab "ratings"
            const badge = tab.id === "ratings" && ratingsData
              ? ratingsData.ratings?.filter(r => !r.ownerReply).length || 0
              : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "16px 24px",
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "3px solid #0284c7" : "3px solid transparent",
                  color: isActive ? "#0284c7" : "#64748b",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.9rem",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                  {badge > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-10px",
                      minWidth: "17px",
                      height: "17px",
                      borderRadius: "9px",
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      boxShadow: "0 2px 6px rgba(239,68,68,0.5)",
                      border: "2px solid #fff",
                      lineHeight: 1,
                      animation: "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                {tab.label}
                <style>{`
                  @keyframes badgePop {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                  }
                `}</style>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "2rem 2.5rem", maxWidth: 1600 }}>

        {/* TAB: Map & Areas */}
        {activeTab === "map" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Sơ đồ mặt bằng kho */}
            {warehouse?.boundaryPoints && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                  Sơ đồ mặt bằng kho
                </h3>
                <WarehouseFloorPlanView
                  boundaryPoints={warehouse.boundaryPoints}
                  gatePosition={warehouse.gatePosition}
                  totalArea={warehouse.totalArea}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB: Contracts */}
        {activeTab === "contracts" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                Danh sách Hợp đồng thuê ({contracts.length})
              </h3>
            </div>
            {contracts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 56 }}>description</span>
                <p style={{ marginTop: 12 }}>Chưa có hợp đồng nào cho kho này</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Số HĐ", "Người thuê", "Diện tích", "Bắt đầu", "Kết thúc", "Tiền/tháng", "Tổng GTriị", "Trạng thái"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c, i) => (
                      <tr key={c.contractId} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0284c7", fontSize: "0.9rem" }}>{c.contractNumber || `#${c.contractId}`}</td>
                        <td style={{ padding: "14px 16px", color: "#1e293b", fontSize: "0.9rem" }}>{c.renterName || "—"}</td>
                        <td style={{ padding: "14px 16px", color: "#475569", fontSize: "0.875rem", fontWeight: 600 }}>{c.requestedArea} m²</td>
                        <td style={{ padding: "14px 16px", color: "#475569", fontSize: "0.875rem" }}>{fmtDate(c.startDate)}</td>
                        <td style={{ padding: "14px 16px", color: "#475569", fontSize: "0.875rem" }}>{fmtDate(c.endDate)}</td>
                        <td style={{ padding: "14px 16px", color: "#1e293b", fontWeight: 600, fontSize: "0.875rem" }}>{fmt(c.monthlyPayment)} ₫</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700, fontSize: "0.875rem" }}>{fmt(c.totalValue)} ₫</td>
                        <td style={{ padding: "14px 16px" }}>{getContractBadge(c.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: Revenue */}
        {activeTab === "revenue" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: "payments",       label: "Doanh thu tháng này",  value: `${fmt(totalMonthlyRevenue)} ₫`,  desc: `Từ ${activeContracts.length} hợp đồng đang hiệu lực`, color: "#0284c7", bg: "#e0f2fe" },
              { icon: "account_balance", label: "Tổng giá trị hợp đồng", value: `${fmt(totalContractValue)} ₫`, desc: `${contracts.length} hợp đồng tất cả thời gian`,        color: "#059669", bg: "#d1fae5" },
              { icon: "trending_up",    label: "Tỷ lệ lấp đầy",         value: `${warehouse.totalArea > 0 ? Math.round((1 - (warehouse.availableArea / warehouse.totalArea)) * 100) : 0}%`, desc: `${warehouse.totalArea - warehouse.availableArea}/${warehouse.totalArea} m²`, color: "#7c3aed", bg: "#ede9fe" },
              { icon: "receipt_long",  label: "Hợp đồng hiệu lực",    value: activeContracts.length,           desc: `${contracts.filter(c => c.status?.toUpperCase() === "EXPIRED").length} đã hết hạn`, color: "#d97706", bg: "#fef3c7" },
            ].map((card, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: card.color }}>{card.icon}</span>
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748b" }}>{card.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{card.value}</p>
                <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>{card.desc}</p>
              </div>
            ))}

            {contracts.length > 0 && (
              <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Chi tiết doanh thu từng hợp đồng</h4>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Số HĐ", "Người thuê", "Tiền/tháng", "Đặt cọc", "Tổng giá trị", "Trạng thái"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((c, i) => (
                        <tr key={c.contractId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0284c7" }}>{c.contractNumber || `#${c.contractId}`}</td>
                          <td style={{ padding: "12px 16px", color: "#1e293b" }}>{c.renterName || "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#059669", fontWeight: 700 }}>{fmt(c.monthlyPayment)} ₫</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{fmt(c.depositAmount)} ₫</td>
                          <td style={{ padding: "12px 16px", color: "#0f172a", fontWeight: 700 }}>{fmt(c.totalValue)} ₫</td>
                          <td style={{ padding: "12px 16px" }}>{getContractBadge(c.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Info */}
        {activeTab === "info" && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Image gallery */}
              {(() => {
                const allImages = warehouse.images || warehouse.Images || [];
                if (allImages.length === 0) return null;
                const current = getImageUrl(allImages[activeImage]) || getImageUrl(allImages[0]);
                return (
                  <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: "#0284c7" }}>photo_library</span>
                      <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Hình ảnh kho ({allImages.length})</h4>
                    </div>
                    <div style={{ position: "relative", height: 320 }}>
                      <img src={current} alt="warehouse" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    {allImages.length > 1 && (
                      <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto", borderTop: "1px solid #f1f5f9" }}>
                        {allImages.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveImage(idx)}
                            style={{
                              width: 72, height: 56, borderRadius: 8, overflow: "hidden", cursor: "pointer", flexShrink: 0,
                              border: activeImage === idx ? "2px solid #0284c7" : "2px solid transparent",
                              transition: "border 0.15s"
                            }}
                          >
                            <img src={getImageUrl(img)} alt={`thumb-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontWeight: 700, color: "#0f172a" }}>Thông tin chung</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "Tên kho",          value: warehouse.name },
                    { label: "Địa chỉ",           value: warehouse.address },
                    { label: "Loại kho",          value: warehouse.warehouseType || "Khác" },
                    { label: "Diện tích sàn",    value: `${warehouse.totalArea} m²` },
                    { label: "Diện tích còn trống", value: `${warehouse.availableArea} m²` },
                    { label: "Chiều cao",          value: (warehouse.height ?? warehouse.Height) != null ? `${warehouse.height ?? warehouse.Height} m` : "—" },
                
                    { label: "Giờ hoạt động",     value: warehouse.is24HoursAccess ? "24/7" : (warehouse.operatingHours || "—") },
                    { label: "Pháp lý",           value: warehouse.mainDoorDirection || "—" },
                    { label: "Trạng thái",         value: STATUS_BADGE[warehouse.status?.toUpperCase()]?.label || warehouse.status },
                  ].map(f => (
                    <div key={f.label} style={{ padding: "12px", background: "#f8fafc", borderRadius: 10 }}>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.95rem", color: "#1e293b", fontWeight: 600 }}>{f.value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {warehouse.description && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 1rem 0", fontWeight: 700, color: "#0f172a" }}>Mô tả</h3>
                  <p style={{ color: "#475569", lineHeight: 1.7, margin: 0 }}>{warehouse.description}</p>
                </div>
              )}

              {warehouse.lat && warehouse.lng && (
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: "#0284c7" }}>map</span>
                    <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Vị trí địa lý</h4>
                  </div>
                  <iframe
                    title="Vị trí kho"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${warehouse.lat},${warehouse.lng}&z=15&output=embed`}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 1rem 0", fontWeight: 700, color: "#0f172a" }}>Thao tác nhanh</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    onClick={() => navigate(`/warehouse-edit/${id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, color: "#1d4ed8", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                    Chỉnh sửa thông tin kho
                  </button>
                  <button
                    onClick={() => { setActiveTab("map"); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, color: "#166534", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_box</span>
                    Quản lý khu vực
                  </button>
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 1rem 0", fontWeight: 700, color: "#0f172a" }}>Trạng thái phê duyệt</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.875rem", color: "#475569" }}>Trạng thái hiện tại</span>
                    {getStatusBadge(warehouse.status)}
                  </div>

                  {warehouse.status?.toUpperCase() === "PENDING" && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fde68a", borderRadius: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#d97706", flexShrink: 0 }}>schedule</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.85rem", marginBottom: 2 }}>Đang chờ Admin xét duyệt</div>
                        <div style={{ color: "#b45309", fontSize: "0.8rem" }}>Vui lòng chờ phản hồi từ hệ thống.</div>
                      </div>
                    </div>
                  )}

                  {warehouse.status?.toUpperCase() === "REJECTED" && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", background: "linear-gradient(135deg,#fff1f2,#fee2e2)", border: "1px solid #fecaca", borderRadius: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#dc2626", flexShrink: 0 }}>cancel</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "#991b1b", fontSize: "0.85rem", marginBottom: 2 }}>Kho bị từ chối</div>
                        <div style={{ color: "#b91c1c", fontSize: "0.8rem", lineHeight: 1.5 }}>
                          {warehouse.rejectionReason
                            ? <><strong>Lý do:</strong> {warehouse.rejectionReason}</>
                            : "Vui lòng kiểm tra và chỉnh sửa kho, sau đó nộp lại."}
                        </div>
                      </div>
                    </div>
                  )}

                  {warehouse.status?.toUpperCase() === "APPROVED" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#16a34a" }}>verified</span>
                      <div style={{ fontWeight: 600, color: "#15803d", fontSize: "0.85rem" }}>Kho đã được phê duyệt</div>
                    </div>
                  )}

                  {warehouse.approvedAt && (
                    <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, marginBottom: 2, textTransform: "uppercase" }}>Ngày duyệt</div>
                      <div style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: 500 }}>{new Date(warehouse.approvedAt).toLocaleDateString("vi-VN")}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.875rem", color: "#475569" }}>Tài liệu pháp lý</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: warehouse.documentStatus === "APPROVED" ? "#166534" : "#854d0e" }}>
                      {warehouse.documentStatus === "MISSING" ? "Chưa có" : warehouse.documentStatus === "PENDING" ? "Chờ duyệt" : warehouse.documentStatus === "APPROVED" ? "Đã xác minh" : (warehouse.documentStatus || "—")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal documents gallery */}
              {warehouse.documents && warehouse.documents.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                    <span className="material-symbols-outlined" style={{ color: "#0284c7" }}>description</span>
                    <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Giấy tờ pháp lý ({warehouse.documents.length})</h4>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    {warehouse.documents.map(doc => {
                      const rawUrl = doc.documentUrl || doc.DocumentUrl;
                      const docUrl = rawUrl?.startsWith("http") ? rawUrl : `http://localhost:5276${rawUrl?.startsWith("/") ? rawUrl : "/" + rawUrl}`;
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(docUrl);
                      const isPdf = /\.pdf$/i.test(docUrl);
                      const docLabels = {
                        BUSINESS_LICENSE: "Giấy phép kinh doanh",
                        WAREHOUSE_CERT: "GCN quyền sử dụng kho",
                        FIRE_SAFETY: "PCCC",
                        OTHER: "Tài liệu khác",
                      };
                      const label = docLabels[doc.documentType] || doc.documentType || "Giấy tờ";
                      return (
                        <div key={doc.documentId} style={{
                          borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden",
                          background: "#fafafa"
                        }}>
                          {isImage ? (
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                              <img
                                src={docUrl}
                                alt={label}
                                style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                                onError={e => { e.target.style.display = "none"; }}
                              />
                            </a>
                          ) : isPdf ? (
                            <a
                              href={docUrl} target="_blank" rel="noopener noreferrer"
                              style={{
                                height: 120, display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center", gap: 6,
                                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                textDecoration: "none"
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#2563eb" }}>picture_as_pdf</span>
                              <span style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 600 }}>Xem PDF</span>
                            </a>
                          ) : (
                            <a
                              href={docUrl} target="_blank" rel="noopener noreferrer"
                              style={{
                                height: 120, display: "flex", alignItems: "center", justifyContent: "center",
                                background: "#f1f5f9", textDecoration: "none"
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#64748b" }}>insert_drive_file</span>
                            </a>
                          )}
                          <div style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>{label}</span>
                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Ratings */}
        {activeTab === "ratings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Summary header */}
            {ratingsData && ratingsData.totalCount > 0 ? (
              <>
                {/* Rating summary */}
                <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", borderRadius: 16, padding: "1.5rem 2rem", border: "1px solid #fde68a", display: "flex", gap: "2rem", alignItems: "center" }}>
                  <div style={{ textAlign: "center", minWidth: 110 }}>
                    <div style={{ fontSize: "3rem", fontWeight: 900, color: "#d97706", lineHeight: 1 }}>{ratingsData.averageStar}</div>
                    <div style={{ display: "flex", gap: 3, justifyContent: "center", margin: "8px 0 4px" }}>
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="18" height="18" viewBox="0 0 24 24"
                          fill={s <= Math.round(ratingsData.averageStar) ? '#f59e0b' : 'none'}
                          stroke={s <= Math.round(ratingsData.averageStar) ? '#f59e0b' : '#cbd5e1'}
                          strokeWidth="1.5"
                          style={{ filter: s <= Math.round(ratingsData.averageStar) ? 'drop-shadow(0 1px 4px rgba(245,158,11,0.5))' : 'none' }}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#92400e", fontWeight: 700 }}>{ratingsData.totalCount} đánh giá</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5,4,3,2,1].map(star => {
                      const count = ratingsData.starDistribution ? ratingsData.starDistribution[star - 1] || 0 : 0;
                      const pct = ratingsData.totalCount > 0 ? (count / ratingsData.totalCount * 100) : 0;
                      return (
                        <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#78716c", width: 24, textAlign: "right" }}>{star}</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" style={{ flexShrink: 0 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <div style={{ flex: 1, height: 8, backgroundColor: "#fef3c7", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #d97706)", borderRadius: 4, transition: "width 0.5s ease" }} />
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 700, width: 24 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Rating cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {ratingsData.ratings.map(r => (
                    <div key={r.ratingId} style={{
                      background: "#fff",
                      borderRadius: 16, padding: "1.4rem 1.6rem",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      transition: "all 0.2s",
                    }}>
                      {/* Card header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                            {(r.renterName || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>{r.renterName || "Người thuê"}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" }) : ""}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Stars */}
                          <div style={{ display: "flex", gap: 3 }}>
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} width="16" height="16" viewBox="0 0 24 24"
                                fill={s <= r.star ? '#f59e0b' : 'none'}
                                stroke={s <= r.star ? '#f59e0b' : '#cbd5e1'}
                                strokeWidth="1.5"
                                style={{ filter: s <= r.star ? 'drop-shadow(0 1px 4px rgba(245,158,11,0.4))' : 'none' }}
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Comment */}
                      {r.comment && (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
                        </div>
                      )}

                      {/* Owner reply or reply form */}
                      {r.ownerReply ? (
                        <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, borderLeft: "3px solid #22c55e" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                              Phản hồi của bạn
                            </div>
                            {editReplyId !== r.ratingId && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => { setEditReplyId(r.ratingId); setEditReplyText(prev => ({ ...prev, [r.ratingId]: r.ownerReply })); }}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteReply(r.ratingId)}
                                  disabled={replyActionLoading === r.ratingId + '_del'}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", fontWeight: 600, cursor: replyActionLoading === r.ratingId + '_del' ? "wait" : "pointer", fontSize: "0.75rem", opacity: replyActionLoading === r.ratingId + '_del' ? 0.6 : 1 }}
                                  onMouseEnter={e => { if (replyActionLoading !== r.ratingId + '_del') e.currentTarget.style.background = "#fee2e2"; }}
                                  onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                                    {replyActionLoading === r.ratingId + '_del' ? "sync" : "delete"}
                                  </span>
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                          {editReplyId === r.ratingId ? (
                            <div style={{ marginTop: 8 }}>
                              <textarea
                                value={editReplyText[r.ratingId] || ""}
                                onChange={e => setEditReplyText(prev => ({ ...prev, [r.ratingId]: e.target.value }))}
                                rows={3}
                                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #86efac", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", color: "#0f172a" }}
                                onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.12)"; }}
                                onBlur={e => { e.target.style.borderColor = "#86efac"; e.target.style.boxShadow = "none"; }}
                              />
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button
                                  onClick={() => handleUpdateReply(r.ratingId)}
                                  disabled={!editReplyText[r.ratingId]?.trim() || replyActionLoading === r.ratingId}
                                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 18px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", boxShadow: "0 3px 10px rgba(22,163,74,0.3)" }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                                  Lưu phản hồi
                                </button>
                                <button
                                  onClick={() => setEditReplyId(null)}
                                  style={{ padding: "7px 14px", background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: "0.88rem", color: "#15803d", margin: 0, lineHeight: 1.5 }}>{r.ownerReply}</p>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: 12 }}>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: 5, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            Phản hồi đánh giá này
                          </label>
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1, position: "relative" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ position: "absolute", top: 12, left: 12, pointerEvents: "none" }}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                              <input
                                type="text"
                                placeholder="Nhập phản hồi của bạn..."
                                value={replyText[r.ratingId] || ""}
                                onChange={e => setReplyText(prev => ({ ...prev, [r.ratingId]: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter") handleReplySubmit(r.ratingId); }}
                                disabled={replyLoading}
                                style={{
                                  width: "100%", padding: "10px 12px 10px 36px",
                                  borderRadius: 10, border: "1.5px solid #e2e8f0",
                                  fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
                                  transition: "border-color 0.2s, box-shadow 0.2s",
                                  fontFamily: "inherit", color: "#0f172a"
                                }}
                                onFocus={e => { e.target.style.borderColor = "#0284c7"; e.target.style.boxShadow = "0 0 0 3px rgba(2,132,199,0.12)"; }}
                                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                              />
                            </div>
                            <button
                              onClick={() => handleReplySubmit(r.ratingId)}
                              disabled={!replyText[r.ratingId]?.trim() || replyLoading}
                              style={{
                                padding: "10px 20px",
                                background: (!replyText[r.ratingId]?.trim() || replyLoading) ? "#e2e8f0" : "linear-gradient(135deg, #0284c7, #0369a1)",
                                color: (!replyText[r.ratingId]?.trim() || replyLoading) ? "#94a3b8" : "#fff",
                                border: "none", borderRadius: 10,
                                fontWeight: 700, cursor: (!replyText[r.ratingId]?.trim() || replyLoading) ? "not-allowed" : "pointer",
                                fontSize: "0.88rem", transition: "all 0.2s", flexShrink: 0,
                                boxShadow: (!replyText[r.ratingId]?.trim() || replyLoading) ? "none" : "0 4px 12px rgba(2,132,199,0.3)",
                                display: "flex", alignItems: "center", gap: 6,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                              </svg>
                              Gửi
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #fef3c7, #fde68a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700, color: "#64748b" }}>Chưa có đánh giá nào</h3>
                <p style={{ fontSize: "0.88rem", color: "#94a3b8", margin: 0 }}>Chưa có renter nào đánh giá kho này</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerWarehouseDetailPage;
