import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminService from "../services/adminService";

const accentColor = "#00b2d6";

export default function OwnerAuditSessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resFilters, setResFilters] = useState({ search: "", page: 1, pageSize: 10, sortBy: "", sortOrder: "asc" });
  const [toast, setToast] = useState(null);

  // Record results modal
  const defaultRecordModal = { open: false, items: [{ itemName: "", expectedQty: "", actualQty: "", discrepancyReason: "" }], completeSession: false, loading: false };
  const [recordModal, setRecordModal] = useState(defaultRecordModal);

  // Close session modal
  const [closeModal, setCloseModal] = useState({ open: false, notes: "", loading: false });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { fetchDetail(); }, [id]); // eslint-disable-line

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditSessionDetail(id);
      if (res.data.success) setSession(res.data.data);
      else showToast(res.data.message, "error");
    } catch { showToast("Không thể tải chi tiết", "error"); }
    setLoading(false);
  };

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const params = { ...resFilters };
      if (!params.search) delete params.search;
      if (!params.sortBy) delete params.sortBy;
      const res = await adminService.getAuditResults(id, params);
      if (res.data.success) setResults(res.data.data);
    } catch { }
    setResultsLoading(false);
  }, [id, resFilters]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleExport = async () => {
    try {
      const res = await adminService.exportAuditReport(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `BaoCaoKiemKe_${id}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      showToast("Xuất báo cáo thành công");
    } catch { showToast("Lỗi khi xuất báo cáo", "error"); }
  };

  // Record results
  const addItem = () => setRecordModal(p => ({ ...p, items: [...p.items, { itemName: "", expectedQty: "", actualQty: "", discrepancyReason: "" }] }));
  const removeItem = (idx) => setRecordModal(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) => setRecordModal(p => ({ ...p, items: p.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  const handleRecord = async () => {
    let hasError = false;
    for (const item of recordModal.items) {
      if (!item.itemName.trim()) { hasError = true; break; }
      if (item.expectedQty === "" || parseInt(item.expectedQty) < 0) { hasError = true; break; }
      if (item.actualQty === "" || parseInt(item.actualQty) < 0) { hasError = true; break; }
    }
    if (hasError) { showToast("Vui lòng điền đầy đủ thông tin (tên, SL >= 0)", "error"); return; }
    if (recordModal.items.length === 0) { showToast("Vui lòng thêm ít nhất 1 mục", "error"); return; }

    setRecordModal(p => ({ ...p, loading: true }));
    try {
      const payload = {
        items: recordModal.items.map(i => ({ itemName: i.itemName.trim(), expectedQty: parseInt(i.expectedQty), actualQty: parseInt(i.actualQty), discrepancyReason: i.discrepancyReason || null })),
        completeSession: recordModal.completeSession,
      };
      const res = await adminService.recordAuditResults(id, payload);
      if (res.data.success) { showToast(res.data.message); fetchDetail(); fetchResults(); setRecordModal(defaultRecordModal); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setRecordModal(p => ({ ...p, loading: false }));
  };

  // Close session
  const handleClose = async () => {
    setCloseModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.closeAuditSession(id, { notes: closeModal.notes || null });
      if (res.data.success) { showToast(res.data.message); fetchDetail(); setCloseModal({ open: false, notes: "", loading: false }); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setCloseModal(p => ({ ...p, loading: false }));
  };

  const statusLabel = (s) => s === "OPEN" ? "Đang mở" : s === "COMPLETED" ? "Hoàn thành" : s;
  const statusColor = (s) => s === "OPEN" ? "bg-blue-100 text-blue-700" : s === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600";

  if (loading) return <div className="text-center py-16 text-slate-400">Đang tải...</div>;
  if (!session) return <div className="text-center py-16 text-red-500">Không tìm thấy phiên kiểm kê.</div>;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 14, backgroundColor: toast.type === "error" ? "#ef4444" : "#10b981", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate("/owner-audit-sessions")}
            className="text-sm font-semibold mb-2 flex items-center gap-1 transition-colors"
            style={{ color: accentColor, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span> Quay lại
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Phiên kiểm kê #{session.auditId}</h1>
          <p className="text-slate-500 text-sm mt-1">{session.warehouseName} — {session.warehouseAddress}</p>
        </div>
        <div className="flex gap-2">
          {session.status === "OPEN" && (
            <>
              <button
                onClick={() => setRecordModal({ ...defaultRecordModal, open: true })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white shadow-sm transition-all"
                style={{ backgroundColor: accentColor }}
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Ghi nhận kết quả
              </button>
              <button
                onClick={() => setCloseModal({ open: true, notes: "", loading: false })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all"
              >
                🔒 Đóng phiên
              </button>
            </>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg font-bold text-sm border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all"
          >Xuất CSV</button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Trạng thái</div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor(session.status)}`}>
              {statusLabel(session.status)}
            </span>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Người tạo</div>
            <div className="text-sm font-semibold text-slate-800">{session.createdByName}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Ngày tạo</div>
            <div className="text-sm text-slate-600">{session.createdAt ? new Date(session.createdAt).toLocaleString("vi-VN") : "—"}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Hoàn thành</div>
            <div className="text-sm text-slate-600">{session.completedAt ? new Date(session.completedAt).toLocaleString("vi-VN") : "—"}</div>
          </div>
          {session.notes && (
            <div className="col-span-2 md:col-span-4">
              <div className="text-xs font-bold uppercase text-slate-400 mb-1">Ghi chú</div>
              <div className="text-sm text-slate-600">{session.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {session.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Tổng mục", value: session.summary.totalItems, icon: "inventory_2", color: "blue" },
            { label: "Khớp", value: session.summary.matchedItems, icon: "check_circle", color: "emerald" },
            { label: "Chênh lệch", value: session.summary.discrepancyItems, icon: "warning", color: "red" },
            { label: "Tổng chênh lệch", value: session.summary.totalDiscrepancy, icon: "compare_arrows", color: "orange" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-400">{stat.label}</span>
                <div className={`p-1.5 rounded-lg bg-${stat.color}-50`}>
                  <span className={`material-symbols-outlined text-lg text-${stat.color}-500`}>{stat.icon}</span>
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Kết quả kiểm kê</h3>
          <input
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none"
            placeholder="Tìm theo tên hàng..."
            value={resFilters.search}
            onChange={e => setResFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
            style={{ maxWidth: 250 }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ width: 50 }}>ID</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tên hàng hóa</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">SL dự kiến</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">SL thực tế</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Chênh lệch</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Lý do</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày ghi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {resultsLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Đang tải...</td></tr>
              ) : results.items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Chưa có kết quả kiểm kê.</td></tr>
              ) : results.items.map(r => (
                <tr key={r.resultId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500">{r.resultId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.itemName}</td>
                  <td className="px-4 py-3 text-slate-600">{r.expectedQty}</td>
                  <td className="px-4 py-3 text-slate-600">{r.actualQty}</td>
                  <td className="px-4 py-3">
                    {r.discrepancy === 0
                      ? <span className="text-emerald-600 font-bold">0</span>
                      : <span className="text-red-500 font-bold">{r.discrepancy > 0 ? `+${r.discrepancy}` : r.discrepancy}</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.discrepancyReason || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Trang {results.page}/{results.totalPages}</span>
            <div className="flex gap-1">
              {Array.from({ length: results.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setResFilters(prev => ({ ...prev, page: p }))}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${p === results.page ? "text-white" : "bg-slate-100 text-slate-600"}`}
                  style={p === results.page ? { backgroundColor: accentColor } : {}}
                >{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Record Results Modal */}
      {recordModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRecordModal(defaultRecordModal)}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 700, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ghi nhận kết quả kiểm kê</h3>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {recordModal.items.map((item, idx) => (
                <div key={idx} className="grid gap-2 mb-2" style={{ gridTemplateColumns: "2fr 1fr 1fr 2fr auto", alignItems: "start" }}>
                  <input className="px-2 py-1.5 rounded border border-slate-200 text-sm" placeholder="Tên hàng hóa *" value={item.itemName} onChange={e => updateItem(idx, "itemName", e.target.value)} />
                  <input className="px-2 py-1.5 rounded border border-slate-200 text-sm" type="number" min="0" placeholder="SL dự kiến *" value={item.expectedQty} onChange={e => updateItem(idx, "expectedQty", e.target.value)} />
                  <input className="px-2 py-1.5 rounded border border-slate-200 text-sm" type="number" min="0" placeholder="SL thực tế *" value={item.actualQty} onChange={e => updateItem(idx, "actualQty", e.target.value)} />
                  <input className="px-2 py-1.5 rounded border border-slate-200 text-sm" placeholder="Lý do chênh lệch" value={item.discrepancyReason} onChange={e => updateItem(idx, "discrepancyReason", e.target.value)} />
                  {recordModal.items.length > 1 && <button className="px-2 py-1.5 rounded bg-red-50 text-red-500 text-sm font-bold" onClick={() => removeItem(idx)}>✕</button>}
                </div>
              ))}
            </div>
            <button onClick={addItem} className="text-sm font-bold mt-2 px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">+ Thêm mục</button>
            <div className="mt-4 mb-4">
              <label className="text-sm flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={recordModal.completeSession} onChange={e => setRecordModal(p => ({ ...p, completeSession: e.target.checked }))} />
                Hoàn thành phiên kiểm kê sau khi lưu
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRecordModal(defaultRecordModal)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100" disabled={recordModal.loading}>Hủy</button>
              <button onClick={handleRecord} className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: accentColor }} disabled={recordModal.loading}>{recordModal.loading ? "Đang lưu..." : "Lưu kết quả"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {closeModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCloseModal({ open: false, notes: "", loading: false })}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Đóng phiên kiểm kê</h3>
            <div className="flex gap-2 items-center p-3 bg-red-50 rounded-lg mb-4">
              <span className="text-red-500 text-lg">⚠️</span>
              <span className="text-xs text-red-700">Sau khi đóng, phiên kiểm kê sẽ <strong>không thể ghi nhận thêm</strong> kết quả.</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú khi đóng (tùy chọn)</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" rows={3} value={closeModal.notes} onChange={e => setCloseModal(p => ({ ...p, notes: e.target.value }))} placeholder="Nhập ghi chú..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCloseModal({ open: false, notes: "", loading: false })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100" disabled={closeModal.loading}>Hủy</button>
              <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600" disabled={closeModal.loading}>{closeModal.loading ? "Đang xử lý..." : "Xác nhận đóng"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
