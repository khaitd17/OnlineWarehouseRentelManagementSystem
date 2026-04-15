import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../../services/axiosClient';
import { getMyWarehouses } from '../../services/warehouseService';

/* ── Helpers ─────────────────────────────────────────── */
const fmtDT = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}\n${time}`;
};

const getInitials = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const AVATAR_COLORS = [
  'bg-violet-200 text-violet-700',
  'bg-sky-200 text-sky-700',
  'bg-emerald-200 text-emerald-700',
  'bg-amber-200 text-amber-700',
  'bg-rose-200 text-rose-700',
];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0];

/* ── Component ───────────────────────────────────────── */
const TransactionHistory = () => {
  /* filter state */
  const [search,    setSearch]    = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [txType,    setTxType]    = useState('');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');

  /* data state */
  const [rows,      setRows]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  /* warehouse list for dropdown */
  const [warehouses, setWarehouses] = useState([]);

  const PAGE_SIZE = 20;
  const debounceRef = useRef(null);

  /* ── Load warehouses ── */
  useEffect(() => {
    getMyWarehouses()
      .then(data => {
        const list = (data || []).map(w => ({
          id: w.warehouseId ?? w.id,
          name: w.name ?? w.warehouseName ?? `Kho #${w.warehouseId}`,
        }));
        setWarehouses(list);
      })
      .catch(() => {});
  }, []);

  /* ── Fetch transactions ── */
  const fetchData = useCallback(async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pg, pageSize: PAGE_SIZE };
      if (warehouseId) params.warehouseId = warehouseId;
      if (txType)      params.type        = txType;
      if (search.trim()) params.itemName  = search.trim();
      if (fromDate)    params.from        = fromDate;
      if (toDate)      params.to          = `${toDate}T23:59:59`;

      const res = await axiosClient.get('/transactions', { params });
      const d   = res.data;
      setRows(d.items ?? []);
      setTotal(d.totalCount ?? 0);
      setTotalPages(d.totalPages ?? 1);
      setPage(d.page ?? pg);
    } catch (e) {
      setError('Không thể tải lịch sử giao dịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, txType, search, fromDate, toDate]);

  /* Re-fetch when filters change (debounce search) */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(1), 350);
    return () => clearTimeout(debounceRef.current);
  }, [fetchData]);

  /* ── Stats ── */
  const inboundCount  = rows.filter(r => r.type === 'INBOUND').length;
  const outboundCount = rows.filter(r => r.type === 'OUTBOUND').length;

  /* ── Pagination helpers ── */
  const goTo = (pg) => { if (pg >= 1 && pg <= totalPages) fetchData(pg); };

  const pageNumbers = (() => {
    const nums = [];
    const delta = 2;
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    nums.push(1);
    if (left > 2) nums.push('...');
    for (let i = left; i <= right; i++) nums.push(i);
    if (right < totalPages - 1) nums.push('...');
    if (totalPages > 1) nums.push(totalPages);
    return nums;
  })();

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lịch sử nhập/ xuất kho</h1>
            <p className="text-slate-500 text-sm mt-1">Xem và xuất lịch sử biến động kho hàng trên tất cả các kho.</p>
          </div>
          <button
            onClick={() => fetchData(page)}
            className="flex items-center gap-2 bg-[#00b2d6] hover:bg-[#00a0c0] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-lg leading-none">refresh</span>
            Làm mới
          </button>
        </div>

        {/* ── Filter Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm placeholder-slate-400 outline-none transition-all"
                placeholder="Tìm tên mặt hàng..."
                type="text"
              />
            </div>

            {/* Warehouse filter */}
            <div className="relative min-w-[180px]">
              <select
                value={warehouseId}
                onChange={e => { setWarehouseId(e.target.value); }}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm appearance-none outline-none cursor-pointer"
              >
                <option value="">Tất cả kho hàng</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            {/* Type filter */}
            <div className="relative min-w-[160px]">
              <select
                value={txType}
                onChange={e => setTxType(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm appearance-none outline-none cursor-pointer"
              >
                <option value="">Tất cả loại</option>
                <option value="INBOUND">Nhập kho</option>
                <option value="OUTBOUND">Xuất kho</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[16px]">calendar_today</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm outline-none cursor-pointer"
                />
              </div>
              <span className="text-slate-400 text-sm">→</span>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm outline-none cursor-pointer"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa bộ lọc ngày"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Mã giao dịch</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Kho hàng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Tên mặt hàng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Ngày giờ</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-4xl animate-spin text-[#00b2d6]">progress_activity</span>
                        <span className="text-sm font-medium">Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                        <span className="text-sm font-medium text-red-500">{error}</span>
                        <button
                          onClick={() => fetchData(page)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                        >Thử lại</button>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-slate-300">inventory_2</span>
                        <span className="text-sm font-medium">Không có giao dịch nào phù hợp.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const isInbound = row.type === 'INBOUND';
                    return (
                      <tr key={row.transactionId} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs text-[#00b2d6] font-semibold">
                          #{String(row.transactionId).padStart(5, '0')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isInbound
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            <span className="material-symbols-outlined text-[15px] leading-none">
                              {isInbound ? 'south_east' : 'north_east'}
                            </span>
                            {isInbound ? 'Nhập kho' : 'Xuất kho'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.warehouseName || `Kho #${row.warehouseId}`}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-800">{row.itemName}</div>
                          {row.unit && (
                            <div className="text-[10px] text-slate-400 mt-0.5">Đơn vị: {row.unit}</div>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold ${isInbound ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isInbound ? '+' : '-'}{row.quantity?.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-pre-line leading-5">
                          {fmtDT(row.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColor(row.performedByName)}`}>
                              {getInitials(row.performedByName)}
                            </div>
                            <span className="text-sm text-slate-700 truncate max-w-[120px]">{row.performedByName || `#${row.performedBy}`}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && !error && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <span className="text-sm text-slate-500">
                Hiển thị{' '}
                <span className="font-bold text-slate-700">
                  {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                </span>{' '}
                đến{' '}
                <span className="font-bold text-slate-700">
                  {Math.min(page * PAGE_SIZE, total)}
                </span>{' '}
                trong số <span className="font-bold text-slate-700">{total.toLocaleString('vi-VN')}</span> giao dịch
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>

                {pageNumbers.map((n, i) =>
                  n === '...'
                    ? <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-sm">...</span>
                    : (
                      <button
                        key={n}
                        onClick={() => goTo(n)}
                        className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                          n === page
                            ? 'bg-[#00b2d6] text-white'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        {n}
                      </button>
                    )
                )}

                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng giao dịch</span>
              <span className="material-symbols-outlined text-[#00b2d6]">receipt_long</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{total.toLocaleString('vi-VN')}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Trang {page}/{totalPages}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nhập kho (trang này)</span>
              <span className="material-symbols-outlined text-emerald-500">trending_up</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{inboundCount}</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">INBOUND</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Xuất kho (trang này)</span>
              <span className="material-symbols-outlined text-amber-500">trending_down</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{outboundCount}</div>
            <div className="text-[11px] text-amber-600 font-bold mt-1">OUTBOUND</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransactionHistory;
