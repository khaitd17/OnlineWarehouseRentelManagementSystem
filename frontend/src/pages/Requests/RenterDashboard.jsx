import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
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
  PENDING:    { label: 'Chờ xử lý',       bg: '#fef3c7', color: '#92400e' },
  APPROVED:   { label: 'Đã duyệt',        bg: '#d1fae5', color: '#065f46' },
  IN_TRANSIT: { label: 'Đang vận chuyển', bg: '#fde8b4', color: '#b45309' },
  RECEIVED:   { label: 'Đã nhận hàng',    bg: '#d1fae5', color: '#065f46' },
  REJECTED:   { label: 'Đã từ chối',      bg: '#fee2e2', color: '#991b1b' },
  CANCELLED:  { label: 'Đã hủy',          bg: '#f1f5f9', color: '#64748b' },
  COMPLETED:  { label: 'Hoàn thành',      bg: '#d1fae5', color: '#065f46' },
};

const STATUS_OUTBOUND = {
  PENDING:    { label: 'Đang chờ',       bg: '#fef3c7', color: '#92400e' },
  APPROVED:   { label: 'Đã duyệt',       bg: '#dbeafe', color: '#1e40af' },
  PROCESSING: { label: 'Đang lấy hàng',  bg: '#dbeafe', color: '#1e40af' },
  SHIPPED:    { label: 'Đã gửi hàng',    bg: '#d1fae5', color: '#065f46' },
  DELIVERED:  { label: 'Đã giao hàng',   bg: '#d1fae5', color: '#065f46' },
  REJECTED:   { label: 'Đã từ chối',     bg: '#fee2e2', color: '#991b1b' },
  CANCELLED:  { label: 'Đã hủy',         bg: '#f1f5f9', color: '#64748b' },
  COMPLETED:  { label: 'Hoàn thành',     bg: '#d1fae5', color: '#065f46' },
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

/* ── Chart Colors ── */
const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const PIE_COLORS   = { Hoàn_thành: '#10b981', 'Chờ_xử_lý': '#f59e0b', 'Từ_chối': '#ef4444', 'Đã_hủy': '#94a3b8', Khác: '#6366f1' };

/* ── Custom Tooltip ── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', color: '#f8fafc', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color }}>{p.name}: <b>{p.value.toLocaleString('vi-VN')}</b></p>
      ))}
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', color: '#f8fafc', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  );
};

/* ── Build monthly activity data from requests lists ── */
const buildMonthlyData = (inboundAll, outboundAll) => {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`,
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months.map(m => {
    const inCount = inboundAll.filter(r => {
      const d = new Date(r.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length;
    const outCount = outboundAll.filter(r => {
      const d = new Date(r.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length;
    return { month: m.label, 'Nhập kho': inCount, 'Xuất kho': outCount };
  });
};

/* ── Build status distribution for pie chart ── */
const buildStatusPie = (allRequests) => {
  const map = {};
  allRequests.forEach(r => {
    const st = r.status || 'UNKNOWN';
    map[st] = (map[st] || 0) + 1;
  });
  const labelMap = {
    COMPLETED: 'Hoàn thành', RECEIVED: 'Hoàn thành', DELIVERED: 'Hoàn thành', SHIPPED: 'Hoàn thành',
    PENDING: 'Chờ xử lý',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
    APPROVED: 'Đã duyệt',
    IN_TRANSIT: 'Đang vận chuyển', PROCESSING: 'Đang vận chuyển',
  };
  const merged = {};
  Object.entries(map).forEach(([k, v]) => {
    const label = labelMap[k] || 'Khác';
    merged[label] = (merged[label] || 0) + v;
  });
  const COLOR_MAP = {
    'Hoàn thành': '#10b981', 'Chờ xử lý': '#f59e0b', 'Từ chối': '#ef4444',
    'Đã hủy': '#94a3b8', 'Đã duyệt': '#6366f1', 'Đang vận chuyển': '#3b82f6', 'Khác': '#e2e8f0',
  };
  return Object.entries(merged).map(([name, value]) => ({ name, value, fill: COLOR_MAP[name] || '#e2e8f0' }));
};

/* ══════════════════════════════════════════════════════ */
const RenterDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = (user.fullName || user.FullName || 'bạn').split(' ').pop() || 'bạn';

  /* ── State ── */
  const [stats, setStats]           = useState({ activeContracts: 0, totalInventory: 0, pendingInbound: 0, pendingOutbound: 0 });
  const [inventory, setInventory]   = useState([]);
  const [inbounds,  setInbounds]    = useState([]);
  const [outbounds, setOutbounds]   = useState([]);
  const [allInbounds, setAllInbounds]   = useState([]);
  const [allOutbounds, setAllOutbounds] = useState([]);
  const [loading, setLoading]       = useState({ stats: true, inventory: true, inbounds: true, outbounds: true });

  /* ── Loaders ── */
  const loadAll = useCallback(async () => {
    // 1. Active contracts
    rentalService.getMyContracts()
      .then(data => {
        const active = (data || []).filter(c => c.status === 'ACTIVE');
        setStats(s => ({ ...s, activeContracts: active.length }));
        setLoading(l => ({ ...l, stats: false }));
      })
      .catch(() => setLoading(l => ({ ...l, stats: false })));

    // 2. Inventory
    renterAssetService.getMyInventory()
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        const total = rows.reduce((s, r) => s + (r.quantity ?? 0), 0);
        setStats(s => ({ ...s, totalInventory: total }));
        setInventory(rows.slice(0, 5));
        setLoading(l => ({ ...l, inventory: false }));
      })
      .catch(() => setLoading(l => ({ ...l, inventory: false })));

    // 3. Inbound requests — load MORE for charts (pageSize=50)
    inventoryService.getInventoryRequests({ type: 'INBOUND', pageSize: 50 })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data?.data ?? []);
        const pending = items.filter(r => r.status === 'PENDING').length;
        setStats(s => ({ ...s, pendingInbound: pending }));
        setInbounds(items.slice(0, 5));
        setAllInbounds(items);
        setLoading(l => ({ ...l, inbounds: false }));
      })
      .catch(() => setLoading(l => ({ ...l, inbounds: false })));

    // 4. Outbound requests
    inventoryService.getInventoryRequests({ type: 'OUTBOUND', pageSize: 50 })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data?.data ?? []);
        const pending = items.filter(r => r.status === 'PENDING').length;
        setStats(s => ({ ...s, pendingOutbound: pending }));
        setOutbounds(items.slice(0, 5));
        setAllOutbounds(items);
        setLoading(l => ({ ...l, outbounds: false }));
      })
      .catch(() => setLoading(l => ({ ...l, outbounds: false })));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Derived chart data ── */
  const inventoryBarData = useMemo(() => {
    // top 6 hàng hóa theo số lượng tồn kho
    return [...inventory]
      .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
      .slice(0, 6)
      .map(r => ({
        name: (r.assetName || '—').length > 12 ? (r.assetName || '—').slice(0, 12) + '…' : (r.assetName || '—'),
        'Số lượng': r.quantity ?? 0,
        fullName: r.assetName || '—',
        unit: r.unit || 'đv',
      }));
  }, [inventory]);

  const monthlyData   = useMemo(() => buildMonthlyData(allInbounds, allOutbounds), [allInbounds, allOutbounds]);
  const statusPieData = useMemo(() => buildStatusPie([...allInbounds, ...allOutbounds]), [allInbounds, allOutbounds]);

  const totalRequests = allInbounds.length + allOutbounds.length;

  const isChartsLoading = loading.inbounds || loading.outbounds || loading.inventory;

  /* ── Render ── */
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .rd-chart-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .rd-chart-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rd-chart-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rd-chart-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 400;
          margin-top: 2px;
        }
        .rd-chart-body {
          padding: 16px 8px 12px;
        }
        .rd-stat-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 20px 22px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: default;
        }
        .rd-stat-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .rd-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Bảng điều khiển</h2>
        <p className="text-slate-500 text-sm mt-1">Chào mừng trở lại, {userName}. Đây là những gì đang diễn ra hôm nay.</p>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: 'corporate_fare', color: '#6366f1', bg: 'rgba(99,102,241,0.10)', label: 'Kho đang hoạt động',    val: stats.activeContracts,  key: 'stats',    bold: false },
          { icon: 'inventory_2',    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  label: 'Hàng hóa lưu kho',     val: stats.totalInventory,   key: 'inventory', bold: false },
          { icon: 'login',          color: '#10b981', bg: 'rgba(16,185,129,0.10)',  label: 'Yêu cầu nhập chờ xử',  val: stats.pendingInbound,   key: 'inbounds',  bold: stats.pendingInbound > 0, boldColor: '#d97706' },
          { icon: 'logout',         color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   label: 'Yêu cầu xuất chờ xử',  val: stats.pendingOutbound,  key: 'outbounds', bold: stats.pendingOutbound > 0, boldColor: '#dc2626' },
        ].map((c, i) => (
          <div key={i} className="rd-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="rd-icon" style={{ background: c.bg }}>
                <span className="material-symbols-outlined" style={{ color: c.color, fontSize: 22 }}>{c.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{c.label}</p>
                {loading[c.key]
                  ? <div style={{ width: 56, height: 28, background: '#f1f5f9', borderRadius: 6, marginTop: 4, animation: 'pulse 1.4s ease-in-out infinite' }} />
                  : <p style={{ margin: '2px 0 0', fontSize: '1.75rem', fontWeight: 800, color: c.bold ? (c.boldColor || '#1e293b') : '#1e293b', lineHeight: 1 }}>
                      {c.val.toLocaleString('vi-VN')}
                    </p>
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════ CHARTS ROW 1 ══════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ① Bar Chart — Tồn kho theo mặt hàng */}
        <div className="rd-chart-card" style={{ gridColumn: window.innerWidth < 900 ? '1/-1' : undefined }}>
          <div className="rd-chart-header">
            <div>
              <div className="rd-chart-title">
                <span style={{ fontSize: 18 }}>📦</span> Tồn kho theo mặt hàng
              </div>
              <div className="rd-chart-subtitle">Top hàng hóa đang lưu tại kho</div>
            </div>
          </div>
          <div className="rd-chart-body" style={{ height: 230 }}>
            {isChartsLoading ? <Skeleton /> : inventoryBarData.length === 0 ? (
              <EmptyState icon="📦" msg="Chưa có hàng hóa nào trong kho" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryBarData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="Số lượng" radius={[6, 6, 0, 0]}>
                    {inventoryBarData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ② Pie Chart — Phân bổ trạng thái yêu cầu */}
        <div className="rd-chart-card">
          <div className="rd-chart-header">
            <div>
              <div className="rd-chart-title">
                <span style={{ fontSize: 18 }}>🎯</span> Trạng thái yêu cầu
              </div>
              <div className="rd-chart-subtitle">Tổng {totalRequests} yêu cầu nhập/xuất</div>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Tất cả thời gian</span>
          </div>
          <div className="rd-chart-body" style={{ height: 230 }}>
            {isChartsLoading ? <Skeleton /> : statusPieData.length === 0 ? (
              <EmptyState icon="🎯" msg="Chưa có yêu cầu nào" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="42%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={86}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {statusPieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} yêu cầu`, name]} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={9}
                    formatter={(value) => <span style={{ fontSize: 11, color: '#475569' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════ CHARTS ROW 2 ══════════════════ */}
      <div style={{ marginBottom: 20 }}>
        {/* ③ Area/Line Chart — Hoạt động nhập/xuất 6 tháng gần nhất */}
        <div className="rd-chart-card">
          <div className="rd-chart-header">
            <div>
              <div className="rd-chart-title">
                <span style={{ fontSize: 18 }}>📈</span> Hoạt động nhập/xuất kho
              </div>
              <div className="rd-chart-subtitle">Số lượng yêu cầu theo tháng trong 6 tháng gần nhất</div>
            </div>
          </div>
          <div className="rd-chart-body" style={{ height: 220 }}>
            {isChartsLoading ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 4, right: 24, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend iconType="circle" iconSize={9} formatter={(v) => <span style={{ fontSize: 11, color: '#475569' }}>{v}</span>} />
                  <Area type="monotone" dataKey="Nhập kho" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradIn)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="Xuất kho" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradOut)" dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default RenterDashboard;
