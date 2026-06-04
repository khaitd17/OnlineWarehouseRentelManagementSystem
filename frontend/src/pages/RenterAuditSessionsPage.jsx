import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import adminService from "../services/adminService";

const accentColor = "#00b2d6";

export default function RenterAuditSessionsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [rentedWarehouses, setRentedWarehouses] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", page: 1, pageSize: 10 });
  const [toast, setToast] = useState(null);

  const defaultCreateModal = { open: false, warehouseId: "", notes: "", errors: {}, loading: false };
  const [createModal, setCreateModal] = useState(defaultCreateModal);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Lấy danh sách kho đang thuê qua hợp đồng
  useEffect(() => {
    if (!user.userId) return;
    axiosClient.get(`/rental-contracts/my-contracts`).then(res => {
      const contracts = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Lọc hợp đồng ACTIVE và lấy danh sách kho duy nhất
      const activeContracts = contracts.filter(c => c.status === "ACTIVE");
      const uniqueWarehouses = [];
      const seenIds = new Set();
      activeContracts.forEach(c => {
        if (!seenIds.has(c.warehouseId)) {
          seenIds.add(c.warehouseId);
          uniqueWarehouses.push({ warehouseId: c.warehouseId, name: c.warehouseName });
        }
      });
      setRentedWarehouses(uniqueWarehouses);
    }).catch(() => {});
  }, []); // eslint-disable-line

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;
      const res = await adminService.getAuditSessions(params);
      if (res.data.success) setData(res.data.data);
    } catch { showToast("Lỗi khi tải danh sách", "error"); }
    setLoading(false);
  }, [filters]); // eslint-disable-line

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    const errors = {};
    if (!createModal.warehouseId) errors.warehouseId = "Vui lòng chọn kho";
    if (Object.keys(errors).length > 0) { setCreateModal(p => ({ ...p, errors })); return; }
    setCreateModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.createAuditSession({ warehouseId: parseInt(createModal.warehouseId), notes: createModal.notes || null });
      if (res.data.success) { showToast(res.data.message); fetchData(); setCreateModal(defaultCreateModal); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setCreateModal(p => ({ ...p, loading: false }));
  };

  const statusLabel = (s) => {
    const map = { PENDING_APPROVAL: "Chờ duyệt", APPROVED: "Đã duyệt", IN_PROGRESS: "Đang kiểm kê", COMPLETED: "Hoàn thành", REJECTED: "Từ chối", OPEN: "Đang mở", CANCELLED: "Đã hủy" };
    return map[s] || s;
  };
  const statusColor = (s) => {
    const map = { PENDING_APPROVAL: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-purple-100 text-purple-700", COMPLETED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-red-100 text-red-700", OPEN: "bg-blue-100 text-blue-700", CANCELLED: "bg-red-100 text-red-700" };
    return map[s] || "bg-slate-100 text-slate-600";
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 14, backgroundColor: toast.type === "error" ? "#ef4444" : "#10b981", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Yêu cầu kiểm kê</h1>
          <p className="text-slate-500 text-sm mt-1">Tạo yêu cầu kiểm kê kho và theo dõi trạng thái</p>
        </div>
        <button onClick={() => setCreateModal({ ...defaultCreateModal, open: true })} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white shadow-sm transition-all" style={{ backgroundColor: accentColor }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#009bbf"} onMouseLeave={e => e.currentTarget.style.backgroundColor = accentColor}>
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Tạo yêu cầu kiểm kê
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#00b2d6]/20 focus:border-[#00b2d6] outline-none transition-all" placeholder="Tìm kiếm..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} style={{ minWidth: 200 }} />
        <div className="relative">
          <select className="pl-3 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm appearance-none outline-none focus:ring-2 focus:ring-[#00b2d6]/20 focus:border-[#00b2d6] cursor-pointer transition-all" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING_APPROVAL">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="IN_PROGRESS">Đang kiểm kê</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="REJECTED">Từ chối</option>
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ width: 60 }}>ID</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kho</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">NV kiểm kê</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kết quả</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày tạo</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Đang tải...</td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Chưa có yêu cầu kiểm kê nào.</td></tr>
              ) : data.items.map(row => (
                <tr key={row.auditId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-600">#{row.auditId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.warehouseName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.assignedToName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.totalResults} mục</td>
                  <td className="px-4 py-3 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/renter-audit-sessions/${row.auditId}`)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ backgroundColor: accentColor + "15", color: accentColor }}>Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Trang {data.page}/{data.totalPages} · {data.totalCount} kết quả</span>
            <div className="flex gap-1">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setFilters(prev => ({ ...prev, page: p }))} className={`px-3 py-1 rounded text-xs font-bold transition-all ${p === data.page ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} style={p === data.page ? { backgroundColor: accentColor } : {}}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCreateModal(defaultCreateModal)}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tạo yêu cầu kiểm kê</h3>
            <div className="flex gap-2 items-center p-3 bg-yellow-50 rounded-lg mb-4">
              <span className="text-yellow-600 text-lg">📋</span>
              <span className="text-xs text-yellow-800">Yêu cầu kiểm kê sẽ được gửi đến chủ kho để duyệt.</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kho *</label>
              <div className="relative">
                <select className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 text-sm appearance-none outline-none focus:ring-2 focus:ring-[#00b2d6]/20 focus:border-[#00b2d6] cursor-pointer transition-all" value={createModal.warehouseId} onChange={e => setCreateModal(p => ({ ...p, warehouseId: e.target.value, errors: {} }))}>
                  <option value="">-- Chọn kho đang thuê --</option>
                  {rentedWarehouses.map(w => <option key={w.warehouseId || w.warehouse_id} value={w.warehouseId || w.warehouse_id}>{w.name || w.warehouseName}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
              {createModal.errors.warehouseId && <p className="text-xs text-red-500 mt-1">{createModal.errors.warehouseId}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú / Lý do kiểm kê</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400" rows={3} value={createModal.notes} onChange={e => setCreateModal(p => ({ ...p, notes: e.target.value }))} placeholder="Mô tả lý do yêu cầu kiểm kê..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCreateModal(defaultCreateModal)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all" disabled={createModal.loading}>Hủy</button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all" style={{ backgroundColor: accentColor }} disabled={createModal.loading}>{createModal.loading ? "Đang gửi..." : "Gửi yêu cầu"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
