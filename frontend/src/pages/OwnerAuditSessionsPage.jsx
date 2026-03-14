import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import adminService from "../services/adminService";

const accentColor = "#00b2d6";

export default function OwnerAuditSessionsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [filters, setFilters] = useState({ search: "", warehouseId: "", status: "", page: 1, pageSize: 10 });
  const [toast, setToast] = useState(null);

  // Create modal
  const defaultCreateModal = { open: false, warehouseId: "", notes: "", errors: {}, loading: false };
  const [createModal, setCreateModal] = useState(defaultCreateModal);

  // Close modal
  const [closeModal, setCloseModal] = useState({ open: false, auditId: null, notes: "", loading: false });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Lấy kho bằng API owner: /api/Warehouse/owner/{userId}
  useEffect(() => {
    if (!user.userId) return;
    axiosClient.get(`/Warehouse/owner/${user.userId}`).then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setWarehouses(list);
    }).catch(() => {});
  }, []); // eslint-disable-line

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.warehouseId) delete params.warehouseId;
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;
      const res = await adminService.getAuditSessions(params);
      if (res.data.success) {
        // Lọc chỉ các phiên kiểm kê của kho mình sở hữu
        const myWarehouseIds = warehouses.map(w => w.warehouseId);
        const filtered = {
          ...res.data.data,
          items: res.data.data.items.filter(item =>
            myWarehouseIds.length === 0 || myWarehouseIds.includes(item.warehouseId)
          )
        };
        setData(filtered);
      }
    } catch { showToast("Lỗi khi tải danh sách phiên kiểm kê", "error"); }
    setLoading(false);
  }, [filters, warehouses]); // eslint-disable-line

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

  const handleExport = async (auditId) => {
    try {
      const res = await adminService.exportAuditReport(auditId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `BaoCaoKiemKe_${auditId}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      showToast("Xuất báo cáo thành công");
    } catch { showToast("Lỗi khi xuất báo cáo", "error"); }
  };

  const handleCloseSession = async () => {
    setCloseModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.closeAuditSession(closeModal.auditId, { notes: closeModal.notes || null });
      if (res.data.success) { showToast(res.data.message); fetchData(); setCloseModal({ open: false, auditId: null, notes: "", loading: false }); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi khi đóng phiên", "error"); }
    setCloseModal(p => ({ ...p, loading: false }));
  };

  const statusLabel = (s) => s === "OPEN" ? "Đang mở" : s === "COMPLETED" ? "Hoàn thành" : s;
  const statusColor = (s) => s === "OPEN" ? "bg-blue-100 text-blue-700" : s === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600";

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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Kiểm kê kho</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý phiên kiểm kê cho các kho bạn sở hữu</p>
        </div>
        <button
          onClick={() => setCreateModal({ ...defaultCreateModal, open: true })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white shadow-sm transition-all"
          style={{ backgroundColor: accentColor }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#009bbf"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = accentColor}
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Tạo phiên kiểm kê
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          placeholder="Tìm kiếm..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
          style={{ minWidth: 200 }}
        />
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none"
          value={filters.warehouseId}
          onChange={e => setFilters(p => ({ ...p, warehouseId: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả kho</option>
          {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none"
          value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="OPEN">Đang mở</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500" style={{ width: 60 }}>ID</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kho</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kết quả</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày tạo</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Hoàn thành</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Đang tải...</td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Chưa có phiên kiểm kê nào.</td></tr>
              ) : data.items.map(row => (
                <tr key={row.auditId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-600">#{row.auditId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.warehouseName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.totalResults} mục</td>
                  <td className="px-4 py-3 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{row.completedAt ? new Date(row.completedAt).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/owner-audit-sessions/${row.auditId}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ backgroundColor: accentColor + "15", color: accentColor }}
                      >Chi tiết</button>
                      {row.status === "OPEN" && (
                        <button
                          onClick={() => setCloseModal({ open: true, auditId: row.auditId, notes: "", loading: false })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 transition-all hover:bg-red-100"
                          title="Đóng phiên"
                        >🔒</button>
                      )}
                      <button
                        onClick={() => handleExport(row.auditId)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 transition-all hover:bg-slate-200"
                      >CSV</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Trang {data.page}/{data.totalPages} · {data.totalCount} kết quả</span>
            <div className="flex gap-1">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${p === data.page ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  style={p === data.page ? { backgroundColor: accentColor } : {}}
                >{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCreateModal(defaultCreateModal)}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tạo phiên kiểm kê mới</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kho *</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400" value={createModal.warehouseId} onChange={e => setCreateModal(p => ({ ...p, warehouseId: e.target.value, errors: {} }))}>
                <option value="">-- Chọn kho --</option>
                {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
              </select>
              {createModal.errors.warehouseId && <p className="text-xs text-red-500 mt-1">{createModal.errors.warehouseId}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400" rows={3} value={createModal.notes} onChange={e => setCreateModal(p => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú (tuỳ chọn)..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCreateModal(defaultCreateModal)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all" disabled={createModal.loading}>Hủy</button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all" style={{ backgroundColor: accentColor }} disabled={createModal.loading}>{createModal.loading ? "Đang tạo..." : "Tạo phiên"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {closeModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCloseModal({ open: false, auditId: null, notes: "", loading: false })}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Đóng phiên kiểm kê</h3>
            <div className="flex gap-2 items-center p-3 bg-red-50 rounded-lg mb-4">
              <span className="text-red-500 text-lg">⚠️</span>
              <span className="text-xs text-red-700">Sau khi đóng, phiên kiểm kê <strong>#{closeModal.auditId}</strong> sẽ <strong>không thể ghi nhận thêm</strong> kết quả.</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú khi đóng (tùy chọn)</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" rows={3} value={closeModal.notes} onChange={e => setCloseModal(p => ({ ...p, notes: e.target.value }))} placeholder="Nhập ghi chú..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCloseModal({ open: false, auditId: null, notes: "", loading: false })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200" disabled={closeModal.loading}>Hủy</button>
              <button onClick={handleCloseSession} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all" disabled={closeModal.loading}>{closeModal.loading ? "Đang xử lý..." : "Xác nhận đóng"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
