import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import adminService from "../services/adminService";

const accentColor = "#00b2d6";

export default function OwnerAuditSessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resFilters, setResFilters] = useState({ search: "", page: 1, pageSize: 10, sortBy: "", sortOrder: "asc", filterStatus: "all" });
  const [toast, setToast] = useState(null);
  const [staffList, setStaffList] = useState([]);

  const [closeModal, setCloseModal] = useState({ open: false, notes: "", loading: false });
  const [approveModal, setApproveModal] = useState({ open: false, assignedTo: "", notes: "", loading: false });
  const [rejectModal, setRejectModal] = useState({ open: false, reason: "", loading: false });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { fetchDetail(); }, [id]); // eslint-disable-line

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditSessionDetail(id);
      if (res.data.success) {
        setSession(res.data.data);
        if (res.data.data.warehouseId) loadStaff(res.data.data.warehouseId);
      }
      else showToast(res.data.message, "error");
    } catch { showToast("Không thể tải chi tiết", "error"); }
    setLoading(false);
  };

  const loadStaff = async (warehouseId) => {
    try {
      const res = await axiosClient.get(`/audit-sessions/warehouse/${warehouseId}/staff`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setStaffList(list);
    } catch { setStaffList([]); }
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



  const handleApprove = async () => {
    if (!approveModal.assignedTo) { showToast("Vui lòng chọn nhân viên", "error"); return; }
    setApproveModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.approveAuditSession(id, { assignedTo: parseInt(approveModal.assignedTo), notes: approveModal.notes || null });
      if (res.data.success) { showToast(res.data.message); fetchDetail(); setApproveModal({ open: false, assignedTo: "", notes: "", loading: false }); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setApproveModal(p => ({ ...p, loading: false }));
  };

  const handleReject = async () => {
    if (!rejectModal.reason || !rejectModal.reason.trim()) { showToast("Vui lòng nhập lý do từ chối", "error"); return; }
    setRejectModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.rejectAuditSession(id, { reason: rejectModal.reason || null });
      if (res.data.success) { showToast(res.data.message); fetchDetail(); setRejectModal({ open: false, reason: "", loading: false }); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setRejectModal(p => ({ ...p, loading: false }));
  };

  const handleClose = async () => {
    if (!closeModal.notes || !closeModal.notes.trim()) { showToast("Vui lòng nhập ghi chú/lý do để đóng phiên", "error"); return; }
    setCloseModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.closeAuditSession(id, { notes: closeModal.notes || null });
      if (res.data.success) { showToast(res.data.message); fetchDetail(); setCloseModal({ open: false, notes: "", loading: false }); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setCloseModal(p => ({ ...p, loading: false }));
  };

  const statusLabel = (s) => {
    const map = { PENDING_APPROVAL: "Chờ duyệt", APPROVED: "Đã duyệt", IN_PROGRESS: "Đang kiểm kê", COMPLETED: "Hoàn thành", REJECTED: "Từ chối", OPEN: "Đang mở", CANCELLED: "Đã hủy" };
    return map[s] || s;
  };
  const statusColor = (s) => {
    const map = { PENDING_APPROVAL: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-purple-100 text-purple-700", COMPLETED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-red-100 text-red-700", OPEN: "bg-blue-100 text-blue-700", CANCELLED: "bg-red-100 text-red-700" };
    return map[s] || "bg-slate-100 text-slate-600";
  };

  if (loading) return <div className="text-center py-16 text-slate-400">Đang tải...</div>;
  if (!session) return <div className="text-center py-16 text-red-500">Không tìm thấy phiên kiểm kê.</div>;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 14, backgroundColor: toast.type === "error" ? "#ef4444" : "#10b981", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate("/owner-audit-sessions")} className="text-sm font-semibold mb-2 flex items-center gap-1 transition-colors" style={{ color: accentColor, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span className="material-symbols-outlined text-base">arrow_back</span> Quay lại
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Phiên kiểm kê #{session.auditId}</h1>
          <p className="text-slate-500 text-sm mt-1">{session.warehouseName} — {session.warehouseAddress}</p>
        </div>
        <div className="flex gap-2">
          {session.status === "PENDING_APPROVAL" && (
            <>
              <button onClick={() => setApproveModal({ open: true, assignedTo: "", notes: "", loading: false })} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-all">
                <span className="material-symbols-outlined text-lg">check_circle</span> Duyệt & giao NV
              </button>
              <button onClick={() => setRejectModal({ open: true, reason: "", loading: false })} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all">
                <span className="material-symbols-outlined text-lg">cancel</span> Từ chối
              </button>
            </>
          )}
          {(session.status === "IN_PROGRESS" || session.status === "OPEN" || session.status === "APPROVED") && (
            <button onClick={() => setCloseModal({ open: true, notes: "", loading: false })} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all">
              🔒 Đóng phiên
            </button>
          )}
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
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">NV kiểm kê</div>
            <div className="text-sm font-semibold text-slate-800">{session.assignedToName || "Chưa giao"}</div>
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
            <div className="col-span-2 md:col-span-3">
              <div className="text-xs font-bold uppercase text-slate-400 mb-1">Ghi chú</div>
              <div className="text-sm text-slate-600 whitespace-pre-line">{session.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
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
                <button key={p} onClick={() => setResFilters(prev => ({ ...prev, page: p }))} className={`px-3 py-1 rounded text-xs font-bold transition-all ${p === results.page ? "text-white" : "bg-slate-100 text-slate-600"}`} style={p === results.page ? { backgroundColor: accentColor } : {}}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approveModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setApproveModal({ open: false, assignedTo: "", notes: "", loading: false })}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Duyệt & giao nhân viên</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nhân viên kiểm kê *</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" value={approveModal.assignedTo} onChange={e => setApproveModal(p => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map(s => <option key={s.userId || s.user_id || s.id} value={s.userId || s.user_id || s.id}>{s.fullName || s.full_name || s.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" rows={2} value={approveModal.notes} onChange={e => setApproveModal(p => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setApproveModal({ open: false, assignedTo: "", notes: "", loading: false })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100" disabled={approveModal.loading}>Hủy</button>
              <button onClick={handleApprove} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600" disabled={approveModal.loading}>{approveModal.loading ? "Đang xử lý..." : "Duyệt & giao"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRejectModal({ open: false, reason: "", loading: false })}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Từ chối yêu cầu kiểm kê</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do từ chối *</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" rows={3} value={rejectModal.reason} onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))} placeholder="Nhập lý do..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectModal({ open: false, reason: "", loading: false })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100" disabled={rejectModal.loading}>Hủy</button>
              <button onClick={handleReject} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600" disabled={rejectModal.loading}>{rejectModal.loading ? "Đang xử lý..." : "Từ chối"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {closeModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCloseModal({ open: false, notes: "", loading: false })}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Đóng phiên kiểm kê</h3>
            <div className="flex gap-2 items-center p-3 bg-red-50 rounded-lg mb-4">
              <span className="text-red-500 text-lg">⚠️</span>
              <span className="text-xs text-red-700">Phiên kiểm kê sẽ <strong>không thể ghi nhận thêm</strong> kết quả.</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú *</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" rows={3} value={closeModal.notes} onChange={e => setCloseModal(p => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCloseModal({ open: false, notes: "", loading: false })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100" disabled={closeModal.loading}>Hủy</button>
              <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600" disabled={closeModal.loading}>{closeModal.loading ? "Đang xử lý..." : "Đóng phiên"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
