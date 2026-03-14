import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';

/* ── Status config ────────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Đang chờ', bg: 'bg-amber-100 text-amber-700 border border-amber-200' },
  CONFIRMED: { label: 'Đã duyệt', bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  REJECTED:  { label: 'Từ chối',  bg: 'bg-rose-100 text-rose-700 border border-rose-200' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg}`}>
      {s.label}
    </span>
  );
};

const InboundRequestsManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter !== 'Tất cả trạng thái' ? statusFilter : undefined;
      const res = await inventoryService.getInventoryRequests({
        type: 'INBOUND',
        status: statusParam,
        page,
        pageSize: PAGE_SIZE,
      });
      const payload = res.data || {};
      setData(Array.isArray(payload.items) ? payload.items : []);
      setTotalPages(payload.totalPages || 1);
      setTotalCount(payload.totalCount || 0);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search
    ? data.filter(r =>
        String(r.invReqId).includes(search) ||
        r.items?.[0]?.itemName?.toLowerCase().includes(search.toLowerCase()) ||
        r.renterName?.toLowerCase().includes(search.toLowerCase()) ||
        r.warehouseName?.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu nhập kho</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi các lô hàng nhập kho tại tất cả các kho trung tâm.</p>
      </div>

      {/* ── Filter Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[260px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tìm kiếm yêu cầu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm placeholder-slate-400 outline-none transition-all"
                placeholder="ID, mặt hàng, người yêu cầu..."
                type="text"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-[180px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Lọc trạng thái
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="block w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm appearance-none outline-none cursor-pointer"
              >
                <option>Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="CONFIRMED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Mã yêu cầu</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Nhà kho</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Mặt hàng</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Người yêu cầu</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-3xl block mb-2">sync</span>Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.map(row => {
                const firstItem = row.items?.[0];
                const totalQty = row.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                return (
                  <tr key={row.invReqId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">#{row.invReqId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.warehouseName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="font-medium text-slate-800">{firstItem?.itemName || '—'}</div>
                      {firstItem && <div className="text-xs text-slate-400">{totalQty.toLocaleString()} {firstItem.unit}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.renterName || '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Không tìm thấy yêu cầu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <span className="text-sm text-slate-500">
            Tổng <span className="font-bold text-slate-700">{totalCount}</span> yêu cầu
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm mr-1">chevron_left</span>
              Trước
            </button>
            <span className="flex items-center px-3 text-sm text-slate-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau
              <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboundRequestsManagement;
