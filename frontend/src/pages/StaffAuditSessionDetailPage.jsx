import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminService from "../services/adminService";

const accentColor = "#00b2d6";

export default function StaffAuditSessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resFilters, setResFilters] = useState({ search: "", page: 1, pageSize: 10, filterStatus: "all" });
  const [toast, setToast] = useState(null);
  // ID người dùng hiện tại — so sánh với assignedTo
  const currentUserId = parseInt(JSON.parse(localStorage.getItem('user') || '{}')?.userId || '0');

  const defaultRecordModal = { open: false, items: [], completeSession: false, loading: false };
  const [recordModal, setRecordModal] = useState(defaultRecordModal);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

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
      const res = await adminService.getAuditResults(id, params);
      if (res.data.success) setResults(res.data.data);
    } catch { }
    setResultsLoading(false);
  }, [id, resFilters]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Fetch items to audit based on session creator & merge with existing results
  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      // Lấy danh sách hàng cần kiểm kê
      const invRes = await adminService.getAuditSessionInventory(id);
      // Lấy kết quả đã ghi nhận trước đó (tất cả, pageSize lớn)
      const resRes = await adminService.getAuditResults(id, { page: 1, pageSize: 9999 });

      const items = invRes.data.success ? (invRes.data.data || []) : [];
      setInventoryItems(items);

      const existingResults = resRes.data.success ? (resRes.data.data?.items || []) : [];

      // Tạo map kết quả đã ghi theo itemName
      const existingMap = {};
      existingResults.forEach(r => {
        existingMap[r.itemName?.trim()?.toLowerCase()] = r;
      });

      // Merge: pre-fill actualQty & discrepancyReason từ kết quả cũ
      setRecordModal(p => ({
        ...p,
        items: items.map(inv => {
          const key = (inv.itemName || inv.item_name || "").trim().toLowerCase();
          const prev = existingMap[key];
          return {
            itemName: inv.itemName || inv.item_name,
            expectedQty: inv.quantity,
            actualQty: prev ? String(prev.actualQty) : "",
            discrepancyReason: prev ? (prev.discrepancyReason || "") : ""
          };
        })
      }));
    } catch {
      setInventoryItems([]);
    }
    setInventoryLoading(false);
  };

  const openRecordModal = () => {
    setRecordModal({ ...defaultRecordModal, open: true });
    fetchInventory();
  };

  // Record results
  const updateItem = (idx, field, value) => {
    setRecordModal(p => ({
      ...p,
      items: p.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  };

  const handleRecord = async () => {
    // Validation: tất cả items phải có actualQty
    const emptyItems = recordModal.items.filter(i => i.actualQty === "" || i.actualQty === null || i.actualQty === undefined);
    if (emptyItems.length > 0) {
      showToast(`Vui lòng nhập số lượng thực tế cho tất cả ${recordModal.items.length} mục hàng hóa. Còn ${emptyItems.length} mục chưa nhập.`, "error");
      return;
    }

    for (const item of recordModal.items) {
      if (parseInt(item.actualQty) < 0) { showToast("Số lượng thực tế phải >= 0", "error"); return; }

      if (parseInt(item.actualQty) !== parseInt(item.expectedQty) && (!item.discrepancyReason || !item.discrepancyReason.trim())) {
        showToast(`Hàng hóa "${item.itemName || "vô danh"}" có chênh lệch, vui lòng nhập lý do`, "error"); return;
      }
    }

    setRecordModal(p => ({ ...p, loading: true }));
    try {
      const payload = {
        items: recordModal.items.map(i => ({ itemName: i.itemName.trim(), expectedQty: parseInt(i.expectedQty), actualQty: parseInt(i.actualQty), discrepancyReason: i.discrepancyReason || null })),
        completeSession: recordModal.completeSession,
      };
      const res = await adminService.recordAuditResults(id, payload);
      if (res.data.success) { showToast(res.data.message); fetchDetail(); fetchResults(); setRecordModal(defaultRecordModal); }
      else showToast(res.data.message, "error");
    } catch (e) {
      const msg = e.response?.data?.message || "Lỗi";
      // Hiển thị thông báo rõ ràng khi phiên đã bị đóng/hủy
      if (msg.includes("đã đóng") || msg.includes("đã hủy") || msg.includes("Thất bại")) {
        showToast(msg, "error");
        fetchDetail(); // Refresh lại để cập nhật trạng thái
      } else {
        showToast(msg, "error");
      }
    }
    setRecordModal(p => ({ ...p, loading: false }));
  };



  const statusLabel = (s) => {
    const map = { APPROVED: "Chờ kiểm kê", IN_PROGRESS: "Đang kiểm kê", COMPLETED: "Hoàn thành", PENDING_APPROVAL: "Chờ duyệt", OPEN: "Đang mở", CANCELLED: "Đã hủy", REJECTED: "Từ chối" };
    return map[s] || s;
  };
  const statusColor = (s) => {
    const map = { APPROVED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-purple-100 text-purple-700", COMPLETED: "bg-emerald-100 text-emerald-700", PENDING_APPROVAL: "bg-yellow-100 text-yellow-700", OPEN: "bg-blue-100 text-blue-700", CANCELLED: "bg-red-100 text-red-700", REJECTED: "bg-red-100 text-red-700" };
    return map[s] || "bg-slate-100 text-slate-600";
  };

  if (loading) return <div className="text-center py-16 text-slate-400">Đang tải...</div>;
  if (!session) return <div className="text-center py-16 text-red-500">Không tìm thấy phiên kiểm kê.</div>;

  // Chỉ người được giao (assignedTo) mới ghi được; session phải APPROVED hoặc IN_PROGRESS
  const isAssignedToMe = session.assignedTo === currentUserId || session.assignedToId === currentUserId;
  const canRecord = (session.status === "APPROVED" || session.status === "IN_PROGRESS") && isAssignedToMe;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 14, backgroundColor: toast.type === "error" ? "#ef4444" : "#10b981", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate("/staff-audit-sessions")} className="text-sm font-semibold mb-2 flex items-center gap-1" style={{ color: accentColor, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span className="material-symbols-outlined text-base">arrow_back</span> Quay lại
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Kiểm kê #{session.auditId}</h1>
          <p className="text-slate-500 text-sm mt-1">{session.warehouseName} — {session.warehouseAddress}</p>
        </div>
        <div className="flex gap-2">
          {canRecord && (
            <button onClick={openRecordModal} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white shadow-sm transition-all" style={{ backgroundColor: accentColor }}>
              <span className="material-symbols-outlined text-lg">edit_note</span> Ghi nhận kết quả
            </button>
          )}

        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Trạng thái</div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor(session.status)}`}>{statusLabel(session.status)}</span>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Người tạo</div>
            <div className="text-sm font-semibold text-slate-800">{session.createdByName}</div>
          </div>
         <div>
  <div className="text-xs font-bold uppercase text-slate-400 mb-1">
    Ngày tạo
  </div>
  <div className="text-sm text-slate-600">
    {session.createdAt
      ? new Date(session.createdAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—"}
  </div>
</div>

<div>
  <div className="text-xs font-bold uppercase text-slate-400 mb-1">
    Hoàn thành
  </div>
  <div className="text-sm text-slate-600">
    {session.completedAt
      ? new Date(session.completedAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—"}
  </div>
</div>
          {session.notes && (
            <div className="col-span-2 md:col-span-4">
              <div className="text-xs font-bold uppercase text-slate-400 mb-1">Ghi chú</div>
              <div className="text-sm text-slate-600 whitespace-pre-line">{session.notes}</div>
            </div>
          )}
        </div>
      </div>

      {session.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {[
            { label: "Tổng mục", value: session.summary.totalItems, icon: "inventory_2", color: "blue" },
            { label: "Khớp", value: session.summary.matchedItems, icon: "check_circle", color: "emerald" },
            { label: "Chênh lệch", value: session.summary.discrepancyItems, icon: "warning", color: "red" },
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
          <div className="flex gap-2">
            <select className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none" value={resFilters.filterStatus === "all" ? "" : resFilters.filterStatus} onChange={e => setResFilters(p => ({ ...p, filterStatus: e.target.value || "all", page: 1 }))}>
              <option value="">Tất cả trạng thái</option>
              <option value="matched">Khớp</option>
              <option value="discrepancy">Chênh lệch</option>
            </select>
            <input className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none" placeholder="Tìm theo tên hàng..." value={resFilters.search} onChange={e => setResFilters(p => ({ ...p, search: e.target.value, page: 1 }))} style={{ maxWidth: 250 }} />
          </div>
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
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Chưa có kết quả. Hãy bắt đầu ghi nhận!</td></tr>
              ) : results.items.map(r => (
                <tr key={r.resultId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500">{r.resultId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.itemName}</td>
                  <td className="px-4 py-3 text-slate-600">{r.expectedQty}</td>
                  <td className="px-4 py-3 text-slate-600">{r.actualQty}</td>
                  <td className="px-4 py-3">
                    {r.discrepancy === 0
                      ? <span className="text-emerald-600 font-bold">0</span>
                      : <span className="text-red-500 font-bold">{r.discrepancy > 0 ? `+${r.discrepancy}` : r.discrepancy}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.discrepancyReason || "—"}</td>
<td className="px-4 py-3 text-slate-500">
  {r.createdAt
    ? new Date(r.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—"}
</td>                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Trang {results.page}/{results.totalPages}</span>
            <div className="flex gap-1">
              {Array.from({ length: results.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setResFilters(prev => ({ ...prev, page: p }))} className={`px-3 py-1 rounded text-xs font-bold transition-all ${p === results.page ? "text-white" : "bg-slate-100 text-slate-600"}`} style={p === results.page ? { backgroundColor: accentColor } : {}}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Record Results Modal */}
      {recordModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRecordModal(defaultRecordModal)}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: "80%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Ghi nhận kết quả kiểm kê</h3>
            <p className="text-xs text-slate-500 mb-4">Chọn hàng hóa từ danh sách kho, số lượng dự kiến sẽ được tự động điền.</p>

            {inventoryLoading ? (
              <div className="text-center py-6 text-slate-400 text-sm">Đang tải danh sách hàng hóa...</div>
            ) : inventoryItems.length === 0 ? (
              <div className="flex gap-2 items-center p-3 bg-yellow-50 rounded-lg mb-4">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <span className="text-xs text-yellow-800">Kho này chưa có hàng hóa nào trong tồn kho. Vui lòng nhập kho trước khi kiểm kê.</span>
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 2fr" }}>
                    <span className="text-[11px] font-bold uppercase text-slate-400 px-1">Hàng hóa *</span>
                    <span className="text-[11px] font-bold uppercase text-slate-400 px-1">SL dự kiến</span>
                    <span className="text-[11px] font-bold uppercase text-slate-400 px-1">SL thực tế *</span>
                    <span className="text-[11px] font-bold uppercase text-slate-400 px-1">Lý do chênh lệch</span>
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto", overflowX: "hidden" }}>
                  {recordModal.items.map((item, idx) => (
                    <div key={idx} className="grid gap-2 mb-2" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 2fr", alignItems: "start" }}>
                      <div className="px-3 py-1.5 rounded border border-slate-200 text-sm bg-slate-50 text-slate-800 font-semibold truncate" title={item.itemName}>
                        {item.itemName}
                      </div>
                      <input className="px-2 py-1.5 rounded border border-slate-200 text-sm bg-slate-50 text-slate-500" type="number" min="0" placeholder="SL dự kiến" value={item.expectedQty} readOnly tabIndex={-1} />
                      <input className="px-2 py-1.5 rounded border border-slate-200 text-sm" type="number" min="0" placeholder="SL thực tế *" value={item.actualQty} onChange={e => { updateItem(idx, "actualQty", e.target.value); }} />
                      <input className="px-2 py-1.5 rounded border border-slate-200 text-sm" placeholder="Lý do chênh lệch" value={item.discrepancyReason} onChange={e => updateItem(idx, "discrepancyReason", e.target.value)} />
                    </div>
                  ))}
                </div>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
