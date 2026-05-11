import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import inventoryService from "../../services/inventoryService";
import axiosClient from "../../services/axiosClient";
import { ReceiptPreviewModal } from "../../components/InventoryReceiptPDF";
import ReceiptNotesListModal from "../../components/ReceiptNotesListModal";
import RequestQRCode from "../../components/RequestQRCode";
const INBOUND_COLOR = '#10b981';
const OUTBOUND_COLOR = '#f59e0b';

const STATUS_MAP = {
  PENDING:   { label: "Đang chờ",  bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", border: "#fde68a" },
  CONFIRMED: { label: "Đã duyệt",  bg: "#dcfce7", color: "#166534", dot: "#22c55e", border: "#bbf7d0" },
  RECEIVING: { label: "Đang tiếp nhận", bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff", dot: "#a855f7" },
  COMPLETED: { label: "Hoàn thành",bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6", border: "#bfdbfe" },
  REJECTED:  { label: "Từ chối",   bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", border: "#fecaca" },
};

const Badge = ({ s }) => {
  const c = STATUS_MAP[s] || { label: s, bg: "#f3f4f6", color: "#374151", dot: "#9ca3af", border: "#e5e7eb" };
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: c.dot, flexShrink: 0 }} />{c.label}
    </span>
  );
};

const Confirm = ({ msg, onOk, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.5rem" }}>🗑</div>
      <p style={{ fontSize: "0.92rem", color: "#374151", margin: "0 0 22px", lineHeight: 1.6 }}>{msg}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onCancel} style={{ padding: "9px 22px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", color: "#64748b" }}>Hủy</button>
        <button onClick={onOk} style={{ padding: "9px 22px", borderRadius: 8, border: "none", backgroundColor: "#ef4444", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>Xóa yêu cầu</button>
      </div>
    </div>
  </div>
);

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "REJECTED"];
const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

/* ── Tab Panel ──────────────────────────────────────────────────── */
function TabPanel({ type }) {
  const location = useLocation();
  const accent = type === "INBOUND" ? INBOUND_COLOR : OUTBOUND_COLOR;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [conf, setConf] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [pdfReq, setPdfReq] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [viewNotesReq, setViewNotesReq] = useState(null);
  const [qrReq, setQrReq] = useState(null);
  const [successMsg, setSuccessMsg] = useState(
    location.state?.created && location.state?.type === type
      ? (type === "INBOUND" ? "✅ Yêu cầu nhập kho đã được tạo!" : "✅ Yêu cầu xuất kho đã được tạo!")
      : ""
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getInventoryRequests({ type, pageSize: 100 });
      const items = res.data?.items || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [type]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(""), 4000); return () => clearTimeout(t); } }, [successMsg]);

  const counts = Object.fromEntries(STATUSES.map(s => [s, data.filter(r => r.status === s).length]));
  const total = data.length;

  const filtered = data.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || [String(r.invReqId), r.items?.[0]?.itemName || "", r.warehouseName || "", r.notes || ""].some(v => v.toLowerCase().includes(q));
    const matchS = statusFilter === "ALL" || r.status === statusFilter;
    return matchQ && matchS;
  });

  const doDelete = async (id) => {
    try { await inventoryService.deleteInventoryRequest(id); setData(d => d.filter(r => r.invReqId !== id)); }
    catch (err) { alert(err?.response?.data?.message || "Không thể xóa."); }
    setConf(null);
  };

  const fetchAndShowPdf = async (row) => {
    setPdfLoading(row.invReqId);
    try {
      const res = await axiosClient.get(`/InventoryRequests/${row.invReqId}`);
      setPdfReq(res.data || row);
    } catch {
      setPdfReq(row);
    } finally {
      setPdfLoading(null);
    }
  };


  const card = { background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" };

  return (
    <div style={{ fontFamily: "Inter,sans-serif", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Success toast */}
      {successMsg && (
        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, color: "#166534", fontWeight: 600, fontSize: "0.88rem" }}>
          {successMsg}
        </div>
      )}

      {/* Stats + Actions row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        {/* Status filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setStatusFilter("ALL")}
            style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${statusFilter === "ALL" ? accent : "#e2e8f0"}`, background: statusFilter === "ALL" ? `${accent}18` : "#fff", color: statusFilter === "ALL" ? accent : "#64748b", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}>
            Tất cả <strong>{total}</strong>
          </button>
          {STATUSES.map(s => {
            const c = STATUS_MAP[s]; const n = counts[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s === statusFilter ? "ALL" : s)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${statusFilter === s ? c.dot : "#e2e8f0"}`, background: statusFilter === s ? c.bg : "#fff", color: statusFilter === s ? c.color : "#64748b", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
                {c.label} <strong>{n}</strong>
              </button>
            );
          })}
        </div>
        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>

          <Link to={`/create-inventory?tab=${type === "INBOUND" ? "inbound" : "outbound"}`}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 10, background: `linear-gradient(135deg,${accent},${accent}cc)`, color: "#fff", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", boxShadow: `0 4px 14px ${accent}35` }}>
            Tạo yêu cầu mới
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ ...card, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo ID, mặt hàng, kho, ghi chú..."
            style={{ width: "100%", padding: "9px 12px 9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none", fontSize: "0.875rem", boxSizing: "border-box", fontFamily: "Inter,sans-serif", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
        </div>
        {(search || statusFilter !== "ALL") && (
          <button onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table card */}
      <div style={card}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: "0.88rem" }}>Đang tải dữ liệu...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "#64748b" }}>Không tìm thấy yêu cầu nào</div>
            <div style={{ fontSize: "0.83rem" }}>Thử thay đổi từ khóa hoặc bộ lọc</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[["Mã yêu cầu", "90px"], ["Kho hàng", "150px"], ["Mặt hàng", "auto"], ["Số lượng", "100px", "right"], ["Trạng thái", "120px"], ["Ngày tạo", "110px"], ["", "120px", "center"]].map(([h, w, align], i) => (
                  <th key={i} style={{ padding: "11px 14px", textAlign: align || "left", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", whiteSpace: "nowrap", width: w }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const firstItem = row.items?.[0];
                const totalQty = row.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                const unit = firstItem?.unit || "";
                const hasMultiItems = (row.items?.length || 0) > 1;
                const isExp = expanded === row.invReqId;
                return (
                  <React.Fragment key={row.invReqId}>
                    <tr style={{ borderBottom: isExp ? "none" : "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      {/* ID */}
                      <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 800, color: accent, fontSize: "0.87rem" }}>#{row.invReqId}</span>
                        {row.requestCode && <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{row.requestCode}</div>}
                      </td>
                      {/* Warehouse */}
                      <td style={{ padding: "13px 14px", maxWidth: 150 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.87rem", fontWeight: 500, color: "#374151" }}>{row.warehouseName || "—"}</div>
                      </td>
                      {/* Items */}
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.87rem" }}>{firstItem?.itemName || "—"}</div>
                        {row.notes && <div style={{ fontSize: "0.73rem", color: "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {row.notes}</div>}
                        {firstItem?.description && <div style={{ fontSize: "0.73rem", color: "#94a3b8", marginTop: 1 }}>💬 {firstItem.description}</div>}
                        {hasMultiItems && (
                          <button onClick={() => setExpanded(isExp ? null : row.invReqId)}
                            style={{ marginTop: 4, fontSize: "0.72rem", color: accent, fontWeight: 700, background: `${accent}12`, border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                            {isExp ? "▲ Thu gọn" : `▼ +${row.items.length - 1} mặt hàng nữa`}
                          </button>
                        )}
                      </td>
                      {/* Qty */}
                      <td style={{ padding: "13px 14px", textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>{totalQty.toLocaleString()}</span>
                        {unit && <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.78rem", marginLeft: 3 }}>{unit}</span>}
                      </td>
                      {/* Status */}
                      <td style={{ padding: "13px 14px" }}><Badge s={row.status} /></td>
                      {/* Date */}
                      <td style={{ padding: "13px 14px", color: "#64748b", fontSize: "0.83rem" }}>{fmtDate(row.createdAt)}</td>
                      {/* Actions */}
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        <div style={{ display:'flex', gap:6, justifyContent:'center', alignItems:'center' }}>
                          {row.requestCode && (
                            <button onClick={() => setQrReq(row)}
                              style={{ padding: "4px 10px", border: "1.5px solid #c7d2fe", background: "#eef2ff", borderRadius: 6, cursor: "pointer", color: "#4338ca", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.15s", whiteSpace: "nowrap" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#e0e7ff"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#eef2ff"; }}>
                              QR
                            </button>
                          )}
                          {(row.status === 'RECEIVING' || row.status === 'CONFIRMED') && row.receiptNoteCount > 0 ? (
                            <button onClick={() => setViewNotesReq(row)} 
                                style={{ padding: "4px 10px", border: "1.5px solid #fcd34d", background: "#fefce8", borderRadius: 6, cursor: "pointer", color: "#92400e", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.15s", whiteSpace: "nowrap" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#fef08a"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fefce8"; }}>
                              Ký xác nhận
                            </button>
                          ) : row.receiptNoteCount > 0 ? (
                            <button
                              onClick={() => setViewNotesReq(row)}
                              style={{ padding: "4px 10px", border: "1.5px solid #bfdbfe", background: "#eff6ff", borderRadius: 6, cursor: "pointer", color: "#1d4ed8", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.15s", whiteSpace: "nowrap" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; }}>
                              {row.receiptNoteCount} phiếu
                            </button>
                          ) : null}
                          {row.status === "PENDING" && (
                            <button title="Hủy yêu cầu" onClick={() => setConf({ id: row.invReqId })}
                              style={{ padding: "4px 10px", width: "auto", height: "auto", border: "1.5px solid #fecaca", background: "#fef2f2", borderRadius: 6, cursor: "pointer", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.15s", whiteSpace: "nowrap" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.transform = "translateY(0)"; }}>
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded items */}
                    {isExp && (
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td colSpan={7} style={{ padding: "0 14px 12px 48px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {row.items.map((it, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", borderRadius: 8, background: "#f8fafc", fontSize: "0.83rem" }}>
                                <span style={{ color: "#94a3b8", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                                <span style={{ fontWeight: 600, color: "#1e293b", flex: 1 }}>{it.itemName}</span>
                                <span style={{ color: "#64748b" }}>{it.quantity.toLocaleString()} {it.unit}</span>
                                {it.description && <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>• {it.description}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {/* Footer */}
        {!loading && (
          <div style={{ padding: "11px 16px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Hiển thị <strong style={{ color: "#64748b" }}>{filtered.length}</strong> / {data.length} yêu cầu</span>
          </div>
        )}
      </div>

      {conf && <Confirm msg={`Xóa yêu cầu #${conf.id}? Hành động này không thể hoàn tác.`} onOk={() => doDelete(conf.id)} onCancel={() => setConf(null)} />}
      {pdfReq && <ReceiptPreviewModal data={pdfReq} onClose={() => setPdfReq(null)} />}
      
      {viewNotesReq && (
        <ReceiptNotesListModal
          request={viewNotesReq}
          userRole="RENTER"
          onClose={() => setViewNotesReq(null)}
          onUpdated={fetchData}
        />
      )}

      {qrReq && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24, animation:'fadeIn 0.2s ease-out' }} onClick={() => setQrReq(null)}>
          <div style={{ background:'#fff', borderRadius:28, padding:'32px 32px 40px', width:'100%', maxWidth:380, textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.3)', position:'relative', animation:'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrReq(null)} style={{ position:'absolute', top:20, right:20, background:'#f1f5f9', border:'none', width:36, height:36, borderRadius:'50%', cursor:'pointer', color:'#64748b', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', fontSize:'1rem' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#e2e8f0';e.currentTarget.style.color='#0f172a'}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#64748b'}}>
              ✕
            </button>
            <div style={{ width:56, height:56, background:'linear-gradient(135deg, #e0f2fe, #bae6fd)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'#0284c7', boxShadow:'0 8px 16px rgba(2,132,199,0.15)' }}>
              <span style={{ fontSize: '24px' }}>🚚</span>
            </div>
            
            <h3 style={{ margin:'0 0 6px', fontSize:'1.2rem', fontWeight:900, color:'#0f172a' }}>Mã xuất trình tại kho</h3>
            <p style={{ margin:'0 0 28px', fontSize:'0.85rem', color:'#64748b', lineHeight:1.5 }}>Lưu hình ảnh này gửi cho tài xế để đối chiếu <br/>khi xe đến cổng kho.</p>
            
            <RequestQRCode code={qrReq.requestCode} label="Mã yêu cầu" size={200} requestData={qrReq} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function RenterInventoryHistory() {
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get("tab") === "outbound" ? "outbound" : "inbound";
  const [activeTab, setActiveTab] = useState(initialTab);
  const accent = activeTab === "inbound" ? INBOUND_COLOR : OUTBOUND_COLOR;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 920, margin: "0 auto", paddingBottom: 60 }} className="w-full flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>Lịch sử nhập / xuất kho</h1>
        <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>Theo dõi và quản lý tất cả các yêu cầu nhập kho và xuất kho của bạn.</p>
      </div>

      {/* Tab switcher — pill style đồng bộ với CreateInventoryRequest */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderRadius: 12, background: activeTab === "inbound" ? "#e0f7fa" : "#fff8e1", border: `1.5px solid ${accent}30`, marginBottom: 20, alignItems: "center" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b" }}>Loại yêu cầu:</span>
        {[{ v: "inbound", label: "Nhập kho" }, { v: "outbound", label: "Xuất kho" }].map(({ v, label }) => (
          <button key={v} onClick={() => setActiveTab(v)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 18px", borderRadius: 8, border: `1.5px solid ${activeTab === v ? accent : "#e2e8f0"}`, background: activeTab === v ? accent : "#fff", color: activeTab === v ? "#fff" : "#64748b", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.18s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <TabPanel key={activeTab} type={activeTab === "inbound" ? "INBOUND" : "OUTBOUND"} />
    </div>
  );
}
