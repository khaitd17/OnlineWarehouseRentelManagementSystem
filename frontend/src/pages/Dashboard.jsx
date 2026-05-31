import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyWarehouses, getOccupancyStats } from '../services/warehouseService';
import rentalService from '../services/rentalService';
import notificationService from '../services/notificationService';
import staffService from '../services/staffService';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ── Helpers ── */
const fmtVND = (n) =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(1)} tỷ`
    : n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)} tr`
    : (n ?? 0).toLocaleString('vi-VN') + ' đ';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return 'Vừa xong';
  if (diff < 3600)   return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const barColor = (pct) => {
  if (pct >= 90) return '#f97316';
  if (pct >= 60) return '#0891b2';
  if (pct >= 40) return '#06b6d4';
  return '#f43f5e';
};

const WH_STATUS_MAP = {
  APPROVED:    { label: 'Hoạt động',  bg: '#dcfce7', color: '#15803d' },
  ACTIVE:      { label: 'Hoạt động',  bg: '#dcfce7', color: '#15803d' },
  PENDING:     { label: 'Chờ duyệt',  bg: '#fef9c3', color: '#92400e' },
  MAINTENANCE: { label: 'Bảo trì',    bg: '#ffedd5', color: '#c2410c' },
  INACTIVE:    { label: 'Ngừng HĐ',   bg: '#f1f5f9', color: '#64748b' },
  REJECTED:    { label: 'Bị từ chối', bg: '#fee2e2', color: '#dc2626' },
};
const whStatus = (s) => WH_STATUS_MAP[s?.toUpperCase()] || { label: s || 'Không rõ', bg: '#f1f5f9', color: '#64748b' };

const NOTIF_COLOR = {
  CONTRACT_APPROVED:       '#10b981',
  CONTRACT_SENT:           '#3b82f6',
  CONTRACT_SIGNED:         '#8b5cf6',
  CONTRACT_REJECTED:       '#ef4444',
  RENTAL_REQUEST_RECEIVED: '#0ea5e9',
  INVENTORY_REQUEST:       '#f59e0b',
  DEFAULT:                 '#94a3b8',
};
const notifColor = (type) => NOTIF_COLOR[type] || NOTIF_COLOR.DEFAULT;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

/* ══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  /* ── State ── */
  const [warehouses,   setWarehouses]   = useState([]);
  const [occupancy,    setOccupancy]    = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [staffCount,   setStaffCount]   = useState(null);
  const [activities,   setActivities]   = useState([]);
  const [loading, setLoading] = useState({
    warehouses: true, occupancy: true, revenue: true, staff: true, activities: true,
  });

  /* ── Loaders ── */
  const loadAll = useCallback(async () => {
    // 1. Owner warehouses list
    getMyWarehouses()
      .then(data => {
        setWarehouses(Array.isArray(data) ? data : []);
        setLoading(l => ({ ...l, warehouses: false }));
      })
      .catch(() => setLoading(l => ({ ...l, warehouses: false })));

    // 2. Occupancy stats
    getOccupancyStats()
      .then(data => {
        setOccupancy(data);
        setLoading(l => ({ ...l, occupancy: false }));
      })
      .catch(() => setLoading(l => ({ ...l, occupancy: false })));

    // 3. Revenue from contracts
    rentalService.getMyContracts()
      .then(data => {
        const active = (data || []).filter(c => c.status === 'ACTIVE');
        const rev = active.reduce((s, c) => s + (c.monthlyRent || c.totalAmount || 0), 0);
        setTotalRevenue(rev);
        setLoading(l => ({ ...l, revenue: false }));
      })
      .catch(() => setLoading(l => ({ ...l, revenue: false })));

    // 4. Staff count
    staffService.getMyManagedWarehouses()
      .then(async (whs) => {
        if (!whs || whs.length === 0) {
          setStaffCount(0);
          setLoading(l => ({ ...l, staff: false }));
          return;
        }
        const results = await Promise.allSettled(
          whs.map(w => staffService.listStaff(w.warehouseId, 1, 1, ''))
        );
        const total = results.reduce((s, r) => {
          if (r.status === 'fulfilled') {
            const d = r.value;
            return s + (d.totalCount ?? d.total ?? (Array.isArray(d) ? d.length : 0));
          }
          return s;
        }, 0);
        setStaffCount(total);
        setLoading(l => ({ ...l, staff: false }));
      })
      .catch(() => {
        setStaffCount(0);
        setLoading(l => ({ ...l, staff: false }));
      });

    // 5. Recent activity from notifications
    notificationService.getNotifications(1, 6)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || data?.items || []);
        setActivities(items.slice(0, 6));
        setLoading(l => ({ ...l, activities: false }));
      })
      .catch(() => {
        setActivities([]);
        setLoading(l => ({ ...l, activities: false }));
      });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Computed ── */
  const totalWarehouses = occupancy?.totalWarehouses ?? warehouses.length;
  const avgOccupancy    = occupancy?.averageOccupancyRate ?? 0;
  const activeCount     = warehouses.filter(w => (w.status || '').toUpperCase() === 'APPROVED').length;

  const warehouseRows = warehouses.slice(0, 6).map(wh => {
    const occ = occupancy?.warehouses?.find(o => o.warehouseId === wh.warehouseId);
    return { ...wh, occupancyPct: occ ? Math.round(occ.occupancyRate) : 0 };
  });

  // Occupancy trends for AreaChart
  const trendData = occupancy?.occupancyTrends || [];

  // Pie data
  const totalGlobalArea   = occupancy?.totalGlobalArea || 0;
  const totalOccupiedArea = occupancy?.totalOccupiedArea || 0;
  const totalReservedArea = occupancy?.totalReservedArea || 0;
  const totalAvailableArea = occupancy?.totalAvailableArea || 0;
  const pieData = [
    { name: 'Đã thuê',    value: totalOccupiedArea,  color: '#10b981' },
    { name: 'Đặt trước',  value: totalReservedArea,  color: '#f59e0b' },
    { name: 'Còn trống',  value: totalAvailableArea,  color: '#e2e8f0' },
  ].filter(d => d.value > 0);

  // Equipment
  const equip = occupancy?.equipmentStats;

  const lowPerformanceCount = (occupancy?.warehouses || []).filter(w => w.occupancyRate < 40).length;

  /* ── Custom Tooltip ── */
  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff', padding: '12px 16px', borderRadius: 14,
          border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ fontSize: 13, fontWeight: 800, color: p.color || '#0f172a' }}>
              {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}% — {p.name}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  /* ── Skeleton ── */
  const Skeleton = ({ w = '100%', h = 32, r = 10 }) => (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  );

  const isAllLoading = Object.values(loading).some(Boolean);

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="dashboard-premium" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
      <div className="dp-inner">

        {/* ────────── HEADER ────────── */}
        <header className="dp-header">
          <div className="dp-header-left">
            <div className="dp-header-badge">Analytics Dashboard</div>
            <h1 className="dp-title">
              {getGreeting()}, <span className="dp-title-name">{user.fullName || user.username || 'bạn'}</span>
            </h1>
            <p className="dp-subtitle">
              Các chỉ số hiệu suất thời gian thực trên toàn bộ danh mục kho bãi của bạn.
            </p>
          </div>
          <div className="dp-header-actions">
            <button className="dp-btn dp-btn-ghost" onClick={loadAll}>Làm mới</button>
            <button className="dp-btn dp-btn-primary">Xuất báo cáo</button>
          </div>
        </header>

        {/* ────────── KPI CARDS ────────── */}
        <div className="dp-kpi-grid">
          {[
            { label: 'Tổng doanh thu', value: loading.revenue ? null : fmtVND(totalRevenue ?? 0), sub: 'Từ hợp đồng đang hiệu lực', accent: '#0891b2', tag: 'Live' },
            { label: 'Tỷ lệ lấp đầy TB', value: loading.occupancy ? null : `${avgOccupancy.toFixed(1)}%`, sub: 'Trung bình tất cả kho', accent: '#f59e0b', tag: '30 ngày' },
            { label: 'Tổng số kho', value: loading.warehouses ? null : totalWarehouses, sub: `${activeCount} đang hoạt động`, accent: '#8b5cf6', tag: 'Tổng hợp' },
            { label: 'Tổng nhân viên', value: loading.staff ? null : (staffCount ?? 0), sub: 'Nhân viên đang làm việc', accent: '#10b981', tag: 'Hiện tại' },
          ].map((card, i) => (
            <div key={i} className="dp-kpi-card" style={{ '--kpi-accent': card.accent }}>
              <div className="dp-kpi-top">
                <span className="dp-kpi-label">{card.label}</span>
                <span className="dp-kpi-tag" style={{ background: `${card.accent}12`, color: card.accent }}>{card.tag}</span>
              </div>
              {card.value === null ? (
                <Skeleton w={100} h={36} />
              ) : (
                <div className="dp-kpi-value">{card.value}</div>
              )}
              <p className="dp-kpi-sub">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ────────── CHARTS ROW ────────── */}
        <div className="dp-chart-row">
          {/* Area Chart — Xu hướng công suất */}
          <div className="dp-chart-box dp-chart-main">
            <div className="dp-section-header">
              <div>
                <h2 className="dp-section-title">Xu hướng công suất</h2>
                <p className="dp-section-sub">Tỷ lệ lấp đầy 30 ngày vừa qua</p>
              </div>
              {trendData.length > 1 && (() => {
                const first = trendData[0]?.rate || 0;
                const last = trendData[trendData.length - 1]?.rate || 0;
                const diff = last - first;
                return (
                  <span className="dp-trend-badge" style={{
                    background: diff >= 0 ? '#dcfce7' : '#fee2e2',
                    color: diff >= 0 ? '#15803d' : '#dc2626',
                  }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                  </span>
                );
              })()}
            </div>
            {trendData.length === 0 ? (
              <div className="dp-empty">Chưa có dữ liệu xu hướng</div>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(str) => { const p = str.split('-'); return `${p[2]}/${p[1]}`; }}
                      dy={10} interval={4}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(val) => `${val.toFixed(0)}%`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone" dataKey="rate" name="Công suất"
                      stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#occGrad)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#0891b2' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pie Chart — Phân bổ không gian */}
          <div className="dp-chart-box dp-chart-side">
            <div className="dp-section-header">
              <div>
                <h2 className="dp-section-title">Phân bổ không gian</h2>
                <p className="dp-section-sub">Tổng hệ thống</p>
              </div>
            </div>
            {pieData.length === 0 ? (
              <div className="dp-empty">Chưa có dữ liệu</div>
            ) : (
              <div style={{ width: '100%', height: 300, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%" innerRadius={68} outerRadius={96}
                      paddingAngle={4} dataKey="value" stroke="none"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom" height={36} iconType="circle"
                      formatter={(value) => <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.08)' }}
                      formatter={(val) => [`${val.toLocaleString()} m²`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {totalGlobalArea > 0 && (
                  <div className="dp-pie-center">
                    <span className="dp-pie-center-label">Trống</span>
                    <span className="dp-pie-center-value">{((totalAvailableArea / totalGlobalArea) * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ────────── SECOND ROW: Equipment + Activity ────────── */}
        <div className="dp-second-row">
          {/* Dark Equipment Widget */}
          {equip && (
            <div className="dp-equip-widget">
              <div className="dp-equip-header">
                <span className="dp-equip-badge">Thiết bị</span>
                <span className="dp-equip-dot" />
              </div>
              <div className="dp-equip-body">
                <h3 className="dp-equip-title">Hiệu suất thiết bị</h3>
                <p className="dp-equip-sub">Trạng thái vận hành hiện tại</p>
              </div>
              <div className="dp-equip-number">
                <span className="dp-equip-big">{equip.utilizationPercentage.toFixed(0)}</span>
                <span className="dp-equip-pct">%</span>
              </div>
              <p className="dp-equip-note">hiệu suất sử dụng</p>
              <div className="dp-equip-footer">
                <div className="dp-equip-row">
                  <span>Đang thuê</span>
                  <span className="dp-equip-row-val">{equip.rentedEquipment} / {equip.totalEquipment}</span>
                </div>
                <div className="dp-equip-bar-track">
                  <div className="dp-equip-bar-fill" style={{ width: `${equip.utilizationPercentage}%` }} />
                </div>
                <p className="dp-equip-avail">
                  Đang có <span style={{ color: '#22d3ee' }}>{equip.availableEquipment}</span> thiết bị sẵn sàng.
                </p>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="dp-activity-box">
            <div className="dp-section-header" style={{ marginBottom: 0, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="dp-section-title">Hoạt động gần đây</h2>
              <span className="dp-refresh-text" onClick={loadAll}>Làm mới</span>
            </div>
            <div className="dp-activity-list">
              {loading.activities ? (
                <div className="dp-empty">
                  <Skeleton w="60%" h={14} />
                  <Skeleton w="80%" h={14} />
                  <Skeleton w="50%" h={14} />
                </div>
              ) : activities.length === 0 ? (
                <div className="dp-empty">Chưa có hoạt động nào gần đây</div>
              ) : (
                activities.map((act, i) => {
                  const col = notifColor(act.type);
                  return (
                    <div key={act.notificationId || i} className="dp-activity-item">
                      <div className="dp-activity-dot" style={{ background: col }} />
                      <div className="dp-activity-content">
                        <p className="dp-activity-title">{act.title || act.type}</p>
                        <p className="dp-activity-desc">{act.message || act.content || ''}</p>
                        <span className="dp-activity-time">{timeAgo(act.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="dp-activity-footer">
              <Link to="/settings" className="dp-link">Xem tất cả thông báo</Link>
            </div>
          </div>
        </div>

        {/* ────────── WAREHOUSE TABLE ────────── */}
        <div className="dp-table-container">
          <div className="dp-section-header" style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h2 className="dp-section-title">Danh mục kho bãi</h2>
              <p className="dp-section-sub">Báo cáo hiệu suất từng kho hàng</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {lowPerformanceCount > 0 && (
                <span className="dp-warn-badge">
                  {lowPerformanceCount} kho hiệu suất thấp
                </span>
              )}
              <Link to="/my-warehouses" className="dp-link">Xem tất cả</Link>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {(loading.warehouses || loading.occupancy) ? (
              <div className="dp-empty" style={{ padding: 48 }}>
                <Skeleton w="60%" h={14} />
                <Skeleton w="80%" h={14} />
                <Skeleton w="40%" h={14} />
              </div>
            ) : warehouseRows.length === 0 ? (
              <div className="dp-empty" style={{ padding: 48 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Bạn chưa có kho nào</p>
                <Link to="/post-warehouse" className="dp-link" style={{ fontWeight: 800 }}>Đăng kho ngay</Link>
              </div>
            ) : (
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Tên kho</th>
                    <th>Tỷ lệ lấp đầy</th>
                    <th>Diện tích</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseRows.map((wh) => {
                    const st = whStatus(wh.status);
                    const isLow = wh.occupancyPct < 40;
                    return (
                      <tr key={wh.warehouseId} className={isLow ? 'dp-row-warn' : ''}>
                        <td>
                          <div className="dp-wh-name">{wh.name}</div>
                          <div className="dp-wh-addr">
                            {[wh.district, wh.province].filter(Boolean).join(', ') || wh.address}
                          </div>
                        </td>
                        <td>
                          <div className="dp-occ-cell">
                            <div className="dp-occ-bar-track">
                              <div
                                className="dp-occ-bar-fill"
                                style={{ width: `${wh.occupancyPct}%`, backgroundColor: barColor(wh.occupancyPct) }}
                              />
                            </div>
                            <span className={`dp-occ-val ${isLow ? 'dp-occ-low' : ''}`}>
                              {wh.occupancyPct}%
                              {isLow && <span className="dp-low-mark">thấp</span>}
                            </span>
                          </div>
                        </td>
                        <td className="dp-area-cell">
                          {wh.totalArea ? `${wh.totalArea.toLocaleString('vi-VN')} m²` : '—'}
                        </td>
                        <td>
                          <span className="dp-status-badge" style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
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

      {/* ────────── STYLES ────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: 1; }
          75%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dashboard-premium {
          width: 100%;
          flex: 1;
          min-width: 0;
          animation: fadeInUp 0.5s ease;
        }
        .dp-inner {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Header ── */
        .dp-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .dp-header-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: #fff;
          margin-bottom: 10px;
          box-shadow: 0 4px 14px rgba(8,145,178,0.25);
        }
        .dp-title {
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin: 0 0 6px;
        }
        .dp-title-name {
          background: linear-gradient(135deg, #0891b2, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .dp-subtitle {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
          margin: 0;
          max-width: 520px;
        }
        .dp-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          background: #fff;
          padding: 5px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .dp-btn {
          padding: 10px 22px;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }
        .dp-btn-ghost {
          background: #f8fafc;
          color: #64748b;
        }
        .dp-btn-ghost:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .dp-btn-primary {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: #fff;
          box-shadow: 0 4px 14px rgba(8,145,178,0.3);
        }
        .dp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(8,145,178,0.4);
        }
        .dp-btn-primary:active {
          transform: scale(0.97);
        }

        /* ── KPI Cards ── */
        .dp-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 20px;
        }
        .dp-kpi-card {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #f1f5f9;
          border-left: 4px solid var(--kpi-accent);
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .dp-kpi-card::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 100px; height: 100px;
          background: var(--kpi-accent);
          opacity: 0.03;
          border-radius: 0 0 0 100%;
          transition: all 0.4s;
        }
        .dp-kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
          border-color: #e2e8f0;
        }
        .dp-kpi-card:hover::after {
          opacity: 0.06;
          width: 140px; height: 140px;
        }
        .dp-kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .dp-kpi-label {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
        }
        .dp-kpi-tag {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 10px;
          border-radius: 100px;
        }
        .dp-kpi-value {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 6px;
        }
        .dp-kpi-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          margin: 0;
        }

        /* ── Charts ── */
        .dp-chart-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }
        .dp-chart-box {
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        }
        .dp-section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .dp-section-title {
          font-size: 17px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .dp-section-sub {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 4px 0 0;
        }
        .dp-trend-badge {
          font-size: 12px;
          font-weight: 900;
          padding: 5px 14px;
          border-radius: 100px;
        }

        /* Pie center */
        .dp-pie-center {
          position: absolute;
          top: 43%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }
        .dp-pie-center-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
        }
        .dp-pie-center-value {
          display: block;
          font-size: 26px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        /* ── Second Row ── */
        .dp-second-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
        }

        /* Equipment Widget */
        .dp-equip-widget {
          background: linear-gradient(160deg, #0f172a, #1e293b);
          border-radius: 32px;
          padding: 32px;
          color: #fff;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(15,23,42,0.15);
        }
        .dp-equip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .dp-equip-badge {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          padding: 6px 16px;
          background: rgba(255,255,255,0.08);
          border-radius: 100px;
          color: #94a3b8;
        }
        .dp-equip-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22d3ee;
          position: relative;
        }
        .dp-equip-dot::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #22d3ee;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .dp-equip-body { margin-bottom: 8px; }
        .dp-equip-title {
          font-size: 18px;
          font-weight: 900;
          margin: 0 0 4px;
        }
        .dp-equip-sub {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          margin: 0;
        }
        .dp-equip-number {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin: 20px 0 4px;
        }
        .dp-equip-big {
          font-size: 56px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
        }
        .dp-equip-pct {
          font-size: 22px;
          font-weight: 800;
          color: #22d3ee;
        }
        .dp-equip-note {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          font-style: italic;
          margin: 0 0 24px;
        }
        .dp-equip-footer {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dp-equip-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          color: #94a3b8;
        }
        .dp-equip-row-val { color: #fff; font-weight: 900; }
        .dp-equip-bar-track {
          width: 100%; height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 100px;
          overflow: hidden;
        }
        .dp-equip-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #22d3ee);
          border-radius: 100px;
          transition: width 1s ease;
        }
        .dp-equip-avail {
          font-size: 11px;
          color: #475569;
          font-weight: 700;
          margin: 0;
        }

        /* Activity Feed */
        .dp-activity-box {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          padding: 24px;
        }
        .dp-refresh-text {
          font-size: 12px;
          font-weight: 800;
          color: #0891b2;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .dp-refresh-text:hover { opacity: 0.7; }
        .dp-activity-list {
          flex: 1;
          overflow-y: auto;
        }
        .dp-activity-item {
          display: flex;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.2s;
          align-items: flex-start;
        }
        .dp-activity-item:hover {
          background: #fafbfd;
          margin: 0 -24px;
          padding-left: 24px;
          padding-right: 24px;
        }
        .dp-activity-item:last-child { border-bottom: none; }
        .dp-activity-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
        }
        .dp-activity-content {
          min-width: 0;
          flex: 1;
        }
        .dp-activity-title {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 3px;
          line-height: 1.4;
        }
        .dp-activity-desc {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 4px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dp-activity-time {
          font-size: 10px;
          font-weight: 800;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .dp-activity-footer {
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
        }

        /* ── Table ── */
        .dp-table-container {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          overflow: hidden;
        }
        .dp-warn-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 5px 14px;
          border-radius: 100px;
          background: #fef2f2;
          color: #ef4444;
        }
        .dp-link {
          font-size: 13px;
          font-weight: 800;
          color: #0891b2;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .dp-link:hover { opacity: 0.7; }
        .dp-table {
          width: 100%;
          text-align: left;
          border-collapse: collapse;
        }
        .dp-table thead tr {
          background: #fafbfd;
        }
        .dp-table th {
          padding: 14px 28px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #0891b2;
          border-bottom: 1px solid #f1f5f9;
        }
        .dp-table tbody tr {
          transition: background 0.2s;
        }
        .dp-table tbody tr:hover {
          background: #fafbfd;
        }
        .dp-table tbody tr.dp-row-warn {
          background: rgba(254,242,242,0.3);
        }
        .dp-table td {
          padding: 16px 28px;
          border-bottom: 1px solid #f8fafc;
          font-size: 14px;
        }
        .dp-wh-name {
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 2px;
        }
        .dp-wh-addr {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        .dp-occ-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dp-occ-bar-track {
          width: 100px;
          height: 6px;
          background: #f1f5f9;
          border-radius: 100px;
          overflow: hidden;
        }
        .dp-occ-bar-fill {
          height: 100%;
          border-radius: 100px;
          transition: width 0.8s ease;
        }
        .dp-occ-val {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dp-occ-low { color: #ef4444; }
        .dp-low-mark {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: #fee2e2;
          color: #ef4444;
          padding: 2px 8px;
          border-radius: 100px;
        }
        .dp-area-cell {
          font-weight: 700;
          color: #475569;
        }
        .dp-status-badge {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
        }

        .dp-empty {
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
          .dp-chart-row {
            grid-template-columns: 1fr;
          }
          .dp-second-row {
            grid-template-columns: 1fr;
          }
          .dp-kpi-grid {
            grid-template-columns: 1fr 1fr;
          }
          .dp-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .dp-header-actions {
            align-self: stretch;
          }
          .dp-btn { flex: 1; text-align: center; }
        }
        @media (max-width: 480px) {
          .dp-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
