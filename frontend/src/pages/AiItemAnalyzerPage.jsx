import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../services/aiService";

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
);
const WarehouseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);
const BoxIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ─── Styles (CSS-in-JS) ────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    padding: "24px 16px 48px",
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: "#f1f5f9",
  },
  container: { maxWidth: 900, margin: "0 auto" },

  // Header
  header: { textAlign: "center", marginBottom: 40 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", padding: "6px 18px", borderRadius: 999,
    fontSize: 13, fontWeight: 600, marginBottom: 20,
    boxShadow: "0 0 20px rgba(99,102,241,0.4)",
  },
  title: {
    fontSize: "clamp(28px,5vw,42px)", fontWeight: 800,
    background: "linear-gradient(135deg, #e2e8f0, #a78bfa, #60a5fa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    margin: "0 0 12px",
  },
  subtitle: { color: "#94a3b8", fontSize: 16, margin: 0 },

  // Cards
  card: {
    background: "rgba(30,41,59,0.8)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 20, padding: 28, marginBottom: 24,
    backdropFilter: "blur(12px)",
  },
  cardTitle: { fontSize: 17, fontWeight: 700, color: "#e2e8f0", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },

  // Upload zone
  dropZone: (isDragging, hasFiles) => ({
    border: `2px dashed ${isDragging ? "#6366f1" : hasFiles ? "#22c55e" : "rgba(148,163,184,0.3)"}`,
    borderRadius: 16, padding: "40px 24px", textAlign: "center",
    cursor: "pointer", transition: "all 0.3s ease",
    background: isDragging ? "rgba(99,102,241,0.08)" : hasFiles ? "rgba(34,197,94,0.06)" : "transparent",
    color: isDragging ? "#818cf8" : "#64748b",
  }),

  // Preview thumbnails
  thumbnailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px,1fr))", gap: 12, marginTop: 20 },
  thumbnail: {
    position: "relative", borderRadius: 12, overflow: "hidden",
    aspectRatio: "1/1", background: "#1e293b",
  },
  thumbnailImg: { width: "100%", height: "100%", objectFit: "cover" },
  removeBtn: {
    position: "absolute", top: 6, right: 6,
    background: "rgba(239,68,68,0.9)", border: "none",
    borderRadius: "50%", width: 22, height: 22, cursor: "pointer",
    color: "#fff", fontSize: 14, lineHeight: "22px", textAlign: "center",
  },

  // Location row
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  inputGroup: { flex: 1, minWidth: 180 },
  label: { display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6, fontWeight: 500 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(15,23,42,0.6)", color: "#e2e8f0",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  },

  // Button
  btnPrimary: (disabled) => ({
    width: "100%", padding: "16px 24px",
    background: disabled ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none", borderRadius: 14, color: "#fff",
    fontSize: 17, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    transition: "all 0.3s ease",
    boxShadow: disabled ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
    marginTop: 20,
  }),

  // Quota bar
  quotaBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  quotaTrack: { flex: 1, height: 6, background: "rgba(99,102,241,0.15)", borderRadius: 999 },
  quotaFill: (pct) => ({
    height: "100%", borderRadius: 999, width: `${pct}%`,
    background: pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#6366f1",
    transition: "width 0.5s ease",
  }),

  // Loading skeleton
  skeleton: {
    background: "linear-gradient(90deg, rgba(99,102,241,0.1) 25%, rgba(99,102,241,0.2) 50%, rgba(99,102,241,0.1) 75%)",
    backgroundSize: "300% 100%", animation: "shimmer 1.5s infinite",
    borderRadius: 8, height: 20,
  },

  // Results – items table
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 14px", fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", borderBottom: "1px solid rgba(148,163,184,0.1)" },
  td: { padding: "12px 14px", fontSize: 14, color: "#cbd5e1", borderBottom: "1px solid rgba(148,163,184,0.05)" },

  // Warehouse card
  whCard: {
    background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.1)",
    borderRadius: 16, padding: 20, cursor: "pointer",
    transition: "all 0.3s ease", display: "flex", gap: 16,
  },
  whImg: { width: 90, height: 90, borderRadius: 12, objectFit: "cover", flexShrink: 0 },
  whImgPlaceholder: {
    width: 90, height: 90, borderRadius: 12, flexShrink: 0,
    background: "linear-gradient(135deg,#1e3a5f,#2d1b69)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#6366f1",
  },
  whInfo: { flex: 1, minWidth: 0 },
  whName: { fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  whAddress: { fontSize: 13, color: "#64748b", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  whTags: { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: (color) => ({
    padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500,
    background: color === "green" ? "rgba(34,197,94,0.15)" : color === "purple" ? "rgba(99,102,241,0.15)" : "rgba(148,163,184,0.1)",
    color: color === "green" ? "#4ade80" : color === "purple" ? "#a78bfa" : "#94a3b8",
  }),
  rentBtn: {
    marginTop: 16, padding: "10px 20px",
    background: "linear-gradient(135deg,#06b6d4,#0ea5e9)",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    transition: "all 0.3s ease", whiteSpace: "nowrap",
  },

  // Summary stats
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16, marginBottom: 24 },
  statBox: {
    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 14, padding: "16px 20px", textAlign: "center",
  },
  statVal: { fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#818cf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
};

// ─── Confidence bar ─────────────────────────────────
const ConfidenceBadge = ({ value }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const label = pct >= 75 ? "Cao" : pct >= 50 ? "Trung bình" : "Thấp";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "rgba(148,163,184,0.1)", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 13, color, fontWeight: 600 }}>{pct}% ({label})</span>
    </div>
  );
};

// ─── Star rating ────────────────────────────────────
const StarRating = ({ value = 0 }) => (
  <span style={{ display: "inline-flex", gap: 2 }}>
    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(value)} />)}
    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>{value ? value.toFixed(1) : "—"}</span>
  </span>
);

// ─── Loading skeleton ───────────────────────────────
const LoadingSkeleton = () => (
  <div>
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    {[1,2,3].map(i => (
      <div key={i} style={{ ...styles.card, marginBottom: 16 }}>
        <div style={{ ...styles.skeleton, width: "40%", marginBottom: 16 }} />
        <div style={{ ...styles.skeleton, width: "100%", marginBottom: 10 }} />
        <div style={{ ...styles.skeleton, width: "80%" }} />
      </div>
    ))}
  </div>
);

// ─── Main Page ──────────────────────────────────────
export default function AiItemAnalyzerPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState(null);

  // Load quota on mount
  useEffect(() => {
    aiService.getQuota()
      .then(res => setQuota(res.data))
      .catch(() => {});
  }, []);

  // Generate previews when files change
  useEffect(() => {
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(newPreviews);
    return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = useCallback((newFiles) => {
    setError(null);
    const images = Array.from(newFiles).filter(f => f.type.startsWith("image/"));
    if (images.length === 0) { setError("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)."); return; }
    const combined = [...files, ...images].slice(0, 5);
    setFiles(combined);
  }, [files]);

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleAnalyze = async () => {
    if (files.length === 0) { setError("Vui lòng chọn ít nhất 1 ảnh."); return; }
    if (quota && quota.remaining === 0) { setError(`Bạn đã dùng hết ${quota.dailyLimit} lượt hôm nay. Thử lại ngày mai!`); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await aiService.analyzeItems(files, province || null, district || null);
      setResult(res.data);
      setQuota(prev => prev ? { ...prev, remaining: prev.remaining - 1, usedToday: prev.usedToday + 1 } : null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Phân tích thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleItemNameChange = (idx, newName) => {
    setResult(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], name: newName };
      return { ...prev, items: newItems };
    });
  };

  const handleQuantityChange = (idx, newQuantity) => {
    let qty = newQuantity === "" ? "" : parseInt(newQuantity, 10);
    if (qty !== "" && (isNaN(qty) || qty < 0)) qty = 0;
    
    setResult(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], quantity: qty };
      const newTotal = newItems.reduce((acc, curr) => {
        const val = curr.quantity === "" ? 0 : curr.quantity;
        return acc + (val * curr.estimatedVolumeM3);
      }, 0);
      return { ...prev, items: newItems, totalVolumeM3: newTotal.toFixed(2) };
    });
  };

  const handleVolumeChange = (idx, newVolume) => {
    let vol = newVolume === "" ? "" : parseFloat(newVolume);
    if (vol !== "" && (isNaN(vol) || vol < 0)) vol = 0;
    
    setResult(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], estimatedVolumeM3: vol };
      const newTotal = newItems.reduce((acc, curr) => {
        const q = curr.quantity === "" ? 0 : curr.quantity;
        const v = curr.estimatedVolumeM3 === "" ? 0 : curr.estimatedVolumeM3;
        return acc + (q * v);
      }, 0);
      return { ...prev, items: newItems, totalVolumeM3: newTotal.toFixed(2) };
    });
  };

  const handleAddItem = () => {
    setResult(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items, { name: "", quantity: 1, estimatedVolumeM3: 0.05, isManual: true }];
      const newTotal = newItems.reduce((acc, curr) => {
        const q = curr.quantity === "" ? 0 : curr.quantity;
        const v = curr.estimatedVolumeM3 === "" ? 0 : curr.estimatedVolumeM3;
        return acc + (q * v);
      }, 0);
      return { ...prev, items: newItems, totalVolumeM3: newTotal.toFixed(2) };
    });
  };

  const handleRemoveItem = (idx) => {
    setResult(prev => {
      if (!prev) return prev;
      const newItems = prev.items.filter((_, i) => i !== idx);
      const newTotal = newItems.reduce((acc, curr) => {
        const q = curr.quantity === "" ? 0 : curr.quantity;
        const v = curr.estimatedVolumeM3 === "" ? 0 : curr.estimatedVolumeM3;
        return acc + (q * v);
      }, 0);
      return { ...prev, items: newItems, totalVolumeM3: newTotal.toFixed(2) };
    });
  };

  const goToWarehouse = (wh) => {
    navigate(`/warehouse/${wh.warehouseId}`, {
      state: {
        fromAi: true,
        requestedArea: wh.availableArea,
        aiNotes: result ? `[AI] ${result.items?.map(i => `${i.name} x${i.quantity}`).join(", ")} — Ước tính ${result.totalVolumeM3} m³` : "",
      }
    });
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .wh-card:hover { border-color: rgba(99,102,241,0.4) !important; transform: translateY(-2px); }
        .rent-btn:hover { opacity: 0.85; transform: scale(0.98); }
        input:focus { border-color: rgba(99,102,241,0.5) !important; }
      `}</style>

      <div style={styles.container}>
        {/* ── Header ── */}
        <div style={styles.header}>
          <h1 style={styles.title}>Tìm Kho Thông Minh</h1>
          <p style={styles.subtitle}>
            Chụp ảnh đồ vật → AI nhận dạng & ước tính thể tích → Hệ thống gợi ý kho phù hợp nhất
          </p>
        </div>

        {/* ── Quota bar ── */}
        {quota && (
          <div style={{ ...styles.card, padding: "16px 24px", marginBottom: 24 }}>
            <div style={styles.quotaBar}>
              <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
                Lượt AI hôm nay:
              </span>
              <div style={styles.quotaTrack}>
                <div style={styles.quotaFill(quota.usedToday / quota.dailyLimit * 100)} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: quota.remaining === 0 ? "#ef4444" : "#a78bfa", whiteSpace: "nowrap" }}>
                {quota.remaining}/{quota.dailyLimit} còn lại
              </span>
            </div>
          </div>
        )}

        {/* ── Main Result (if available) ── */}
        {result && (
          <>
            {/* Summary stats */}
            <div style={styles.statRow}>
              <div style={styles.statBox}>
                <div style={styles.statVal}>{result.items?.length || 0}</div>
                <div style={styles.statLabel}>Loại đồ vật</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statVal}>{result.totalVolumeM3} m³</div>
                <div style={styles.statLabel}>Thể tích cần thiết</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statVal}>{result.suggestedWarehouses?.length || 0}</div>
                <div style={styles.statLabel}>Kho phù hợp</div>
              </div>
            </div>

            {/* AI Analysis card */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Kết Quả Phân Tích AI
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Đồ vật</th>
                    <th style={styles.th}>Số lượng</th>
                    <th style={styles.th}>Thể tích (m³/cái)</th>
                    <th style={styles.th}>Tổng (m³)</th>
                    <th style={{ ...styles.th, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {result.items?.map((item, i) => (
                    <tr key={i}>
                      <td style={styles.td}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemNameChange(i, e.target.value)}
                          style={{
                            width: "90%", minWidth: 120, padding: "6px 8px", borderRadius: 6,
                            border: "1px solid rgba(148,163,184,0.3)",
                            background: "transparent", color: "#fff",
                            outline: "none", fontFamily: "inherit"
                          }}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(i, e.target.value)}
                          style={{
                            width: 60, padding: "6px 8px", borderRadius: 6,
                            border: "1px solid rgba(148,163,184,0.3)",
                            background: "rgba(15,23,42,0.4)", color: "#fff",
                            outline: "none", fontFamily: "inherit"
                          }}
                        />
                      </td>
                      <td style={styles.td}>
                        {item.isManual ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.estimatedVolumeM3}
                            onChange={(e) => handleVolumeChange(i, e.target.value)}
                            style={{
                              width: 70, padding: "6px 8px", borderRadius: 6,
                              border: "1px solid rgba(148,163,184,0.3)",
                              background: "rgba(15,23,42,0.4)", color: "#fff",
                              outline: "none", fontFamily: "inherit"
                            }}
                          />
                        ) : (
                          item.estimatedVolumeM3
                        )}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, color: "#a78bfa" }}>
                        {((item.estimatedVolumeM3 === "" ? 0 : item.estimatedVolumeM3) * (item.quantity === "" ? 0 : item.quantity)).toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <button
                          onClick={() => handleRemoveItem(i)}
                          title="Xóa đồ vật"
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#ef4444", fontSize: 18, padding: "2px 6px",
                            borderRadius: 6, transition: "all 0.2s",
                            opacity: 0.6,
                          }}
                          onMouseEnter={e => e.target.style.opacity = 1}
                          onMouseLeave={e => e.target.style.opacity = 0.6}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#e2e8f0" }}>Tổng cộng</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#e2e8f0" }}>
                      {result.items?.reduce((acc, curr) => acc + (curr.quantity === "" ? 0 : curr.quantity), 0) || 0}
                    </td>
                    <td style={styles.td}></td>
                    <td style={{ ...styles.td, fontWeight: 800, fontSize: 17, color: "#818cf8" }}>{result.totalVolumeM3} m³</td>
                    <td style={styles.td}></td>
                  </tr>
                </tbody>
              </table>

              {/* Add item button */}
              <button
                onClick={handleAddItem}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  margin: "16px 0 0", padding: "10px 20px",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px dashed rgba(99,102,241,0.4)",
                  borderRadius: 10, color: "#818cf8",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                Thêm đồ vật thủ công
              </button>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(148,163,184,0.1)" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Loại kho gợi ý</div>
                  <span style={styles.tag("purple")}>{result.suggestedWarehouseType}</span>
                </div>
                {result.specialNotes && (
                  <div style={{ flex: 2, minWidth: 260 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Lưu ý từ AI</div>
                    <div style={{ fontSize: 14, color: "#fbbf24" }}>{result.specialNotes}</div>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Chỉ số độ chính xác</div>
                  <ConfidenceBadge value={result.confidence} />
                </div>
              </div>
            </div>

            {/* Suggested warehouses */}
            {result.suggestedWarehouses?.length > 0 ? (
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                Top {result.suggestedWarehouses.length} Kho Phù Hợp
              </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {result.suggestedWarehouses.map((wh) => (
                    <div
                      key={wh.warehouseId}
                      className="wh-card"
                      style={styles.whCard}
                    >
                      {wh.imageUrl ? (
                        <img src={wh.imageUrl} alt={wh.name} style={styles.whImg} onError={e => e.target.style.display='none'} />
                      ) : (
                        <div style={styles.whImgPlaceholder}><WarehouseIcon /></div>
                      )}
                      <div style={styles.whInfo}>
                        <div style={styles.whName}>{wh.name}</div>
                        <div style={styles.whAddress}>{wh.address}</div>
                        <div style={styles.whTags}>
                          {wh.warehouseType && <span style={styles.tag("purple")}>{wh.warehouseType}</span>}
                          <span style={styles.tag("none")}>{wh.availableArea} m²</span>
                          {wh.availableVolume && <span style={styles.tag("green")}>{wh.availableVolume} m³ trống</span>}
                          {wh.is24HoursAccess && <span style={styles.tag("green")}>24/7</span>}
                          {wh.pricePerM2 && <span style={styles.tag("none")}>{Number(wh.pricePerM2).toLocaleString("vi-VN")} ₫/m²</span>}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <StarRating value={wh.averageRating} />
                            {wh.ratingCount > 0 && <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>({wh.ratingCount} đánh giá)</span>}
                          </div>
                          <div>
                            <span style={{ fontSize: 12, color: "#4ade80", marginRight: 12 }}>✓ {wh.matchReason}</span>
                            <button
                              className="rent-btn"
                              style={styles.rentBtn}
                              onClick={() => goToWarehouse(wh)}
                            >
                              Xem & Thuê →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ ...styles.card, textAlign: "center", padding: "40px 24px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}></div>
                <div style={{ color: "#94a3b8", fontSize: 15 }}>Chưa tìm thấy kho phù hợp trong hệ thống. Thử bỏ lọc địa điểm hoặc tìm kiếm thủ công.</div>
              </div>
            )}
          </>
        )}

        {/* ── Upload form ── */}
        {loading ? (
          <div style={styles.card}>
            <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}></div>
              <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>AI đang phân tích ảnh...</div>
              <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Quá trình này có thể mất 10-30 giây</div>
            </div>
            <LoadingSkeleton />
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              {result ? "Phân Tích Lại" : "Bước 1: Chọn Ảnh Đồ Vật"}
              <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b", fontWeight: 400 }}>
                {files.length}/5 ảnh
              </span>
            </div>

            {/* Drop zone */}
            <div
              style={styles.dropZone(isDragging, files.length > 0)}
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <div style={{ color: isDragging ? "#818cf8" : files.length > 0 ? "#22c55e" : "#64748b", marginBottom: 12 }}>
                <UploadIcon />
              </div>
              {files.length > 0 ? (
                <div style={{ color: "#22c55e", fontWeight: 600 }}>
                  Đã chọn {files.length} ảnh – Nhấp để thêm (tối đa 5)
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Kéo thả ảnh vào đây</div>
                  <div style={{ fontSize: 13 }}>hoặc <span style={{ color: "#818cf8", textDecoration: "underline" }}>chọn từ thiết bị</span></div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>JPG, PNG, WEBP – Tối đa 10MB/ảnh – 5 ảnh</div>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => addFiles(e.target.files)} />

            {/* Thumbnails */}
            {previews.length > 0 && (
              <div style={styles.thumbnailGrid}>
                {previews.map((src, i) => (
                  <div key={i} style={styles.thumbnail}>
                    <img src={src} alt={`preview-${i}`} style={styles.thumbnailImg} />
                    <button style={styles.removeBtn} onClick={() => removeFile(i)}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Location filter */}
            <div style={{ ...styles.cardTitle, marginTop: 24, marginBottom: 16, fontSize: 15 }}>
                            Bước 2: Vị trí ưa thích <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400 }}>(tùy chọn)</span>
            </div>
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Tỉnh / Thành phố</label>
                <input style={styles.input} placeholder="VD: Hà Nội" value={province} onChange={e => setProvince(e.target.value)} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Quận / Huyện</label>
                <input style={styles.input} placeholder="VD: Cầu Giấy" value={district} onChange={e => setDistrict(e.target.value)} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 16, color: "#fca5a5", fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Analyze button */}
            <button
              style={styles.btnPrimary(files.length === 0 || loading)}
              disabled={files.length === 0 || loading}
              onClick={handleAnalyze}
            >
              {result ? "Phân Tích Lại Với Ảnh Mới" : "Phân Tích Với AI"}
            </button>
          </div>
        )}

        {/* ── Tips ── */}
        {!result && !loading && (
          <div style={{ ...styles.card, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div style={styles.cardTitle}>Mẹo để AI nhận dạng chính xác hơn</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#94a3b8", fontSize: 14, lineHeight: "2" }}>
              <li>Chụp ảnh rõ nét, đủ ánh sáng — tránh ảnh mờ hoặc tối</li>
              <li>Chụp bao quát cả căn phòng để AI thấy được nhiều đồ hơn</li>
              <li>Upload nhiều ảnh từ các góc khác nhau để tăng độ chính xác</li>
              <li>Có thể chụp ảnh từng góc phòng: phòng khách, phòng ngủ, bếp...</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
