import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import rentalService from '../../services/rentalService';
import inventoryService from '../../services/inventoryService';
import renterAssetService from '../../services/renterAssetService';

/* ── Helpers ── */
const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return 'Vừa xong';
  if (diff < 3600)   return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const STATUS_INBOUND = {
  PENDING:    { label: 'Chờ xử lý',      bg: '#fef3c7', color: '#92400e' },
  APPROVED:   { label: 'Đã duyệt',       bg: '#d1fae5', color: '#065f46' },
  IN_TRANSIT: { label: 'Đang vận chuyển', bg: '#fde8b4', color: '#b45309' },
  RECEIVED:   { label: 'Đã nhận hàng',   bg: '#d1fae5', color: '#065f46' },
  REJECTED:   { label: 'Đã từ chối',     bg: '#fee2e2', color: '#991b1b' },
  CANCELLED:  { label: 'Đã hủy',         bg: '#f1f5f9', color: '#64748b' },
};

const STATUS_OUTBOUND = {
  PENDING:    { label: 'Đang chờ',       bg: '#fef3c7', color: '#92400e' },
  APPROVED:   { label: 'Đã duyệt',       bg: '#dbeafe', color: '#1e40af' },
  PROCESSING: { label: 'Đang lấy hàng',  bg: '#dbeafe', color: '#1e40af' },
  SHIPPED:    { label: 'Đã gửi hàng',    bg: '#d1fae5', color: '#065f46' },
  DELIVERED:  { label: 'Đã giao hàng',   bg: '#d1fae5', color: '#065f46' },
  REJECTED:   { label: 'Đã từ chối',     bg: '#fee2e2', color: '#991b1b' },
  CANCELLED:  { label: 'Đã hủy',         bg: '#f1f5f9', color: '#64748b' },
};

const StatusBadge = ({ status, map }) => {
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 999,
      fontSize: '0.75rem', fontWeight: 600,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
};

const Skeleton = () => (
  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8' }}>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
      {[1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />)}
    </div>
    <span style={{ fontSize: '0.875rem' }}>Đang tải...</span>
  </div>
);

const EmptyState = ({ icon, msg }) => (
  <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
    <p style={{ margin: 0, fontSize: '0.875rem' }}>{msg}</p>
  </div>
);

/* ══════════════════════════════════════════════════════ */
const RenterDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = (user.fullName || user.FullName || 'bạn').split(' ').pop() || 'bạn';

  /* ── State ── */
  const [stats, setStats]           = useState({ activeContracts: 0, totalInventory: 0, pendingInbound: 0, pendingOutbound: 0 });
  const [inventory, setInventory]   = useState([]);
  const [inbounds,  setInbounds]    = useState([]);
  const [outbounds, setOutbounds]   = useState([]);
  const [loading,   setLoading]     = useState({ stats: true, inventory: true, inbounds: true, outbounds: true });

  /* ── Loaders ── */
  const loadAll = useCallback(async () => {
    // 1. Active contracts → stat kho đang hoạt động
    rentalService.getMyContracts()
      .then(data => {
        const active = (data || []).filter(c => c.status === 'ACTIVE');
        setStats(s => ({ ...s, activeContracts: active.length }));
        setLoading(l => ({ ...l, stats: false }));
      })
      .catch(() => setLoading(l => ({ ...l, stats: false })));

    // 2. Inventory tổng
    renterAssetService.getMyInventory()
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        const total = rows.reduce((s, r) => s + (r.quantity ?? 0), 0);
        setStats(s => ({ ...s, totalInventory: total }));
        setInventory(rows.slice(0, 5));   // top 5
        setLoading(l => ({ ...l, inventory: false }));
      })
      .catch(() => setLoading(l => ({ ...l, inventory: false })));

    // 3. Inbound requests
    inventoryService.getInventoryRequests({ type: 'INBOUND', pageSize: 5 })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data?.data ?? []);
        const pending = items.filter(r => r.status === 'PENDING').length;
        setStats(s => ({ ...s, pendingInbound: pending }));
        setInbounds(items.slice(0, 5));
        setLoading(l => ({ ...l, inbounds: false }));
      })
      .catch(() => setLoading(l => ({ ...l, inbounds: false })));

    // 4. Outbound requests
    inventoryService.getInventoryRequests({ type: 'OUTBOUND', pageSize: 5 })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data?.data ?? []);
        const pending = items.filter(r => r.status === 'PENDING').length;
        setStats(s => ({ ...s, pendingOutbound: pending }));
        setOutbounds(items.slice(0, 5));
        setLoading(l => ({ ...l, outbounds: false }));
      })
      .catch(() => setLoading(l => ({ ...l, outbounds: false })));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Render ── */
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header (no action buttons) ── */}
      <div className="flex flex-col mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Bảng điều khiển</h2>
        <p className="text-slate-500 text-sm mt-1">Chào mừng trở lại, {userName}. Đây là những gì đang diễn ra hôm nay.</p>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Kho đang hoạt động */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined">corporate_fare</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Kho đang hoạt động</p>
          {loading.stats
            ? <div className="w-16 h-8 bg-slate-100 rounded animate-pulse mt-1" />
            : <h3 className="text-3xl font-bold mt-1 text-slate-900">{stats.activeContracts}</h3>
          }
        </div>

        {/* Hàng hóa lưu kho */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined">category</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Hàng hóa lưu kho</p>
          {loading.inventory
            ? <div className="w-20 h-8 bg-slate-100 rounded animate-pulse mt-1" />
            : <h3 className="text-3xl font-bold mt-1 text-slate-900">{stats.totalInventory.toLocaleString('vi-VN')}</h3>
          }
        </div>

        {/* Yêu cầu nhập đang chờ */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined">login</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Yêu cầu nhập đang chờ</p>
          {loading.inbounds
            ? <div className="w-12 h-8 bg-slate-100 rounded animate-pulse mt-1" />
            : <h3 className="text-3xl font-bold mt-1 text-emerald-600">{stats.pendingInbound}</h3>
          }
        </div>

        {/* Yêu cầu xuất đang chờ */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <span className="material-symbols-outlined">logout</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Yêu cầu xuất đang chờ</p>
          {loading.outbounds
            ? <div className="w-12 h-8 bg-slate-100 rounded animate-pulse mt-1" />
            : <h3 className="text-3xl font-bold mt-1 text-red-600">{stats.pendingOutbound}</h3>
          }
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Tổng quan tồn kho */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Tổng quan tồn kho</h3>
            <Link to="/renter-inventory" className="text-primary text-sm font-semibold hover:underline">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            {loading.inventory ? <Skeleton /> : inventory.length === 0 ? (
              <EmptyState icon="📦" msg="Chưa có hàng hóa nào trong kho" />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">Nhà kho</th>
                    <th className="px-5 py-3">Tên mặt hàng</th>
                    <th className="px-5 py-3">Số lượng</th>
                    <th className="px-5 py-3">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((row, i) => (
                    <tr key={row.inventoryId || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-900">{row.warehouseName || '—'}</td>
                      <td className="px-5 py-4">{row.assetName || '—'}</td>
                      <td className="px-5 py-4">{(row.quantity ?? 0).toLocaleString('vi-VN')} {row.unit || 'đơn vị'}</td>
                      <td className="px-5 py-4 text-slate-500">{timeAgo(row.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Yêu cầu nhập gần đây */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Yêu cầu nhập gần đây</h3>
            <Link to="/renter-inventory-history" className="text-primary text-sm font-semibold hover:underline">Theo dõi tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            {loading.inbounds ? <Skeleton /> : inbounds.length === 0 ? (
              <EmptyState icon="📥" msg="Chưa có yêu cầu nhập kho nào" />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Nhà kho</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inbounds.map((req, i) => (
                    <tr key={req.requestId || req.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-primary">
                        #{req.requestId || req.id}
                      </td>
                      <td className="px-5 py-4">{req.warehouseName || '—'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} map={STATUS_INBOUND} />
                      </td>
                      <td className="px-5 py-4 text-slate-500">{fmtDate(req.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Yêu cầu xuất gần đây (full width) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-2">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Yêu cầu xuất gần đây</h3>
            <Link to="/renter-inventory-history" className="text-primary text-sm font-semibold hover:underline">Xem lịch sử</Link>
          </div>
          <div className="overflow-x-auto">
            {loading.outbounds ? <Skeleton /> : outbounds.length === 0 ? (
              <EmptyState icon="📤" msg="Chưa có yêu cầu xuất kho nào" />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">ID yêu cầu</th>
                    <th className="px-5 py-3">Nhà kho</th>
                    <th className="px-5 py-3">Mặt hàng</th>
                    <th className="px-5 py-3">Ghi chú</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outbounds.map((req, i) => {
                    const firstItem = req.items?.[0];
                    return (
                      <tr key={req.requestId || req.id || i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-primary">
                          #{req.requestId || req.id}
                        </td>
                        <td className="px-5 py-4">{req.warehouseName || '—'}</td>
                        <td className="px-5 py-4">
                          {firstItem ? `${firstItem.itemName || firstItem.assetName} (${firstItem.quantity} ${firstItem.unit || 'đv'})` : '—'}
                          {req.items?.length > 1 && <span className="text-slate-400 text-xs"> +{req.items.length - 1} khác</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">{req.notes || '—'}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} map={STATUS_OUTBOUND} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-slate-400 text-sm border-t border-slate-200">
        © 2024 Hệ thống quản lý cho thuê kho trực tuyến (OWRMS). Bảo lưu mọi quyền.
      </footer>
    </div>
  );
};

export default RenterDashboard;
