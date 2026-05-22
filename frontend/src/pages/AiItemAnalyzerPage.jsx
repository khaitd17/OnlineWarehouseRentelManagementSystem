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
  
  // Smart Filter Bar Styles
  filterCard: {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 20, padding: "24px 28px", marginBottom: 24,
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    marginBottom: 20,
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  filterBadgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  filterBadge: (active) => ({
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: active ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(148, 163, 184, 0.08)",
    border: `1px solid ${active ? "transparent" : "rgba(148, 163, 184, 0.15)"}`,
    color: active ? "#fff" : "#94a3b8",
    transition: "all 0.2s ease",
    boxShadow: active ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
  }),
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
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState(null);
  
  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("image"); // "image" | "search"

  // Smart Search state
  const [searchPrompt, setSearchPrompt] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Smart Filter states
  const [filterDistance, setFilterDistance] = useState("all"); // "all" | "10" | "25" | "50" | "100"
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMinArea, setFilterMinArea] = useState("");
  const [filterFacilities, setFilterFacilities] = useState([]); // Array of strings: "cold", "247", "container", "pccc"
  const [filterSortBy, setFilterSortBy] = useState("ai_score"); // "ai_score" | "distance" | "price_asc" | "rating_desc"

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

  const handleOpenHistory = async () => {
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const res = await aiService.getMySessions();
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí.");
      return;
    }
    setLoadingLocation(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const city = data.address.city || data.address.state || data.address.province || "";
            const dist = data.address.county || data.address.district || data.address.suburb || "";
            if (city) setProvince(city);
            if (dist) setDistrict(dist);
          }
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setError("Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí.");
        setLoadingLocation(false);
      }
    );
  };

  const handleAnalyze = async () => {
    if (files.length === 0) { setError("Vui lòng chọn ít nhất 1 ảnh."); return; }
    if (quota && quota.remaining === 0) { setError(`Bạn đã dùng hết ${quota.dailyLimit} lượt hôm nay. Thử lại ngày mai!`); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await aiService.analyzeItems(files, province || null, district || null, userLat, userLng);
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
      const newItems = [...prev.items, {
        name: "", quantity: 1,
        widthM: 0.3, lengthM: 0.3, heightM: 0.3,
        estimatedVolumeM3: 0.027, isManual: true
      }];
      const newTotal = newItems.reduce((acc, curr) => {
        const q = curr.quantity === "" ? 0 : (curr.quantity || 0);
        const v = curr.estimatedVolumeM3 === "" ? 0 : (curr.estimatedVolumeM3 || 0);
        return acc + q * v;
      }, 0);
      return { ...prev, items: newItems, totalVolumeM3: newTotal.toFixed(2) };
    });
  };

  const handleDimChange = (idx, field, newVal) => {
    let v = newVal === "" ? "" : parseFloat(newVal);
    if (v !== "" && (isNaN(v) || v < 0)) v = 0;
    setResult(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      const item = { ...newItems[idx], [field]: v };
      // Auto-recalculate volume from W × L × H
      const w = field === "widthM"  ? (v === "" ? 0 : v) : (item.widthM  || 0);
      const l = field === "lengthM" ? (v === "" ? 0 : v) : (item.lengthM || 0);
      const h = field === "heightM" ? (v === "" ? 0 : v) : (item.heightM || 0);
      item.estimatedVolumeM3 = parseFloat((w * l * h).toFixed(4)) || 0;
      newItems[idx] = item;
      const newTotal = newItems.reduce((acc, curr) => {
        const q = curr.quantity === "" ? 0 : (curr.quantity || 0);
        const vol = curr.estimatedVolumeM3 === "" ? 0 : (curr.estimatedVolumeM3 || 0);
        return acc + q * vol;
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
        aiNotes: result ? `[AI] ${result.items?.map(i => `${i.name} x${i.quantity}`).join(", ")} — Ước tính ${result.totalVolumeM3} m²` : "",
      }
    });
  };

  // ─── Location keywords detection ────────────────────────────
  const LOCATION_KEYWORDS = [
    "gần tôi", "gần toi", "gan toi", "quanh tôi", "quanh toi",
    "gần đây", "gần day", "gan day", "khu vực tôi", "khu vuc toi",
    "nơi tôi", "noi toi", "chỗ tôi", "cho toi", "vị trí của tôi",
    "vị trí tôi", "vi tri toi", "gần nhất", "gan nhat"
  ];

  const hasLocationKeyword = (text) => {
    const lower = text.toLowerCase();
    return LOCATION_KEYWORDS.some(kw => lower.includes(kw));
  };

  /**
   * Tự động lấy vị trí nếu prompt chứa từ khóa vị trí + chưa có GPS.
   * Trả về {lat, lng} hoặc {lat: null, lng: null}
   */
  const ensureLocationIfNeeded = (promptText) => {
    return new Promise((resolve) => {
      // Nếu đã có vị trí hoặc prompt không chứa keyword → bỏ qua
      if (userLat && userLng) return resolve({ lat: userLat, lng: userLng });
      if (!hasLocationKeyword(promptText)) return resolve({ lat: userLat, lng: userLng });

      // Không hỗ trợ geolocation
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });

      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLat(latitude);
          setUserLng(longitude);
          // Reverse geocode
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
            const data = await res.json();
            if (data?.address) {
              const city = data.address.city || data.address.state || data.address.province || "";
              const dist = data.address.county || data.address.district || data.address.suburb || "";
              if (city) setProvince(city);
              if (dist) setDistrict(dist);
            }
          } catch (e) { console.error("Reverse geocoding failed", e); }
          setLoadingLocation(false);
          resolve({ lat: latitude, lng: longitude });
        },
        () => {
          // User denied → vẫn tiếp tục search mà không có vị trí
          setLoadingLocation(false);
          resolve({ lat: null, lng: null });
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    });
  };

  // ─── Smart Search handler ───────────────────────────────────
  const handleSmartSearch = async () => {
    if (!searchPrompt.trim()) { setSearchError("Vui lòng nhập mô tả nhu cầu tìm kho."); return; }
    if (quota && quota.remaining === 0) { setSearchError(`Bạn đã dùng hết ${quota.dailyLimit} lượt hôm nay.`); return; }
    setSearchLoading(true); setSearchError(null); setSearchResult(null);
    try {
      // Auto-detect location keywords → request GPS if needed
      const loc = await ensureLocationIfNeeded(searchPrompt);
      const res = await aiService.smartSearch(searchPrompt, loc.lat, loc.lng);
      setSearchResult(res.data);
      setQuota(prev => prev ? { ...prev, remaining: prev.remaining - 1, usedToday: prev.usedToday + 1 } : null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Tìm kiếm thất bại. Vui lòng thử lại.";
      setSearchError(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  const quickChips = [
    "Giá rẻ nhất", "Gần tôi nhất", "Đánh giá cao nhất",
    "Mở cửa 24/7", "Kho lạnh", "Diện tích lớn"
  ];

  const handleChipClick = (chip) => {
    setSearchPrompt(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, ${chip.toLowerCase()}` : chip;
    });
  };

  const handleFollowUp = async (suggestion) => {
    setSearchPrompt(suggestion);
    setSearchResult(null);
    setSearchLoading(true); setSearchError(null);
    try {
      const loc = await ensureLocationIfNeeded(suggestion);
      const res = await aiService.smartSearch(suggestion, loc.lat, loc.lng);
      setSearchResult(res.data);
      setQuota(prev => prev ? { ...prev, remaining: prev.remaining - 1, usedToday: prev.usedToday + 1 } : null);
    } catch (err) {
      setSearchError(err?.response?.data?.message || "Tìm kiếm thất bại.");
    } finally {
      setSearchLoading(false);
    }
  };

  const getFilteredAndSortedWarehouses = (warehouses, isSmartSearch = false) => {
    if (!warehouses) return [];
    
    let list = [...warehouses];
    
    // 1. Filter by Max Distance
    if (filterDistance !== "all") {
      const maxDist = parseFloat(filterDistance);
      list = list.filter(w => w.distanceKm !== null && w.distanceKm !== undefined && w.distanceKm <= maxDist);
    }
    
    // 2. Filter by Max Price
    if (filterMaxPrice) {
      const maxPrice = parseFloat(filterMaxPrice);
      list = list.filter(w => w.pricePerM2 !== null && w.pricePerM2 !== undefined && w.pricePerM2 <= maxPrice);
    }
    
    // 3. Filter by Min Area
    if (filterMinArea) {
      const minArea = parseFloat(filterMinArea);
      list = list.filter(w => w.availableArea !== null && w.availableArea !== undefined && w.availableArea >= minArea);
    }
    
    // 4. Filter by Facilities
    if (filterFacilities.length > 0) {
      list = list.filter(w => {
        return filterFacilities.every(fac => {
          if (fac === "cold") {
            return w.warehouseType && w.warehouseType.toLowerCase().includes("lạnh");
          }
          if (fac === "247") {
            return w.is24HoursAccess === true;
          }
          if (fac === "container") {
            const text = ((w.matchReason || "") + " " + (w.explanation || "") + " " + (w.pros?.join(" ") || "")).toLowerCase();
            return text.includes("container") || text.includes("xe cont");
          }
          if (fac === "pccc") {
            const text = ((w.matchReason || "") + " " + (w.explanation || "") + " " + (w.pros?.join(" ") || "")).toLowerCase();
            return text.includes("pccc") || text.includes("phòng cháy");
          }
          return true;
        });
      });
    }
    
    // 5. Sort by selected option
    list.sort((a, b) => {
      if (filterSortBy === "ai_score") {
        const scoreA = isSmartSearch ? (a.matchScore || 0) : (1 / (a.rank || 1));
        const scoreB = isSmartSearch ? (b.matchScore || 0) : (1 / (b.rank || 1));
        return scoreB - scoreA;
      }
      if (filterSortBy === "distance") {
        const distA = a.distanceKm !== null && a.distanceKm !== undefined ? a.distanceKm : 999999;
        const distB = b.distanceKm !== null && b.distanceKm !== undefined ? b.distanceKm : 999999;
        return distA - distB;
      }
      if (filterSortBy === "price_asc") {
        const priceA = a.pricePerM2 !== null && a.pricePerM2 !== undefined ? a.pricePerM2 : 999999;
        const priceB = b.pricePerM2 !== null && b.pricePerM2 !== undefined ? b.pricePerM2 : 999999;
        return priceA - priceB;
      }
      if (filterSortBy === "rating_desc") {
        const ratingA = a.averageRating !== null && a.averageRating !== undefined ? a.averageRating : 0;
        const ratingB = b.averageRating !== null && b.averageRating !== undefined ? b.averageRating : 0;
        return ratingB - ratingA;
      }
      return 0;
    });
    
    return list;
  };

  const toggleFacility = (facility) => {
    setFilterFacilities(prev =>
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  const handleResetFilters = () => {
    setFilterDistance("all");
    setFilterMaxPrice("");
    setFilterMinArea("");
    setFilterFacilities([]);
    setFilterSortBy("ai_score");
    setProvince("");
    setDistrict("");
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return "#22c55e";
    if (score >= 0.6) return "#f59e0b";
    return "#ef4444";
  };

  const displaySuggestedWarehouses = result ? getFilteredAndSortedWarehouses(result.suggestedWarehouses, false) : [];
  const displaySearchWarehouses = searchResult ? getFilteredAndSortedWarehouses(searchResult.warehouses, true) : [];

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
            {activeTab === "image"
              ? "Chụp ảnh đồ vật → AI nhận dạng & ước tính diện tích → Hệ thống gợi ý kho phù hợp nhất"
              : "Mô tả nhu cầu của bạn → AI phân tích & xếp hạng kho → Tìm kho phù hợp nhất"}
          </p>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{
          display: "flex", gap: 0, marginBottom: 28,
          background: "rgba(30,41,59,0.6)",
          borderRadius: 14, padding: 4,
          border: "1px solid rgba(99,102,241,0.15)"
        }}>
          {[
            { key: "image", label: "Phân tích ảnh" },
            { key: "search", label: "Tìm kiếm thông minh" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: "12px 20px",
                background: activeTab === tab.key
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "transparent",
                border: "none", borderRadius: 11,
                color: activeTab === tab.key ? "#fff" : "#94a3b8",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: activeTab === tab.key ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
                fontFamily: "inherit",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Quota bar ── */}
        {quota && (
          <div style={{ ...styles.card, padding: "16px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ ...styles.quotaBar, flex: 1, marginBottom: 0, minWidth: 250 }}>
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
            <button
              onClick={handleOpenHistory}
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a78bfa",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              Lịch sử phân tích
            </button>
          </div>
        )}

        {/* ── Smart Filter & Sort Bar ── */}
        <div style={styles.filterCard}>
          <div style={{ ...styles.cardTitle, marginBottom: 16, borderBottom: "1px solid rgba(99,102,241,0.15)", paddingBottom: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#a78bfa" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Bộ Lọc & Sắp Xếp Thông Minh
            </span>
            {(filterDistance !== "all" || filterMaxPrice || filterMinArea || filterFacilities.length > 0 || province || district) && (
              <button
                onClick={handleResetFilters}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                ✕ Đặt lại bộ lọc
              </button>
            )}
          </div>

          <div style={styles.filterGrid}>
            {/* Cột 1: Vị trí & Khoảng cách */}
            <div style={styles.filterItem}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={styles.label}>Khu vực & Định vị</span>
                <button
                  onClick={handleGetLocation}
                  disabled={loadingLocation}
                  style={{
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    color: "#a78bfa",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: loadingLocation ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {loadingLocation ? "Đang định vị..." : "GPS"}
                </button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <input
                  style={styles.input}
                  placeholder="Tỉnh/TP"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                />
              </div>
              <span style={styles.label}>Khoảng cách tối đa</span>
              <select
                value={filterDistance}
                onChange={e => setFilterDistance(e.target.value)}
                style={styles.input}
              >
                <option value="all">Tất cả khoảng cách</option>
                <option value="10">Dưới 10 km (Rất gần)</option>
                <option value="25">Dưới 25 km (Tiện đi lại)</option>
                <option value="50">Dưới 50 km</option>
                <option value="100">Dưới 100 km</option>
              </select>
            </div>

            {/* Cột 2: Ngân sách & Diện tích */}
            <div style={styles.filterItem}>
              <span style={styles.label}>Giá thuê tối đa (₫/m²)</span>
              <input
                type="number"
                min="0"
                style={{ ...styles.input, marginBottom: 12 }}
                placeholder="Nhập giá tối đa (VD: 80000)"
                value={filterMaxPrice}
                onChange={e => setFilterMaxPrice(e.target.value)}
              />
              <span style={styles.label}>Diện tích tối thiểu (m²)</span>
              <input
                type="number"
                min="0"
                style={styles.input}
                placeholder="Nhập diện tích tối thiểu"
                value={filterMinArea}
                onChange={e => setFilterMinArea(e.target.value)}
              />
            </div>

            {/* Cột 3: Sắp xếp & Tiện ích */}
            <div style={styles.filterItem}>
              <span style={styles.label}>Sắp xếp kết quả</span>
              <select
                value={filterSortBy}
                onChange={e => setFilterSortBy(e.target.value)}
                style={{ ...styles.input, marginBottom: 12 }}
              >
                <option value="ai_score">Phù hợp nhất (AI)</option>
                <option value="distance">Khoảng cách gần nhất</option>
                <option value="price_asc">Giá thuê thấp nhất</option>
                <option value="rating_desc">Đánh giá cao nhất</option>
              </select>
              <span style={styles.label}>Tiện ích chọn nhanh</span>
              <div style={styles.filterBadgeRow}>
                <button
                  onClick={() => toggleFacility("cold")}
                  style={styles.filterBadge(filterFacilities.includes("cold"))}
                >
                  Kho lạnh
                </button>
                <button
                  onClick={() => toggleFacility("247")}
                  style={styles.filterBadge(filterFacilities.includes("247"))}
                >
                  Mở 24/7
                </button>
                <button
                  onClick={() => toggleFacility("container")}
                  style={styles.filterBadge(filterFacilities.includes("container"))}
                >
                  Xe cont
                </button>
                <button
                  onClick={() => toggleFacility("pccc")}
                  style={styles.filterBadge(filterFacilities.includes("pccc"))}
                >
                  PCCC chuẩn
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ TAB: IMAGE ANALYSIS ══════════ */}
        {activeTab === "image" && (<>
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
                <div style={styles.statVal}>{result.totalVolumeM3} m²</div>
                <div style={styles.statLabel}>diện tích cần thiết</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statVal}>{displaySuggestedWarehouses.length}</div>
                <div style={styles.statLabel}>Kho phù hợp</div>
              </div>
            </div>

            {/* AI Analysis card */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Kết Quả Phân Tích AI
              </div>

              <table style={{ ...styles.table, fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Dố Vật</th>
                    <th style={styles.th}>Số Lượng</th>
                    <th style={{ ...styles.th, color: "#60a5fa" }}>Rộng (m)</th>
                    <th style={{ ...styles.th, color: "#34d399" }}>Dài (m)</th>
                    <th style={{ ...styles.th, color: "#f59e0b" }}>Cao (m)</th>
                    <th style={{ ...styles.th, color: "#a78bfa" }}>diện tích/cái (m²)</th>
                    <th style={{ ...styles.th, color: "#818cf8" }}>Tổng (m²)</th>
                    <th style={{ ...styles.th, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {result.items?.map((item, i) => (
                    <tr key={i}>
                      {/* Tên đồ vật */}
                      <td style={styles.td}>
                        <input type="text" value={item.name}
                          onChange={(e) => handleItemNameChange(i, e.target.value)}
                          style={{ width: "100%", minWidth: 100, padding: "5px 7px", borderRadius: 6,
                            border: "1px solid rgba(148,163,184,0.3)",
                            background: "transparent", color: "#fff", outline: "none", fontFamily: "inherit" }}
                        />
                      </td>
                      {/* Số lượng */}
                      <td style={styles.td}>
                        <input type="number" min="0" value={item.quantity}
                          onChange={(e) => handleQuantityChange(i, e.target.value)}
                          style={{ width: 52, padding: "5px 7px", borderRadius: 6,
                            border: "1px solid rgba(148,163,184,0.3)",
                            background: "rgba(15,23,42,0.4)", color: "#fff", outline: "none", fontFamily: "inherit" }}
                        />
                      </td>
                      {/* Chiều rộng */}
                      <td style={styles.td}>
                        <input type="number" min="0" step="0.01" value={item.widthM ?? ""}
                          onChange={(e) => handleDimChange(i, "widthM", e.target.value)}
                          style={{ width: 64, padding: "5px 7px", borderRadius: 6,
                            border: "1px solid rgba(96,165,250,0.4)",
                            background: "rgba(15,23,42,0.4)", color: "#93c5fd", outline: "none", fontFamily: "inherit" }}
                        />
                      </td>
                      {/* Chiều dài */}
                      <td style={styles.td}>
                        <input type="number" min="0" step="0.01" value={item.lengthM ?? ""}
                          onChange={(e) => handleDimChange(i, "lengthM", e.target.value)}
                          style={{ width: 64, padding: "5px 7px", borderRadius: 6,
                            border: "1px solid rgba(52,211,153,0.4)",
                            background: "rgba(15,23,42,0.4)", color: "#6ee7b7", outline: "none", fontFamily: "inherit" }}
                        />
                      </td>
                      {/* Chiều cao */}
                      <td style={styles.td}>
                        <input type="number" min="0" step="0.01" value={item.heightM ?? ""}
                          onChange={(e) => handleDimChange(i, "heightM", e.target.value)}
                          style={{ width: 64, padding: "5px 7px", borderRadius: 6,
                            border: "1px solid rgba(245,158,11,0.4)",
                            background: "rgba(15,23,42,0.4)", color: "#fcd34d", outline: "none", fontFamily: "inherit" }}
                        />
                      </td>
                      {/* diện tích/cái (auto) */}
                      <td style={{ ...styles.td, color: "#c4b5fd", fontWeight: 600 }}>
                        {(item.estimatedVolumeM3 || 0).toFixed(3)}
                      </td>
                      {/* Tổng */}
                      <td style={{ ...styles.td, fontWeight: 700, color: "#a78bfa" }}>
                        {((item.estimatedVolumeM3 || 0) * (item.quantity === "" ? 0 : (item.quantity || 0))).toFixed(2)}
                      </td>
                      {/* Xóa */}
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <button onClick={() => handleRemoveItem(i)} title="Xóa đồ vật"
                          style={{ background: "none", border: "none", cursor: "pointer",
                            color: "#ef4444", fontSize: 18, padding: "2px 6px",
                            borderRadius: 6, opacity: 0.6 }}
                          onMouseEnter={e => e.target.style.opacity = 1}
                          onMouseLeave={e => e.target.style.opacity = 0.6}
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#e2e8f0" }}>Tổng cộng</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#e2e8f0" }}>
                      {result.items?.reduce((acc, curr) => acc + (curr.quantity === "" ? 0 : (curr.quantity || 0)), 0) || 0}
                    </td>
                    <td style={styles.td}></td>
                    <td style={styles.td}></td>
                    <td style={styles.td}></td>
                    <td style={styles.td}></td>
                    <td style={{ ...styles.td, fontWeight: 800, fontSize: 17, color: "#818cf8" }}>{result.totalVolumeM3} m²</td>
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
            {displaySuggestedWarehouses.length > 0 ? (
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                Top {displaySuggestedWarehouses.length} Kho Phù Hợp
              </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {displaySuggestedWarehouses.map((wh) => (
                    <div
                      key={wh.warehouseId}
                      className="wh-card"
                      style={styles.whCard}
                    >
                      {wh.imageUrl && (
                        <img 
                          src={wh.imageUrl.startsWith('http') ? wh.imageUrl : `http://localhost:5000${wh.imageUrl}`} 
                          alt={wh.name} 
                          style={styles.whImg} 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }} 
                        />
                      )}
                      <div 
                        style={{
                          ...styles.whImgPlaceholder, 
                          display: wh.imageUrl ? 'none' : 'flex'
                        }}
                      >
                        <WarehouseIcon />
                      </div>
                      <div style={styles.whInfo}>
                        <div style={styles.whName}>{wh.name}</div>
                        <div style={styles.whAddress}>{wh.address}</div>
                        <div style={styles.whTags}>
                          {wh.warehouseType && <span style={styles.tag("purple")}>{wh.warehouseType}</span>}
                          <span style={styles.tag("none")}>{wh.availableArea} m²</span>
                          {wh.availableVolume && <span style={styles.tag("green")}>{wh.availableVolume} m² trống</span>}
                          {wh.is24HoursAccess && <span style={styles.tag("green")}>24/7</span>}
                          {wh.distanceKm !== null && wh.distanceKm !== undefined && <span style={styles.tag("purple")}>Cách bạn {wh.distanceKm} km</span>}
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
        </>)}

        {/* ══════════ TAB: SMART SEARCH ══════════ */}
        {activeTab === "search" && (
          <>
            {/* Search Results */}
            {searchResult && (
              <>
                {/* AI Summary Banner */}
                <div style={{
                  ...styles.card,
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                  borderColor: "rgba(99,102,241,0.3)",
                  padding: "20px 24px"
                }}>
                  <div style={{ fontSize: 15, color: "#e2e8f0", lineHeight: 1.6 }}>
                    {searchResult.aiSummary}
                  </div>
                </div>

                {/* Ranked Warehouses */}
                {displaySearchWarehouses.length > 0 ? (
                  <div style={styles.card}>
                    <div style={styles.cardTitle}>
                      Top {displaySearchWarehouses.length} kho phù hợp nhất
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {displaySearchWarehouses.map((wh) => (
                        <div key={wh.warehouseId} className="wh-card" style={{
                          ...styles.whCard, flexDirection: "column", gap: 0,
                          border: wh.rank === 1 ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(148,163,184,0.1)"
                        }}>
                          {/* Header row */}
                          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                            {wh.imageUrl && (
                              <img
                                src={wh.imageUrl.startsWith('http') ? wh.imageUrl : `http://localhost:5000${wh.imageUrl}`}
                                alt={wh.name}
                                style={styles.whImg}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            {!wh.imageUrl && (
                              <div style={styles.whImgPlaceholder}>
                                <WarehouseIcon />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                <span style={{
                                  background: wh.rank <= 3 ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(148,163,184,0.2)",
                                  color: "#fff", borderRadius: 8,
                                  padding: "2px 10px", fontSize: 13, fontWeight: 700,
                                  minWidth: 28, textAlign: "center"
                                }}>#{wh.rank}</span>
                                <span style={styles.whName}>{wh.name}</span>
                              </div>
                              <div style={styles.whAddress}>{wh.address}</div>
                              <div style={styles.whTags}>
                                {wh.warehouseType && <span style={styles.tag("purple")}>{wh.warehouseType}</span>}
                                <span style={styles.tag("none")}>{wh.availableArea} m² trống</span>
                                {wh.pricePerM2 && <span style={styles.tag("none")}>{Number(wh.pricePerM2).toLocaleString("vi-VN")} ₫/m²</span>}
                                {wh.is24HoursAccess && <span style={styles.tag("green")}>24/7</span>}
                                {wh.distanceKm != null && <span style={styles.tag("purple")}>Cách {wh.distanceKm} km</span>}
                              </div>
                            </div>
                            {/* Match Score */}
                            <div style={{ textAlign: "center", flexShrink: 0 }}>
                              <div style={{
                                width: 56, height: 56, borderRadius: "50%",
                                border: `3px solid ${getScoreColor(wh.matchScore)}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexDirection: "column"
                              }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: getScoreColor(wh.matchScore) }}>
                                  {Math.round(wh.matchScore * 100)}
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>% phù hợp</div>
                            </div>
                          </div>

                          {/* AI Explanation */}
                          <div style={{
                            background: "rgba(99,102,241,0.06)",
                            borderRadius: 10, padding: "10px 14px", marginBottom: 10,
                            fontSize: 13, color: "#cbd5e1", lineHeight: 1.5,
                            borderLeft: "3px solid rgba(99,102,241,0.4)"
                          }}>
                            {wh.explanation}
                          </div>

                          {/* Pros & Cons */}
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                            {wh.pros?.map((p, i) => (
                              <span key={`p${i}`} style={{
                                padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                                background: "rgba(34,197,94,0.12)", color: "#4ade80"
                              }}>+ {p}</span>
                            ))}
                            {wh.cons?.map((c, i) => (
                              <span key={`c${i}`} style={{
                                padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                                background: "rgba(239,68,68,0.12)", color: "#f87171"
                              }}>- {c}</span>
                            ))}
                          </div>

                          {/* Rating + CTA */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <StarRating value={wh.averageRating} />
                              {wh.ratingCount > 0 && <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>({wh.ratingCount} đánh giá)</span>}
                            </div>
                            <button
                              className="rent-btn"
                              style={styles.rentBtn}
                              onClick={() => goToWarehouse(wh)}
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ ...styles.card, textAlign: "center", padding: "40px 24px" }}>
                    <div style={{ color: "#94a3b8", fontSize: 15 }}>Không tìm thấy kho phù hợp với yêu cầu. Hãy thử mô tả khác.</div>
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {searchResult.followUpSuggestions?.length > 0 && (
                  <div style={{ ...styles.card, padding: "16px 24px" }}>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>Gợi ý tìm kiếm tiếp theo:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {searchResult.followUpSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleFollowUp(s)}
                          style={{
                            padding: "8px 16px", borderRadius: 999,
                            background: "rgba(99,102,241,0.1)",
                            border: "1px solid rgba(99,102,241,0.25)",
                            color: "#a78bfa", fontSize: 13, cursor: "pointer",
                            fontFamily: "inherit", transition: "all 0.2s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Search Input Form */}
            {searchLoading ? (
              <div style={styles.card}>
                <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
                  <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>AI đang phân tích kho...</div>
                  <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Quá trình này mất khoảng 5-15 giây</div>
                </div>
                <LoadingSkeleton />
              </div>
            ) : (
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  {searchResult ? "Tìm kiếm lại" : "Mô tả nhu cầu kho của bạn"}
                </div>

                {/* Prompt textarea */}
                <textarea
                  value={searchPrompt}
                  onChange={e => setSearchPrompt(e.target.value)}
                  placeholder="VD: Tìm kho gần Hà Nội, giá dưới 200.000₫/m², có mở cửa 24/7, đánh giá cao..."
                  rows={3}
                  style={{
                    ...styles.input,
                    resize: "vertical", minHeight: 80, lineHeight: 1.6,
                    fontFamily: "inherit", fontSize: 15
                  }}
                />

                {/* Quick filter chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  {quickChips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      style={{
                        padding: "6px 14px", borderRadius: 999,
                        background: "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        color: "#818cf8", fontSize: 13, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
                    >{chip}</button>
                  ))}
                </div>



                {/* Error */}
                {searchError && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 16, color: "#fca5a5", fontSize: 14 }}>
                    {searchError}
                  </div>
                )}

                {/* Search button */}
                <button
                  style={styles.btnPrimary(!searchPrompt.trim() || searchLoading)}
                  disabled={!searchPrompt.trim() || searchLoading}
                  onClick={handleSmartSearch}
                >
                  {searchResult ? "Tìm Kiếm Lại" : "Tìm Kiếm Với AI"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── History Modal ── */}
      {showHistory && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...styles.card, margin: 0, width: "100%", maxWidth: 700, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>Lịch sử phân tích</div>
              <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ overflowY: "auto", paddingRight: 8 }}>
              {loadingHistory ? (
                <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>Đang tải lịch sử...</div>
              ) : history.length === 0 ? (
                <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>Chưa có dữ liệu phân tích nào.</div>
              ) : (
                <table style={{ ...styles.table, fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Thời gian</th>
                      <th style={styles.th}>diện tích</th>
                      <th style={styles.th}>Loại kho gợi ý</th>
                      <th style={styles.th}>Độ chính xác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <React.Fragment key={item.sessionId}>
                        <tr 
                          onClick={() => setExpandedSessionId(prev => prev === item.sessionId ? null : item.sessionId)}
                          style={{ cursor: "pointer", backgroundColor: expandedSessionId === item.sessionId ? "rgba(99,102,241,0.1)" : "transparent" }}
                        >
                          <td style={styles.td}>{new Date(item.analyzedAt).toLocaleString("vi-VN")}</td>
                          <td style={{ ...styles.td, color: "#818cf8", fontWeight: 600 }}>{item.estimatedVolumeM3} m²</td>
                          <td style={styles.td}>{item.suggestedType}</td>
                          <td style={styles.td}><ConfidenceBadge value={item.confidence} /></td>
                        </tr>
                        {expandedSessionId === item.sessionId && item.resultJson && (
                          <tr>
                            <td colSpan="4" style={{ padding: "16px", backgroundColor: "rgba(15,23,42,0.5)", borderBottom: "1px solid rgba(148,163,184,0.05)" }}>
                              <div style={{ fontSize: 13, color: "#cbd5e1" }}>
                                <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>Chi tiết đồ vật nhận diện:</div>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: "left", padding: "4px 8px", color: "#94a3b8" }}>Tên đồ vật</th>
                                      <th style={{ textAlign: "center", padding: "4px 8px", color: "#94a3b8" }}>Số lượng</th>
                                      <th style={{ textAlign: "right", padding: "4px 8px", color: "#94a3b8" }}>Kích thước (m)</th>
                                      <th style={{ textAlign: "right", padding: "4px 8px", color: "#94a3b8" }}>diện tích/cái (m²)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      try {
                                        const parsed = JSON.parse(item.resultJson);
                                        const items = parsed.Items || parsed.items;
                                        if (!items || items.length === 0) return <tr><td colSpan="4" style={{ padding: "4px 8px" }}>Không có chi tiết đồ vật</td></tr>;
                                        return items.map((det, idx) => (
                                          <tr key={idx}>
                                            <td style={{ padding: "4px 8px", borderTop: "1px solid rgba(148,163,184,0.1)" }}>{det.Name || det.name}</td>
                                            <td style={{ textAlign: "center", padding: "4px 8px", borderTop: "1px solid rgba(148,163,184,0.1)" }}>{det.Quantity ?? det.quantity}</td>
                                            <td style={{ textAlign: "right", padding: "4px 8px", borderTop: "1px solid rgba(148,163,184,0.1)", color: "#94a3b8" }}>
                                              {(det.WidthM ?? det.widthM)} x {(det.LengthM ?? det.lengthM)} x {(det.HeightM ?? det.heightM)}
                                            </td>
                                            <td style={{ textAlign: "right", padding: "4px 8px", borderTop: "1px solid rgba(148,163,184,0.1)", color: "#c4b5fd" }}>
                                              {(det.EstimatedVolumeM3 ?? det.estimatedVolumeM3)?.toFixed(3)}
                                            </td>
                                          </tr>
                                        ));
                                      } catch (e) {
                                        return <tr><td colSpan="4" style={{ padding: "4px 8px" }}>Không thể hiển thị chi tiết</td></tr>;
                                      }
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

