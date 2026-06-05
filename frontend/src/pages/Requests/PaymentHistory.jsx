import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN');
};

const fmtCurrency = (amount) =>
  amount == null ? '—' : Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const STATUS_CONFIG = {
  COMPLETED:            { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700' },
  PENDING:              { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700' },
  PENDING_CONFIRMATION: { label: 'Chờ xác minh', color: 'bg-amber-100 text-amber-700' },
  REUPLOAD_REQUESTED:   { label: 'Yêu cầu tải lại', color: 'bg-red-100 text-red-700' },
  FAILED:               { label: 'Thất bại', color: 'bg-red-100 text-red-700' },
  EXPIRED:              { label: 'Hết hạn', color: 'bg-red-100 text-red-700' },
  CANCELLED:            { label: 'Đã hủy', color: 'bg-slate-100 text-slate-600' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] ?? { label: status ?? '—', color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const PaymentHistory = () => {
  const [payments,   setPayments]   = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const [status, setStatus] = useState('');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');
  const [page,   setPage]   = useState(1);
  const PAGE_SIZE = 20;
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await inventoryService.getPaymentHistory({ status: status || undefined, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE });
      const data = res.data;
      setPayments(data.items     ?? []);
      setTotalCount(data.totalCount ?? 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải lịch sử chuyển khoản.');
    } finally {
      setLoading(false);
    }
  }, [status, from, to, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lịch sử thanh toán</h1>
          <p className="text-slate-500 text-sm mt-1">Hiển thị cả thanh toán online và thanh toán trực tiếp.</p>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">

            {/* Status */}
            <div className="relative min-w-[170px]">
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-[#00b2d6]/30"
              >
                <option value="">Tất cả trạng thái</option>
                 <option value="COMPLETED">Đã thanh toán</option>
                 <option value="PENDING">Chờ thanh toán</option>
                 <option value="PENDING_CONFIRMATION">Chờ xác minh</option>
                 <option value="REUPLOAD_REQUESTED">Yêu cầu tải lại</option>
                 <option value="FAILED">Thất bại</option>
                 <option value="EXPIRED">Hết hạn</option>
                 <option value="CANCELLED">Đã hủy</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            {/* From */}
            <input type="date" value={from}
              onChange={e => { setFrom(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#00b2d6]/30"
            />
            {/* To */}
            <input type="date" value={to}
              onChange={e => { setTo(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#00b2d6]/30"
            />

            {(status || from || to) && (
              <button onClick={() => { setStatus(''); setFrom(''); setTo(''); setPage(1); }}
                className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Mã TT', 'Hợp đồng', 'Kho', 'Người thuê', 'Số tiền', 'Loại', 'Kỳ thanh toán', 'Ngày TT', 'Hạn chót', 'Phương thức', 'Trạng thái', 'Hành động'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={12} className="py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined animate-spin block text-2xl mb-1">progress_activity</span>Đang tải...
                  </td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={12} className="py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined block text-3xl mb-1 text-slate-300">receipt_long</span>
                    Không có khoản thanh toán nào.
                  </td></tr>
                ) : payments.map(row => {
                  const TYPE_LABEL = { MONTHLY: 'Thuê hàng tháng', DEPOSIT: 'Đặt cọc + Tháng đầu', EXTENSION: 'Gia hạn hợp đồng', RENTAL: 'Tiền thuê', PENALTY: 'Phạt', EARLY_TERMINATION: 'Kết thúc sớm', REFUND: 'Hoàn tiền' };
                  // Xác định loại: ưu tiên paymentType, fallback paymentPeriod (API cũ trả type vào period)
                  const rawType = row.paymentType || (TYPE_LABEL[row.paymentPeriod] ? row.paymentPeriod : null);
                  const typeLabel = TYPE_LABEL[rawType] ?? rawType ?? '—';
                  const isDeposit = rawType === 'DEPOSIT';
                  // Kỳ thanh toán: chỉ hiển thị nếu là chuỗi tháng thực sự (không phải MONTHLY/DEPOSIT...)
                  const periodText = (row.paymentPeriod && !TYPE_LABEL[row.paymentPeriod]) ? row.paymentPeriod : '—';
                  return (
                  <tr key={row.paymentId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-[#00b2d6] font-semibold">#{row.paymentId}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{row.contractNumber ?? `#${row.contractId}`}</td>
                    <td className="px-4 py-4 text-sm text-slate-700 font-medium">{row.warehouseName}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{row.renterName}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900">{fmtCurrency(row.amount)}</td>
                     <td className="px-4 py-4 text-xs">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${isDeposit ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                         {typeLabel}
                       </span>
                     </td>
                     <td className="px-4 py-4 text-sm text-slate-700 font-semibold">{periodText}</td>
                     <td className="px-4 py-4 text-sm text-slate-500">{fmtDate(row.paymentDate)}</td>
                     <td className="px-4 py-4 text-sm text-slate-500">{fmtDate(row.dueDate)}</td>
                     <td className="px-4 py-4 text-sm text-slate-500">
                       {row.paymentMethod === 'BANK_TRANSFER'
                         ? 'Chuyển khoản'
                         : row.paymentMethod === 'CASH'
                           ? 'Tiền mặt'
                           : (row.paymentMethod ?? '—')}
                     </td>
                    <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-4 text-sm font-medium">
                      {['PENDING', 'REUPLOAD_REQUESTED', 'FAILED'].includes(row.status) && (
                        <button
                          onClick={() => navigate(`/contracts/${row.contractId}/payment?paymentId=${row.paymentId}`)}
                          className="px-3 py-1.5 bg-[#00b2d6] text-white rounded-lg text-xs font-bold hover:bg-[#0092b3] transition-colors"
                        >
                          Thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
            <span className="text-sm text-slate-500">
              Tổng <span className="font-bold text-slate-700">{totalCount.toLocaleString('vi-VN')}</span> khoản
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 bg-white disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-[#00b2d6] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 bg-white disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentHistory;
