import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import authService from '../../services/authService';

/* ─── Colour palette ─────────────────────────────── */
const C = {
  inbound:   '#10b981',
  outbound:  '#f59e0b',
  pending:   '#6366f1',
  confirmed: '#0ea5e9',
  assigned:  '#f97316',
  completed: '#22c55e',
  rejected:  '#ef4444',
  grid:      '#f1f5f9',
  text:      '#1e293b',
  sub:       '#64748b',
};

const STATUS_META = {
  PENDING:   { label: 'Chờ duyệt',  color: C.pending },
  CONFIRMED: { label: 'Đã duyệt',   color: C.confirmed },
  ASSIGNED:  { label: 'Đã giao',    color: C.assigned },
  COMPLETED: { label: 'Hoàn thành', color: C.completed },
  REJECTED:  { label: 'Từ chối',    color: C.rejected },
};

/* ─── SVG Bar Chart ───────────────────────────────── */
const BarChart = ({ data }) => {
  const W = 480, H = 200, PL = 40, PR = 12, PT = 16, PB = 36;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const maxVal = Math.max(...data.flatMap(d => [d.inbound, d.outbound]), 1);
  const yTicks = 4;
  const groupW = chartW / data.length;
  const barW   = Math.min(22, groupW * 0.35);
  const gap    = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {/* Y-axis grid + labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = Math.round((maxVal / yTicks) * i);
        const y   = PT + chartH - (chartH * i) / yTicks;
        return (
          <g key={i}>
            <line x1={PL} x2={PL + chartW} y1={y} y2={y}
              stroke={C.grid} strokeWidth={i === 0 ? 1.5 : 1} />
            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize={9} fill={C.sub}>{val}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx   = PL + i * groupW + groupW / 2;
        const ih   = (d.inbound  / maxVal) * chartH || 2;
        const oh   = (d.outbound / maxVal) * chartH || 2;
        const ix   = cx - barW - gap / 2;
        const ox   = cx + gap / 2;

        return (
          <g key={i}>
            {/* inbound */}
            <rect x={ix} y={PT + chartH - ih} width={barW} height={ih}
              rx={3} fill={C.inbound} opacity={0.85} />
            {/* outbound */}
            <rect x={ox} y={PT + chartH - oh} width={barW} height={oh}
              rx={3} fill={C.outbound} opacity={0.85} />
            {/* x-label */}
            <text x={cx} y={PT + chartH + 14} textAnchor="middle" fontSize={9} fill={C.sub}>
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${PL}, ${H - 8})`}>
        <rect x={0}  y={-5} width={9} height={9} rx={2} fill={C.inbound} />
        <text x={13} y={4}  fontSize={9} fill={C.sub}>Nhập kho</text>
        <rect x={70} y={-5} width={9} height={9} rx={2} fill={C.outbound} />
        <text x={83} y={4}  fontSize={9} fill={C.sub}>Xuất kho</text>
      </g>
    </svg>
  );
};

/* ─── SVG Donut Chart ─────────────────────────────── */
const DonutChart = ({ segments }) => {
  const total = segments.reduce((s, g) => s + g.count, 0) || 1;
  const R = 54, r = 32, CX = 70, CY = 70;
  let angle = -Math.PI / 2;

  const slices = segments.map(seg => {
    const pct = seg.count / total;
    const sweep = pct * 2 * Math.PI;
    const x1 = CX + R * Math.cos(angle);
    const y1 = CY + R * Math.sin(angle);
    angle += sweep;
    const x2 = CX + R * Math.cos(angle);
    const y2 = CY + R * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const xi1 = CX + r * Math.cos(angle - sweep);
    const yi1 = CY + r * Math.sin(angle - sweep);
    const xi2 = CX + r * Math.cos(angle);
    const yi2 = CY + r * Math.sin(angle);
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
    return { ...seg, d, pct };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 140 140" style={{ width: 130, flexShrink: 0 }}>
        {slices.length === 0 ? (
          <circle cx={CX} cy={CY} r={R} fill={C.grid} />
        ) : (
          slices.map((s, i) => (
            <path key={i} d={s.d} fill={STATUS_META[s.status]?.color || '#94a3b8'} opacity={0.9} />
          ))
        )}
        <circle cx={CX} cy={CY} r={r - 2} fill="white" />
        <text x={CX} y={CY - 6}  textAnchor="middle" fontSize={14} fontWeight={700} fill={C.text}>
          {total}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fill={C.sub}>yêu cầu</text>
      </svg>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_META[s.status]?.color || '#94a3b8', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.sub, flex: 1 }}>{STATUS_META[s.status]?.label || s.status}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
        {slices.length === 0 && <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>Không có dữ liệu</p>}
      </div>
    </div>
  );
};

/* ─── SVG Line Chart ──────────────────────────────── */
const LineChart = ({ data }) => {
  const W = 480, H = 160, PL = 40, PR = 12, PT = 12, PB = 30;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxVal = Math.max(...data.flatMap(d => [d.inbound, d.outbound]), 1);

  const pts = (key) => data.map((d, i) => {
    const x = PL + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = PT + chartH - (d[key] / maxVal) * chartH;
    return `${x},${y}`;
  }).join(' ');

  const smoothCubic = (key) => {
    const points = data.map((d, i) => ({
      x: PL + (i / Math.max(data.length - 1, 1)) * chartW,
      y: PT + chartH - (d[key] / maxVal) * chartH,
    }));
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i-1].x + (points[i].x - points[i-1].x) / 3;
      const cp2x = points[i].x   - (points[i].x - points[i-1].x) / 3;
      d += ` C ${cp1x} ${points[i-1].y}, ${cp2x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  const yTicks = 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = PT + chartH - (chartH * i) / yTicks;
        return (
          <g key={i}>
            <line x1={PL} x2={PL + chartW} y1={y} y2={y} stroke={C.grid} strokeWidth={1} />
            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize={9} fill={C.sub}>
              {Math.round((maxVal / yTicks) * i)}
            </text>
          </g>
        );
      })}

      {/* Inbound line */}
      <path d={smoothCubic('inbound')} fill="none" stroke={C.inbound} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Outbound line */}
      <path d={smoothCubic('outbound')} fill="none" stroke={C.outbound} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />

      {/* Dots */}
      {data.map((d, i) => {
        const x = PL + (i / Math.max(data.length - 1, 1)) * chartW;
        return (
          <g key={i}>
            <circle cx={x} cy={PT + chartH - (d.inbound / maxVal) * chartH} r={3.5} fill={C.inbound} />
            <circle cx={x} cy={PT + chartH - (d.outbound / maxVal) * chartH} r={3.5} fill={C.outbound} />
            <text x={x} y={H - 4} textAnchor="middle" fontSize={9} fill={C.sub}>{d.label}</text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${PL}, ${H + 2})`}>
        <line x1={0} x2={16} y1={0} y2={0} stroke={C.inbound} strokeWidth={2.5} />
        <text x={20} y={4} fontSize={9} fill={C.sub}>Nhập kho</text>
        <line x1={72} x2={88} y1={0} y2={0} stroke={C.outbound} strokeWidth={2.5} strokeDasharray="4 2" />
        <text x={92} y={4} fontSize={9} fill={C.sub}>Xuất kho</text>
      </g>
    </svg>
  );
};

/* ─── KPI Card ────────────────────────────────────── */
const KpiCard = ({ icon, label, value, sub, color, bg }) => (
  <div style={{
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    flex: 1,
    minWidth: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
      </div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.sub }}>{sub}</div>
  </div>
);

/* ─── Chart Box ───────────────────────────────────── */
const ChartBox = ({ title, subtitle, children, action }) => (
  <div style={{
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

/* ─── Status Badge ────────────────────────────────── */
const Badge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, color: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: m.color + '18',
      color: m.color,
      border: `1px solid ${m.color}33`,
    }}>{m.label}</span>
  );
};

/* ─── Main Component ──────────────────────────────── */
const StaffDashboard = () => {
  const [loading, setLoading]       = useState(true);
  const [kpi, setKpi]               = useState({ inboundPending: 0, outboundPending: 0, inProgress: 0, completedToday: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [statusSeg, setStatusSeg]   = useState([]);
  const [recent, setRecent]         = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);

  const fetchAll = useCallback(async (wid) => {
    try {
      // Fetch both INBOUND and OUTBOUND all pages (max 500)
      const [inRes, outRes] = await Promise.all([
        axiosClient.get('/InventoryRequests', { params: { type: 'INBOUND',  warehouseId: wid, pageSize: 500 } }),
        axiosClient.get('/InventoryRequests', { params: { type: 'OUTBOUND', warehouseId: wid, pageSize: 500 } }),
      ]);

      const inItems  = inRes.data?.items   || inRes.data  || [];
      const outItems = outRes.data?.items  || outRes.data || [];
      const all = [
        ...inItems.map(r  => ({ ...r, type: 'INBOUND' })),
        ...outItems.map(r => ({ ...r, type: 'OUTBOUND' })),
      ];

      // ── KPI ──
      const today = new Date().toDateString();
      setKpi({
        inboundPending:  inItems.filter(r  => r.status === 'PENDING').length,
        outboundPending: outItems.filter(r => r.status === 'PENDING').length,
        inProgress:      all.filter(r => ['CONFIRMED', 'ASSIGNED'].includes(r.status)).length,
        completedToday:  all.filter(r => r.status === 'COMPLETED' &&
                          new Date(r.confirmedAt || r.updatedAt || r.createdAt).toDateString() === today).length,
      });

      // ── Status Donut ──
      const statusMap = {};
      all.forEach(r => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
      setStatusSeg(
        Object.entries(statusMap)
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count)
      );

      // ── Monthly last 6 months ──
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - (5 - i));
        const m = d.getMonth(), y = d.getFullYear();
        const inMonth  = all.filter(r => r.type === 'INBOUND'  && new Date(r.createdAt).getMonth() === m && new Date(r.createdAt).getFullYear() === y);
        const outMonth = all.filter(r => r.type === 'OUTBOUND' && new Date(r.createdAt).getMonth() === m && new Date(r.createdAt).getFullYear() === y);
        return { label: `T${m + 1}`, inbound: inMonth.length, outbound: outMonth.length };
      });
      setMonthlyData(months);

      // ── Recent ──
      const sorted = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
      setRecent(sorted);

    } catch (err) {
      console.error('[StaffDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctx = authService.getWarehouseContext();
    const wid = ctx?.warehouses?.[0]?.warehouseId;
    setWarehouseId(wid);
    fetchAll(wid);
  }, [fetchAll]);

  const fmtDate = (s) => {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: C.sub, gap: 12, fontSize: 14 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>autorenew</span>
      Đang tải dữ liệu...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: C.text, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Tổng quan Kho hàng</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.sub }}>Dữ liệu thời gian thực • Tự động cập nhật</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/staff-inventory-requests" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>inventory_2</span>
            Yêu cầu nhập/xuất
          </Link>
          <Link to="/my-schedule" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#fff',
            color: C.sub, fontWeight: 600, fontSize: 13, textDecoration: 'none',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>calendar_month</span>
            Lịch của tôi
          </Link>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard icon="login"          label="Nhập kho chờ duyệt"  value={kpi.inboundPending}  sub="Yêu cầu PENDING" color={C.inbound}   bg="#d1fae518" />
        <KpiCard icon="logout"         label="Xuất kho chờ duyệt"  value={kpi.outboundPending} sub="Yêu cầu PENDING" color={C.outbound}  bg="#fef3c718" />
        <KpiCard icon="pending_actions" label="Đang xử lý"          value={kpi.inProgress}      sub="CONFIRMED + ASSIGNED" color={C.confirmed} bg="#dbeafe18" />
        <KpiCard icon="task_alt"        label="Hoàn thành hôm nay"  value={kpi.completedToday}  sub="Trong ngày" color={C.completed} bg="#dcfce718" />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Bar chart */}
        <ChartBox
          title="Yêu cầu nhập và xuất kho"
          subtitle="Số lượng đơn theo tháng (6 tháng gần nhất)"
          action={
            <span style={{ fontSize: 11, color: C.sub, background: C.grid, padding: '3px 10px', borderRadius: 20 }}>
              {new Date().getFullYear()}
            </span>
          }
        >
          <div style={{ height: 200 }}>
            {monthlyData.every(m => m.inbound === 0 && m.outbound === 0) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.sub, fontSize: 13 }}>
                Chưa có dữ liệu đủ 6 tháng
              </div>
            ) : (
              <BarChart data={monthlyData} />
            )}
          </div>
        </ChartBox>

        {/* Donut chart */}
        <ChartBox
          title="Phân bổ trạng thái"
          subtitle="Tỉ lệ các trạng thái yêu cầu hiện tại"
        >
          <DonutChart segments={statusSeg} />
        </ChartBox>
      </div>

      {/* ── Line chart + Recent table ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Line chart */}
        <ChartBox
          title="Xu hướng nhập & xuất kho"
          subtitle="Số lượng đơn hàng theo xu hướng tháng"
        >
          <div style={{ height: 160 }}>
            <LineChart data={monthlyData} />
          </div>
        </ChartBox>

        {/* Recent requests */}
        <ChartBox
          title="Yêu cầu gần đây"
          subtitle="6 yêu cầu mới nhất trong kho"
          action={
            <Link to="/staff-inventory-requests" style={{ fontSize: 12, color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}>
              Xem tất cả →
            </Link>
          }
        >
          {recent.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: C.sub, fontSize: 13, gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>inbox</span>
              Chưa có yêu cầu nào
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map((r) => (
                <div key={r.invReqId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 10,
                  background: '#f8fafc', border: '1px solid #f1f5f9',
                }}>
                  {/* Type icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: r.type === 'INBOUND' ? '#d1fae5' : '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: r.type === 'INBOUND' ? C.inbound : C.outbound }}>
                      {r.type === 'INBOUND' ? 'login' : 'logout'}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{r.invReqId} · {r.renterEmail || r.renterName || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: C.sub }}>{fmtDate(r.createdAt)} · {r.totalItems} mặt hàng</div>
                  </div>

                  <Badge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </ChartBox>
      </div>

    </div>
  );
};

export default StaffDashboard;
