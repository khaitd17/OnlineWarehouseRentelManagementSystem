import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';

/* ── Status config ────────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Chờ tiếp nhận', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  CONFIRMED: { label: 'Chờ xử lý tại kho', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  REJECTED:  { label: 'Từ chối',  cls: 'bg-rose-100 text-rose-700 border border-rose-200' },
};

const STATUS_FILTERS = ['Tất cả', 'CONFIRMED', 'COMPLETED', 'REJECTED'];
const STATUS_LABELS  = { 'Tất cả': 'Tất cả', CONFIRMED: 'Chờ xử lý', COMPLETED: 'Hoàn thành', REJECTED: 'Từ chối' };

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
};

const OutboundRequestsList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = activeFilter !== 'Tất cả' ? activeFilter : undefined;
      const res = await inventoryService.getInventoryRequests({
        type: 'OUTBOUND',
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
  }, [activeFilter, page]);

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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu xuất kho</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi các lô hàng xuất kho và đơn hàng vận chuyển.</p>
      </div>

      {/* ── Filter Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm placeholder-slate-400 outline-none transition-all"
              placeholder="Tìm kiếm theo ID, Mặt hàng, Người yêu cầu..."
              type="text"
            />
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setPage(1); }}
                className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeFilter === f
                    ? 'bg-[#00b2d6]/10 text-[#00b2d6] border border-[#00b2d6]/30'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {STATUS_LABELS[f]}
              </button>
            ))}
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
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Tên mặt hàng</th>
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
                    <td className="px-6 py-4 text-sm font-bold text-[#00b2d6]">#{row.invReqId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.warehouseName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      <div>{firstItem?.itemName || '—'}</div>
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            Tổng <span className="font-bold text-slate-700">{totalCount}</span> yêu cầu
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  n === page ? 'bg-[#00b2d6] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutboundRequestsList;
