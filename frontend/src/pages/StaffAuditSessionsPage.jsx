import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../services/adminService";

const accentColor = "#00b2d6";

export default function StaffAuditSessionsPage() {
  const navigate = useNavigate();
  const currentUserId = parseInt(JSON.parse(localStorage.getItem('user') || '{}')?.userId || '0');
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "", page: 1, pageSize: 10 });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

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

  const statusLabel = (s) => {
    const map = { APPROVED: "Chờ kiểm kê", IN_PROGRESS: "Đang kiểm kê", COMPLETED: "Hoàn thành", PENDING_APPROVAL: "Chờ duyệt", OPEN: "Đang mở", CANCELLED: "Đã hủy" };
    return map[s] || s;
  };
  const statusColor = (s) => {
    const map = { APPROVED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-purple-100 text-purple-700", COMPLETED: "bg-emerald-100 text-emerald-700", PENDING_APPROVAL: "bg-yellow-100 text-yellow-700", OPEN: "bg-blue-100 text-blue-700", CANCELLED: "bg-red-100 text-red-700" };
    return map[s] || "bg-slate-100 text-slate-600";
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 14, backgroundColor: toast.type === "error" ? "#ef4444" : "#10b981", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Phiếu kiểm kê được giao</h1>
        <p className="text-slate-500 text-sm mt-1">Danh sách các phiên kiểm kê được giao cho bạn</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none" placeholder="Tìm kiếm..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} style={{ minWidth: 200 }} />
        <select className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">Tất cả trạng thái</option>
          <option value="APPROVED">Chờ kiểm kê</option>
          <option value="IN_PROGRESS">Đang kiểm kê</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
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
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Chưa có phiếu kiểm kê nào được giao.</td></tr>
              ) : data.items.map(row => (
                <tr key={row.auditId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-600">#{row.auditId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.warehouseName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.assignedTo === currentUserId
                      ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><span style={{fontSize:'0.9em'}}>✅</span> Giao cho tôi</span>
                      : <span className="text-slate-400 text-xs">{row.assignedToName || '—'}</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.totalResults} mục</td>
                  <td className="px-4 py-3 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/staff-audit-sessions/${row.auditId}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ backgroundColor: accentColor + '15', color: accentColor }}
                      >
                        {(row.status === 'APPROVED' || row.status === 'IN_PROGRESS') && row.assignedTo === currentUserId
                          ? 'Kiểm kê'
                          : 'Xem'
                        }
                      </button>
                    </div>
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
    </div>
  );
}
