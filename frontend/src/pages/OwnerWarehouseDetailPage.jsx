import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/axiosClient";
import RentalAreaManagement from "../components/warehouse/RentalAreaManagement";

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
  ACTIVE:    { bg: "#dcfce7", color: "#166534", label: "Hiệu lực" },
  PENDING:   { bg: "#fef9c3", color: "#854d0e", label: "Chờ ký" },
  EXPIRED:   { bg: "#f1f5f9", color: "#64748b", label: "Hết hạn" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Đã hủy" },
};

const getContractBadge = (status) => {
  const s = CONTRACT_STATUS[status?.toUpperCase()] || { bg: "#f1f5f9", color: "#475569", label: status };
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
  }, [id]);

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
  const rentedAreaIds       = new Set(contracts.filter(c => c.status?.toUpperCase() === "ACTIVE").map(c => c.rentalAreaId));
  const rentedAreas         = areas.filter(a => rentedAreaIds.has(a.id) || activeContracts.some(c => c.warehouseId === parseInt(id)));

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
                  { icon: "straighten",  label: "Tổng diện tích",  value: `${warehouse.totalArea} m²`,     color: "#38bdf8" },
                  { icon: "check_circle", label: "Còn trống",       value: `${warehouse.availableArea} m²`, color: "#4ade80" },
                  { icon: "grid_view",   label: "Khu vực",         value: `${areas.length} khu`,            color: "#fb923c" },
                  { icon: "description", label: "Hợp đồng HLực",  value: `${activeContracts.length}`,      color: "#f472b6" },
                  { icon: "payments",    label: "Doanh thu/tháng", value: `${fmt(totalMonthlyRevenue)} ₫`,  color: "#a78bfa" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 20px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", minWidth: 140 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
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
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "16px 24px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #0284c7" : "3px solid transparent",
                color: activeTab === tab.id ? "#0284c7" : "#64748b",
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.9rem",
                transition: "all 0.15s"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "2rem 2.5rem", maxWidth: 1600 }}>

        {/* TAB: Map & Areas */}
        {activeTab === "map" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Areas list */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                  📦 Tất cả Khu cho thuê ({areas.length})
                </h3>
              </div>
              {areas.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48 }}>grid_off</span>
                  <p>Chưa có khu cho thuê nào được tạo</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {areas.map(a => {
                    const isRented = activeContracts.some(() => false); // placeholder; ideally check by rental area id
                    return (
                      <div key={a.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", background: "#fafafa" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{a.name}</span>
                          {AREA_STATUS_BADGE(a.status?.toUpperCase() === "RENTED")}
                        </div>
                        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#475569" }}>
                          Diện tích: <strong>{(a.width * a.length || a.size || 0).toFixed(1)} m²</strong>
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#475569" }}>
                          Kích thước: <strong>{a.width}m × {a.length}m</strong>
                        </p>
                        {a.description && <p style={{ margin: "4px 0", fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>{a.description}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Map component */}
            <RentalAreaManagement warehouseId={parseInt(id)} />
          </div>
        )}

        {/* TAB: Contracts */}
        {activeTab === "contracts" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                📋 Danh sách Hợp đồng thuê ({contracts.length})
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
                      {["Số HĐ", "Người thuê", "Bắt đầu", "Kết thúc", "Tiền/tháng", "Tổng GTriị", "Đặt Cọc", "Trạng thái"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c, i) => (
                      <tr key={c.contractId} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0284c7", fontSize: "0.9rem" }}>{c.contractNumber || `#${c.contractId}`}</td>
                        <td style={{ padding: "14px 16px", color: "#1e293b", fontSize: "0.9rem" }}>{c.renterName || "—"}</td>
                        <td style={{ padding: "14px 16px", color: "#475569", fontSize: "0.875rem" }}>{fmtDate(c.startDate)}</td>
                        <td style={{ padding: "14px 16px", color: "#475569", fontSize: "0.875rem" }}>{fmtDate(c.endDate)}</td>
                        <td style={{ padding: "14px 16px", color: "#1e293b", fontWeight: 600, fontSize: "0.875rem" }}>{fmt(c.monthlyPayment)} ₫</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700, fontSize: "0.875rem" }}>{fmt(c.totalValue)} ₫</td>
                        <td style={{ padding: "14px 16px", color: "#475569", fontSize: "0.875rem" }}>{fmt(c.depositAmount)} ₫</td>
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
                    { label: "Tổng diện tích",    value: `${warehouse.totalArea} m²` },
                    { label: "Diện tích còn trống", value: `${warehouse.availableArea} m²` },
                    { label: "Chiều dài",          value: warehouse.length ? `${warehouse.length} m` : "—" },
                    { label: "Chiều rộng",         value: warehouse.width  ? `${warehouse.width} m`  : "—" },
                    { label: "Giờ hoạt động",     value: warehouse.is24HoursAccess ? "24/7" : (warehouse.operatingHours || "—") },
                    { label: "Pháp lý",           value: warehouse.mainDoorDirection || "—" },
                    { label: "Trạng thái",         value: STATUS_BADGE[warehouse.status?.toUpperCase()]?.label || warehouse.status },
                  ].map(f => (
                    <div key={f.label} style={{ padding: "12px", background: "#f8fafc", borderRadius: 10 }}>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.95rem", color: "#1e293b", fontWeight: 600 }}>{f.value || "—"}</p>
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
                <h4 style={{ margin: "0 0 1rem 0", fontWeight: 700, color: "#0f172a" }}>Trạng thái kho</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.875rem", color: "#475569" }}>Phê duyệt</span>
                    {getStatusBadge(warehouse.status)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.875rem", color: "#475569" }}>Tài liệu pháp lý</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: warehouse.documentStatus === "APPROVED" ? "#166534" : "#854d0e" }}>
                      {warehouse.documentStatus === "MISSING" ? "Chưa có" : warehouse.documentStatus === "PENDING" ? "Chờ duyệt" : warehouse.documentStatus === "APPROVED" ? "Đã xác minh" : (warehouse.documentStatus || "—")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerWarehouseDetailPage;
