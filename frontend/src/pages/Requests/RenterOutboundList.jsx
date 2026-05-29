import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import inventoryService from "../../services/inventoryService";
import { useToast } from "../../context/ToastContext";

/* ── Status config ────────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: "Chờ tiếp nhận", bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  CONFIRMED: { label: "Chờ xử lý tại kho", bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  REJECTED:  { label: "Từ chối",  bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

const Badge = ({ s }) => {
  const c = STATUS_MAP[s] || { label: s, bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: c.dot, display: "inline-block" }} />{c.label}
    </span>
  );
};

const Confirm = ({ msg, label, danger, onOk, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
      <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: danger ? "#fee2e2" : "#e0f7fa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <span className="material-symbols-outlined" style={{ color: danger ? "#ef4444" : "#00b2d6", fontSize: "26px" }}>{danger ? "warning" : "help"}</span>
      </div>
      <p style={{ fontSize: "0.9rem", color: "#374151", margin: "0 0 22px" }}>{msg}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", color: "#64748b" }}>Không</button>
        <button onClick={onOk} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", backgroundColor: danger ? "#ef4444" : "#00b2d6", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>{label}</button>
      </div>
    </div>
  </div>
);

const STATUSES = ["Tất cả", "CONFIRMED", "COMPLETED", "REJECTED"];
const STATUS_LABELS = { "Tất cả": "Tất cả", CONFIRMED: "Chờ xử lý", COMPLETED: "Hoàn thành", REJECTED: "Từ chối" };
const th = { padding: "11px 14px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", userSelect: "none", whiteSpace: "nowrap" };
const td = { padding: "13px 14px", fontSize: "0.875rem", color: "#374151", borderBottom: "1px solid #f8fafc" };

export default function RenterOutboundList() {
  const { showToast } = useToast();
  const location = useLocation();
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sf, setSf]         = useState("Tất cả");
  const [conf, setConf]     = useState(null);
  const [successMsg, setSuccessMsg] = useState(location.state?.created ? "Yêu cầu xuất kho đã được tạo thành công!" : "");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getInventoryRequests({ type: "OUTBOUND", pageSize: 100 });
      const items = res.data?.items || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const filtered = data.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || [
      String(r.invReqId),
      r.items?.[0]?.itemName || "",
      r.warehouseName || "",
    ].some(v => v.toLowerCase().includes(q));
    const matchS = sf === "Tất cả" || r.status === sf;
    return matchQ && matchS;
  });

  const doDelete = async (id) => {
    try {
      await inventoryService.deleteInventoryRequest(id);
      setData(d => d.filter(r => r.invReqId !== id));
      showToast("Đã xóa yêu cầu thành công!", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Không thể xóa yêu cầu.", "error");
    }
    setConf(null);
  };

  const counts = Object.fromEntries(
    STATUSES.slice(1).map(s => [s, data.filter(r => r.status === s).length])
  );

  const exportCSV = () => {
    const rows = [
      ["ID", "Kho", "Mặt hàng", "SL", "Trạng thái", "Ngày tạo"],
      ...filtered.map(r => [
        `#${r.invReqId}`,
        r.warehouseName || "",
        r.items?.[0]?.itemName || "",
        r.items?.reduce((s, i) => s + i.quantity, 0) || 0,
        STATUS_MAP[r.status]?.label || r.status,
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "",
      ]),
    ];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(r => r.join(",")).join("\n"));
    a.download = "xuat-kho.csv";
    a.click();
  };

  return (
    <div style={{ fontFamily: "Inter,sans-serif" }} className="w-full flex-1 flex flex-col min-w-0">

      {/* Success toast */}
      {successMsg && (
        <div style={{ backgroundColor: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#065f46", fontWeight: 600, fontSize: "0.875rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>check_circle</span>
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 800, margin: 0, color: "#111827" }}>Danh sách yêu cầu xuất kho</h1>
          <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "#64748b" }}>Theo dõi và quản lý tất cả các yêu cầu xuất kho của bạn.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", color: "#64748b" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>download</span>Xuất CSV
          </button>
          <Link to="/create-outbound" style={{ display: "flex", alignItems: "center", gap: "5px", padding: "9px 16px", borderRadius: "8px", backgroundColor: "#00b2d6", color: "#fff", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>Tạo yêu cầu mới
          </Link>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
        {Object.entries(counts).map(([s, n]) => {
          const c = STATUS_MAP[s] || {};
          return (
            <button key={s} onClick={() => setSf(s === sf ? "Tất cả" : s)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "20px", border: `1.5px solid ${sf === s ? (c.dot || "#00b2d6") : "#e2e8f0"}`, backgroundColor: sf === s ? (c.bg || "#e0f7fa") : "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", color: sf === s ? (c.color || "#00b2d6") : "#64748b", transition: "all 0.15s" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: c.dot || "#64748b", display: "inline-block" }} />{STATUS_LABELS[s]} <strong>{n}</strong>
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", padding: "12px 14px", marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "#94a3b8" }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo ID, mặt hàng, kho..." style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "0.875rem", boxSizing: "border-box" }} />
        </div>
        <div style={{ position: "relative" }}>
          <select value={sf} onChange={e => setSf(e.target.value)} style={{ padding: "9px 32px 9px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "0.875rem", appearance: "none", backgroundColor: "#fff", cursor: "pointer" }}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <span className="material-symbols-outlined" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "17px", color: "#94a3b8", pointerEvents: "none" }}>expand_more</span>
        </div>
        {(search || sf !== "Tất cả") && <button onClick={() => { setSearch(""); setSf("Tất cả"); }} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Xóa lọc</button>}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={th}>Mã yêu cầu</th>
                <th style={th}>Kho xuất</th>
                <th style={th}>Mặt hàng</th>
                <th style={{ ...th, textAlign: "right" }}>Số lượng</th>
                <th style={th}>Trạng thái</th>
                <th style={th}>Ngày tạo</th>
                <th style={{ ...th, textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>sync</span>Đang tải...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "40px", display: "block", marginBottom: "8px" }}>outbox</span>Không tìm thấy yêu cầu nào
                </td></tr>
              ) : filtered.map(row => {
                const firstItem = row.items?.[0];
                const totalQty = row.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                const unit = firstItem?.unit || "cái";
                return (
                  <tr key={row.invReqId} style={{ backgroundColor: "#fff" }}>
                    <td style={{ ...td, color: "#f59e0b", fontWeight: 700, whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: '0.87rem' }}>#{row.invReqId}</span>
                      {row.requestCode && <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{row.requestCode}</div>}
                    </td>
                    <td style={{ ...td, maxWidth: "160px" }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{row.warehouseName || "—"}</div></td>
                    <td style={{ ...td, maxWidth: "180px" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: "#1e293b" }}>{firstItem?.itemName || "—"}</div>
                      {row.notes && <div style={{ fontSize: "0.73rem", color: "#94a3b8", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes}</div>}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{totalQty.toLocaleString()} <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.8rem" }}>{unit}</span></td>
                    <td style={td}><Badge s={row.status} /></td>
                    <td style={{ ...td, color: "#64748b" }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        {(row.status === "PENDING" || row.status === "CONFIRMED") && (
                          <button title="Xóa" onClick={() => setConf({ id: row.invReqId })} style={{ padding: "5px", border: "none", background: "#fff7ed", borderRadius: "7px", cursor: "pointer", color: "#ea580c", display: "flex" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "11px 14px", borderTop: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Hiển thị {filtered.length}/{data.length} yêu cầu</span>
        </div>
      </div>

      {conf && (
        <Confirm
          msg={`Xóa yêu cầu xuất kho #${conf.id}? Hành động này không thể hoàn tác.`}
          label="Xóa"
          danger
          onOk={() => doDelete(conf.id)}
          onCancel={() => setConf(null)}
        />
      )}
    </div>
  );
}
