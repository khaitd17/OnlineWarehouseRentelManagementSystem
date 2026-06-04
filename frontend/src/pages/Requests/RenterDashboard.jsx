import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
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

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

/* ── Chart Colors ── */
const CHART_COLORS = ['#6366f1', '#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

/* ── Build monthly activity data ── */
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
    PENDING: 'Chờ xử lý', CONFIRMED: 'Chờ xử lý',
    REJECTED: 'Từ chối', CANCELLED: 'Đã hủy',
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

/* ── Custom Tooltips ── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', padding: '12px 16px', borderRadius: 14,
      border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', fontSize: 13, fontWeight: 700, color: p.color || p.fill || '#0f172a' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString('vi-VN') : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
const RenterDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.fullName || user.FullName || 'bạn';

  /* ── State ── */
  const [stats, setStats] = useState({ activeContracts: 0, totalInventory: 0, pendingInbound: 0, pendingOutbound: 0 });
  const [inventory, setInventory] = useState([]);
  const [allInbounds, setAllInbounds] = useState([]);
  const [allOutbounds, setAllOutbounds] = useState([]);
  const [loading, setLoading] = useState({ stats: true, inventory: true, inbounds: true, outbounds: true });

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
        setInventory(rows.slice(0, 8));
        setLoading(l => ({ ...l, inventory: false }));
      })
      .catch(() => setLoading(l => ({ ...l, inventory: false })));

    // 3. Inbound requests
    inventoryService.getInventoryRequests({ type: 'INBOUND', pageSize: 50 })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data?.data ?? []);
        const pending = items.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED').length;
        setStats(s => ({ ...s, pendingInbound: pending }));
        setAllInbounds(items);
        setLoading(l => ({ ...l, inbounds: false }));
      })
      .catch(() => setLoading(l => ({ ...l, inbounds: false })));

    // 4. Outbound requests
    inventoryService.getInventoryRequests({ type: 'OUTBOUND', pageSize: 50 })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data?.data ?? []);
        const pending = items.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED').length;
        setStats(s => ({ ...s, pendingOutbound: pending }));
        setAllOutbounds(items);
        setLoading(l => ({ ...l, outbounds: false }));
      })
      .catch(() => setLoading(l => ({ ...l, outbounds: false })));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Derived ── */
  const inventoryBarData = useMemo(() => {
    return [...inventory]
      .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
      .slice(0, 6)
      .map(r => ({
        name: (r.assetName || '—').length > 14 ? (r.assetName || '—').slice(0, 14) + '…' : (r.assetName || '—'),
        'Số lượng': r.quantity ?? 0,
        fullName: r.assetName || '—',
      }));
  }, [inventory]);

  const monthlyData   = useMemo(() => buildMonthlyData(allInbounds, allOutbounds), [allInbounds, allOutbounds]);
  const statusPieData = useMemo(() => buildStatusPie([...allInbounds, ...allOutbounds]), [allInbounds, allOutbounds]);
  const totalRequests = allInbounds.length + allOutbounds.length;

  // Recent requests (combined, sorted by date)
  const combinedRecent = useMemo(() => {
    const all = [
      ...allInbounds.map(r => ({ ...r, _type: 'inbound' })),
      ...allOutbounds.map(r => ({ ...r, _type: 'outbound' })),
    ];
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [allInbounds, allOutbounds]);

  const isChartsLoading = loading.inbounds || loading.outbounds || loading.inventory;

  const STATUS_COLOR_MAP = {
    PENDING: { bg: '#fef3c7', color: '#92400e' },
    CONFIRMED: { bg: '#dbeafe', color: '#1e40af' },
    COMPLETED: { bg: '#dcfce7', color: '#15803d' },
    RECEIVED: { bg: '#dcfce7', color: '#15803d' },
    DELIVERED: { bg: '#dcfce7', color: '#15803d' },
    SHIPPED: { bg: '#dcfce7', color: '#15803d' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b' },
    CANCELLED: { bg: '#f1f5f9', color: '#64748b' },
    IN_TRANSIT: { bg: '#fde8b4', color: '#b45309' },
    PROCESSING: { bg: '#dbeafe', color: '#1e40af' },
  };

  const STATUS_LABEL = {
    PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', COMPLETED: 'Hoàn thành',
    RECEIVED: 'Đã nhận', DELIVERED: 'Đã giao', SHIPPED: 'Đã gửi',
    REJECTED: 'Từ chối', CANCELLED: 'Đã hủy',
    IN_TRANSIT: 'Đang chuyển', PROCESSING: 'Đang xử lý',
  };

  /* ── Skeleton ── */
  const ShimmerBar = ({ w = '100%', h = 28 }) => (
    <div style={{
      width: w, height: h, borderRadius: 10,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  );

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="rd-premium" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
      <div className="rd-inner">

        {/* ────────── HEADER ────────── */}
        <header className="rd-header">
          <div className="rd-header-left">
            <div className="rd-header-badge">Renter Dashboard</div>
            <h1 className="rd-title">
              {getGreeting()}, <span className="rd-title-name">{userName}</span>
            </h1>
            <p className="rd-subtitle">
              Quản lý kho hàng, theo dõi yêu cầu nhập/xuất và tồn kho của bạn.
            </p>
          </div>
          <div className="rd-header-actions">
            <button className="rd-btn rd-btn-ghost" onClick={loadAll}>Làm mới</button>
            <Link to="/create-inventory" className="rd-btn rd-btn-primary" style={{ textDecoration: 'none' }}>Tạo yêu cầu nhập</Link>
          </div>
        </header>

        {/* ────────── KPI CARDS ────────── */}
        <div className="rd-kpi-grid">
          {[
            { label: 'Kho đang hoạt động', value: loading.stats ? null : stats.activeContracts, sub: 'Hợp đồng đang hiệu lực', accent: '#6366f1', tag: 'Hiện tại' },
            { label: 'Hàng hóa lưu kho', value: loading.inventory ? null : stats.totalInventory, sub: 'Tổng số lượng tồn kho', accent: '#0891b2', tag: 'Tổng hợp' },
            { label: 'Yêu cầu nhập chờ xử lý', value: loading.inbounds ? null : stats.pendingInbound, sub: 'Đang chờ tiếp nhận', accent: '#f59e0b', tag: stats.pendingInbound > 0 ? 'Cần xử lý' : 'Tốt', highlight: stats.pendingInbound > 0 },
            { label: 'Yêu cầu xuất chờ xử lý', value: loading.outbounds ? null : stats.pendingOutbound, sub: 'Đang chờ tiếp nhận', accent: '#ef4444', tag: stats.pendingOutbound > 0 ? 'Cần xử lý' : 'Tốt', highlight: stats.pendingOutbound > 0 },
          ].map((card, i) => (
            <div key={i} className="rd-kpi-card" style={{ '--kpi-accent': card.accent }}>
              <div className="rd-kpi-top">
                <span className="rd-kpi-label">{card.label}</span>
                <span className="rd-kpi-tag" style={{
                  background: card.highlight ? `${card.accent}18` : `${card.accent}12`,
                  color: card.accent,
                  fontWeight: card.highlight ? 900 : 800,
                }}>{card.tag}</span>
              </div>
              {card.value === null ? (
                <ShimmerBar w={90} h={38} />
              ) : (
                <div className={`rd-kpi-value ${card.highlight ? 'rd-kpi-highlight' : ''}`} style={card.highlight ? { color: card.accent } : {}}>
                  {typeof card.value === 'number' ? card.value.toLocaleString('vi-VN') : card.value}
                </div>
              )}
              <p className="rd-kpi-sub">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ────────── CHARTS ROW 1 ────────── */}
        <div className="rd-chart-row">
          {/* Bar Chart — Tồn kho */}
          <div className="rd-card rd-chart-main">
            <div className="rd-card-header">
              <div>
                <h2 className="rd-card-title">Tồn kho theo mặt hàng</h2>
                <p className="rd-card-sub">Top hàng hóa đang lưu trữ tại kho</p>
              </div>
            </div>
            <div className="rd-card-body" style={{ height: 280 }}>
              {isChartsLoading ? (
                <div className="rd-empty"><ShimmerBar w="60%" h={14} /><ShimmerBar w="80%" h={14} /><ShimmerBar w="40%" h={14} /></div>
              ) : inventoryBarData.length === 0 ? (
                <div className="rd-empty">Chưa có hàng hóa nào trong kho</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryBarData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<DarkTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                    <Bar dataKey="Số lượng" radius={[8, 8, 8, 8]} barSize={36}>
                      {inventoryBarData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie Chart — Trạng thái */}
          <div className="rd-card rd-chart-side">
            <div className="rd-card-header">
              <div>
                <h2 className="rd-card-title">Trạng thái yêu cầu</h2>
                <p className="rd-card-sub">Tổng {totalRequests} yêu cầu nhập/xuất</p>
              </div>
              <span className="rd-meta-tag">Tất cả</span>
            </div>
            <div className="rd-card-body" style={{ height: 280, position: 'relative' }}>
              {isChartsLoading ? (
                <div className="rd-empty"><ShimmerBar w="60%" h={14} /></div>
              ) : statusPieData.length === 0 ? (
                <div className="rd-empty">Chưa có yêu cầu nào</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData} cx="50%" cy="45%"
                      innerRadius={62} outerRadius={90} paddingAngle={4}
                      dataKey="value" stroke="none"
                    >
                      {statusPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom" height={40} iconType="circle" iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.08)' }}
                      formatter={(val) => [`${val} yêu cầu`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {totalRequests > 0 && !isChartsLoading && (
                <div className="rd-pie-center">
                  <span className="rd-pie-center-val">{totalRequests}</span>
                  <span className="rd-pie-center-label">Tổng</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ────────── CHARTS ROW 2: Activity + Recent ────────── */}
        <div className="rd-second-row">
          {/* Area Chart — Hoạt động nhập/xuất */}
          <div className="rd-card rd-area-chart">
            <div className="rd-card-header">
              <div>
                <h2 className="rd-card-title">Hoạt động nhập / xuất kho</h2>
                <p className="rd-card-sub">Số lượng yêu cầu theo tháng — 6 tháng gần nhất</p>
              </div>
            </div>
            <div className="rd-card-body" style={{ height: 260 }}>
              {isChartsLoading ? (
                <div className="rd-empty"><ShimmerBar w="60%" h={14} /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rdGradIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rdGradOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={(v) => <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{v}</span>}
                    />
                    <Area type="monotone" dataKey="Nhập kho" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#rdGradIn)" activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                    <Area type="monotone" dataKey="Xuất kho" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#rdGradOut)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="rd-card rd-recent-box">
            <div className="rd-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
              <h2 className="rd-card-title">Yêu cầu gần đây</h2>
              <span className="rd-meta-tag">{totalRequests} tổng</span>
            </div>
            <div className="rd-recent-list">
              {isChartsLoading ? (
                <div className="rd-empty"><ShimmerBar w="60%" h={14} /><ShimmerBar w="80%" h={14} /><ShimmerBar w="50%" h={14} /></div>
              ) : combinedRecent.length === 0 ? (
                <div className="rd-empty">Chưa có yêu cầu nào</div>
              ) : (
                combinedRecent.map((req, i) => {
                  const isIn = req._type === 'inbound';
                  const stColor = STATUS_COLOR_MAP[req.status] || { bg: '#f1f5f9', color: '#64748b' };
                  const stLabel = STATUS_LABEL[req.status] || req.status;
                  return (
                    <div key={req.requestId || i} className="rd-recent-item">
                      <div className="rd-recent-type" style={{ background: isIn ? '#eef2ff' : '#fef3c7', color: isIn ? '#4f46e5' : '#b45309' }}>
                        {isIn ? 'IN' : 'OUT'}
                      </div>
                      <div className="rd-recent-content">
                        <p className="rd-recent-title">
                          {isIn ? 'Yêu cầu nhập kho' : 'Yêu cầu xuất kho'}
                          {req.requestCode && <span className="rd-recent-code">#{req.requestCode}</span>}
                        </p>
                        <div className="rd-recent-meta">
                          <span className="rd-status-pill" style={{ background: stColor.bg, color: stColor.color }}>{stLabel}</span>
                          <span className="rd-recent-time">{timeAgo(req.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="rd-recent-footer">
              <Link to="/renter-inventory-history?tab=inbound" className="rd-link">Xem tất cả yêu cầu</Link>
            </div>
          </div>
        </div>

        {/* ────────── INVENTORY TABLE ────────── */}
        {!loading.inventory && inventory.length > 0 && (
          <div className="rd-table-container">
            <div className="rd-card-header" style={{ padding: '22px 28px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 className="rd-card-title">Danh mục hàng hóa trong kho</h2>
                <p className="rd-card-sub">Top hàng hóa đang lưu trữ</p>
              </div>
              <Link to="/renter-inventory" className="rd-link">Xem tất cả</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="rd-table">
                <thead>
                  <tr>
                    <th>Tên hàng hóa</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Kho lưu trữ</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.slice(0, 6).map((item, i) => (
                    <tr key={item.assetId || i}>
                      <td>
                        <span className="rd-inv-name">{item.assetName || '—'}</span>
                      </td>
                      <td>
                        <span className="rd-inv-qty">{(item.quantity ?? 0).toLocaleString('vi-VN')}</span>
                      </td>
                      <td className="rd-inv-unit">{item.unit || 'đv'}</td>
                      <td className="rd-inv-wh">{item.warehouseName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ────────── STYLES ────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .rd-premium {
          width: 100%;
          flex: 1;
          min-width: 0;
          animation: fadeInUp 0.5s ease;
        }
        .rd-inner {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
        }

        /* ── Header ── */
        .rd-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .rd-header-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          margin-bottom: 10px;
          box-shadow: 0 4px 14px rgba(99,102,241,0.25);
        }
        .rd-title {
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin: 0 0 6px;
        }
        .rd-title-name {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .rd-subtitle {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
          margin: 0;
          max-width: 520px;
        }
        .rd-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          background: #fff;
          padding: 5px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .rd-btn {
          padding: 10px 22px;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }
        .rd-btn-ghost {
          background: #f8fafc;
          color: #64748b;
        }
        .rd-btn-ghost:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .rd-btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 14px rgba(99,102,241,0.3);
        }
        .rd-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.4);
        }

        /* ── KPI Cards ── */
        .rd-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }
        .rd-kpi-card {
          background: #fff;
          border-radius: 20px;
          padding: 22px;
          border: 1px solid #f1f5f9;
          border-left: 4px solid var(--kpi-accent);
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .rd-kpi-card::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 90px; height: 90px;
          background: var(--kpi-accent);
          opacity: 0.03;
          border-radius: 0 0 0 100%;
          transition: all 0.4s;
        }
        .rd-kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
          border-color: #e2e8f0;
        }
        .rd-kpi-card:hover::after {
          opacity: 0.06;
          width: 130px; height: 130px;
        }
        .rd-kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .rd-kpi-label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }
        .rd-kpi-tag {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 10px;
          border-radius: 100px;
        }
        .rd-kpi-value {
          font-size: 30px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 6px;
        }
        .rd-kpi-highlight {
          animation: none;
        }
        .rd-kpi-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          margin: 0;
        }

        /* ── Cards shared ── */
        .rd-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          overflow: hidden;
        }
        .rd-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 22px 24px 0;
          margin-bottom: 16px;
        }
        .rd-card-title {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .rd-card-sub {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 4px 0 0;
        }
        .rd-card-body {
          padding: 0 16px 16px;
        }
        .rd-meta-tag {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          background: #f8fafc;
          padding: 4px 12px;
          border-radius: 100px;
          white-space: nowrap;
        }

        /* ── Charts layout ── */
        .rd-chart-row {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 20px;
        }

        /* ── Second row ── */
        .rd-second-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        /* ── Pie center ── */
        .rd-pie-center {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }
        .rd-pie-center-val {
          display: block;
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .rd-pie-center-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
        }

        /* ── Recent requests ── */
        .rd-recent-box {
          display: flex;
          flex-direction: column;
        }
        .rd-recent-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
        }
        .rd-recent-item {
          display: flex;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #f8fafc;
          align-items: flex-start;
          transition: all 0.2s;
        }
        .rd-recent-item:last-child { border-bottom: none; }
        .rd-recent-item:hover { opacity: 0.85; }
        .rd-recent-type {
          font-size: 10px;
          font-weight: 900;
          width: 36px; height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .rd-recent-content {
          flex: 1;
          min-width: 0;
        }
        .rd-recent-title {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .rd-recent-code {
          font-weight: 600;
          color: #94a3b8;
          margin-left: 6px;
          font-size: 11px;
        }
        .rd-recent-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rd-status-pill {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 10px;
          border-radius: 100px;
        }
        .rd-recent-time {
          font-size: 10px;
          font-weight: 700;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .rd-recent-footer {
          padding: 14px 24px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
        }

        /* ── Table ── */
        .rd-table-container {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          overflow: hidden;
        }
        .rd-link {
          font-size: 13px;
          font-weight: 800;
          color: #6366f1;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .rd-link:hover { opacity: 0.7; }
        .rd-table {
          width: 100%;
          text-align: left;
          border-collapse: collapse;
        }
        .rd-table thead tr {
          background: #fafbfd;
        }
        .rd-table th {
          padding: 14px 28px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6366f1;
          border-bottom: 1px solid #f1f5f9;
        }
        .rd-table tbody tr {
          transition: background 0.2s;
        }
        .rd-table tbody tr:hover {
          background: #fafbfd;
        }
        .rd-table td {
          padding: 14px 28px;
          border-bottom: 1px solid #f8fafc;
          font-size: 14px;
        }
        .rd-inv-name { font-weight: 800; color: #1e293b; }
        .rd-inv-qty {
          font-weight: 900;
          color: #0f172a;
          font-size: 15px;
        }
        .rd-inv-unit { color: #94a3b8; font-weight: 600; font-size: 13px; }
        .rd-inv-wh { color: #64748b; font-weight: 600; font-size: 13px; }

        .rd-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 20px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .rd-chart-row,
          .rd-second-row {
            grid-template-columns: 1fr;
          }
          .rd-kpi-grid {
            grid-template-columns: 1fr 1fr;
          }
          .rd-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .rd-header-actions {
            align-self: stretch;
          }
          .rd-btn { flex: 1; text-align: center; }
        }
        @media (max-width: 480px) {
          .rd-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RenterDashboard;
