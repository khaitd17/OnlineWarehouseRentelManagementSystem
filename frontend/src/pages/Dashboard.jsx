import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyWarehouses, getOccupancyStats } from '../services/warehouseService';
import rentalService from '../services/rentalService';
import notificationService from '../services/notificationService';
import staffService from '../services/staffService';

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
  if (pct >= 60) return '#00b2d6';
  return '#f59e0b';
};

const WH_STATUS_MAP = {
  APPROVED:    { label: 'Hoạt động',  cls: 'bg-emerald-100 text-emerald-700' },
  ACTIVE:      { label: 'Hoạt động',  cls: 'bg-emerald-100 text-emerald-700' },
  PENDING:     { label: 'Chờ duyệt',  cls: 'bg-amber-100 text-amber-700' },
  MAINTENANCE: { label: 'Bảo trì',    cls: 'bg-orange-100 text-orange-700' },
  INACTIVE:    { label: 'Ngừng HĐ',   cls: 'bg-slate-100 text-slate-500' },
  REJECTED:    { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700' },
};
const whStatus = (s) => WH_STATUS_MAP[s?.toUpperCase()] || { label: s || 'Không rõ', cls: 'bg-slate-100 text-slate-500' };

const NOTIF_ICON = {
  CONTRACT_APPROVED:  { icon: 'check_circle', bg: 'bg-emerald-50 text-emerald-600' },
  CONTRACT_SENT:      { icon: 'send',          bg: 'bg-blue-50 text-blue-600' },
  CONTRACT_SIGNED:    { icon: 'edit_document', bg: 'bg-purple-50 text-purple-600' },
  CONTRACT_REJECTED:  { icon: 'cancel',        bg: 'bg-red-50 text-red-600' },
  RENTAL_REQUEST_RECEIVED: { icon: 'move_to_inbox', bg: 'bg-blue-50 text-blue-600' },
  INVENTORY_REQUEST:  { icon: 'inventory_2',   bg: 'bg-amber-50 text-amber-600' },
  DEFAULT:            { icon: 'notifications', bg: 'bg-slate-50 text-slate-500' },
};
const notifIcon = (type) => NOTIF_ICON[type] || NOTIF_ICON.DEFAULT;

/* ── Skeleton ── */
const SkeletonNum = () => (
  <div className="w-24 h-8 bg-slate-100 rounded animate-pulse mt-1" />
);

/* ══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  /* ── State ── */
  const [warehouses,   setWarehouses]   = useState([]);
  const [occupancy,    setOccupancy]    = useState(null);   // OccupancyStatsDto
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [staffCount,   setStaffCount]   = useState(null);
  const [activities,   setActivities]   = useState([]);
  const [loading, setLoading] = useState({
    warehouses: true, occupancy: true, revenue: true, staff: true, activities: true,
  });

  /* ── Loaders ── */
  const loadAll = useCallback(async () => {
    const userId = user.userId;

    // 1. Owner warehouses list
    getMyWarehouses()
      .then(data => {
        setWarehouses(Array.isArray(data) ? data : []);
        setLoading(l => ({ ...l, warehouses: false }));
      })
      .catch(() => setLoading(l => ({ ...l, warehouses: false })));

    // 2. Occupancy stats (totalWarehouses, averageOccupancyRate, per-warehouse OccupancyRate)
    getOccupancyStats()
      .then(data => {
        setOccupancy(data);
        setLoading(l => ({ ...l, occupancy: false }));
      })
      .catch(() => setLoading(l => ({ ...l, occupancy: false })));

    // 3. Revenue from contracts (sum of monthlyRent for ACTIVE contracts)
    rentalService.getMyContracts()
      .then(data => {
        const active = (data || []).filter(c => c.status === 'ACTIVE');
        const rev = active.reduce((s, c) => s + (c.monthlyRent || c.totalAmount || 0), 0);
        setTotalRevenue(rev);
        setLoading(l => ({ ...l, revenue: false }));
      })
      .catch(() => setLoading(l => ({ ...l, revenue: false })));

    // 4. Staff count — list all staff from first managed warehouse
    staffService.getMyManagedWarehouses()
      .then(async (whs) => {
        if (!whs || whs.length === 0) {
          setStaffCount(0);
          setLoading(l => ({ ...l, staff: false }));
          return;
        }
        // Fetch staff for all warehouses in parallel, sum up
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

    // 5. Recent activity from notifications API
    notificationService.getNotifications(1, 5)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || data?.items || []);
        setActivities(items.slice(0, 5));
        setLoading(l => ({ ...l, activities: false }));
      })
      .catch(() => {
        setActivities([]);
        setLoading(l => ({ ...l, activities: false }));
      });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Computed KPIs ── */
  const totalWarehouses = occupancy?.totalWarehouses ?? warehouses.length;
  const avgOccupancy    = occupancy?.averageOccupancyRate ?? 0;

  // Merge occupancy data into warehouse list
  const warehouseRows = warehouses.slice(0, 6).map(wh => {
    const occ = occupancy?.warehouses?.find(o => o.warehouseId === wh.warehouseId);
    return {
      ...wh,
      occupancyPct: occ ? Math.round(occ.occupancyRate) : 0,
    };
  });

  /* ── Render ── */
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Tổng quan bảng điều khiển
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Các chỉ số hiệu suất thời gian thực trên toàn bộ danh mục kho bãi của bạn.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm"
            style={{ backgroundColor: '#00b2d6' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#009bbf'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#00b2d6'}
          >
            <span className="material-symbols-outlined text-lg leading-none">download</span>
            Xuất báo cáo
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng doanh thu */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Tổng doanh thu</span>
            </div>
            <div className="flex items-baseline gap-2">
              {loading.revenue ? <SkeletonNum /> : (
                <span className="text-3xl font-black text-slate-900">{fmtVND(totalRevenue ?? 0)}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Từ hợp đồng đang hiệu lực</p>
          </div>

          {/* Tỷ lệ lấp đầy trung bình */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Tỷ lệ lấp đầy TB</span>
            </div>
            <div className="flex items-baseline gap-2">
              {loading.occupancy ? <SkeletonNum /> : (
                <span className="text-3xl font-black text-slate-900">{avgOccupancy.toFixed(1)}%</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Trung bình tất cả kho</p>
          </div>

          {/* Tổng số kho */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Tổng số kho</span>
            </div>
            <div className="flex items-baseline gap-2">
              {loading.warehouses ? <SkeletonNum /> : (
                <span className="text-3xl font-black text-slate-900">{totalWarehouses}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {warehouses.filter(w => (w.status || '').toUpperCase() === 'APPROVED').length} đang hoạt động
            </p>
          </div>

          {/* Tổng nhân viên */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Tổng nhân viên</span>
            </div>
            <div className="flex items-baseline gap-2">
              {loading.staff ? <SkeletonNum /> : (
                <span className="text-3xl font-black text-slate-900">{staffCount ?? 0}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Nhân viên đang làm việc</p>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Warehouse Portfolio Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Danh mục kho bãi</h2>
              <Link to="/my-warehouses" className="text-sm font-semibold hover:underline" style={{ color: '#00b2d6' }}>
                Xem tất cả
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading.warehouses || loading.occupancy ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="flex justify-center gap-1.5 mb-2">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                    ))}
                  </div>
                  <span className="text-sm">Đang tải dữ liệu kho...</span>
                </div>
              ) : warehouseRows.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <div className="text-3xl mb-2">🏭</div>
                  <p className="text-sm font-medium">Bạn chưa có kho nào</p>
                  <Link to="/post-warehouse" className="text-sm font-bold mt-1 inline-block hover:underline" style={{ color: '#00b2d6' }}>
                    + Đăng kho ngay
                  </Link>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Tên kho</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Tỷ lệ lấp đầy</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Diện tích</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {warehouseRows.map((wh) => {
                      const st = whStatus(wh.status);
                      return (
                        <tr key={wh.warehouseId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{wh.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {[wh.district, wh.province].filter(Boolean).join(', ') || wh.address}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${wh.occupancyPct}%`, backgroundColor: barColor(wh.occupancyPct) }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-700">{wh.occupancyPct}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium">
                            {wh.totalArea ? `${wh.totalArea.toLocaleString('vi-VN')} m²` : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>
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

          {/* Right: Recent Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Hoạt động gần đây</h2>
              <span
                className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={loadAll}
                title="Làm mới"
              >
                refresh
              </span>
            </div>

            <div className="flex-1 divide-y divide-slate-100">
              {loading.activities ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="flex justify-center gap-1.5 mb-2">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                    ))}
                  </div>
                  <span className="text-sm">Đang tải hoạt động...</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm">Chưa có hoạt động nào gần đây</p>
                </div>
              ) : (
                activities.map((act, i) => {
                  const ic = notifIcon(act.type);
                  return (
                    <div key={act.notificationId || i} className="flex gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${ic.bg}`}>
                        <span className="material-symbols-outlined text-[18px] leading-none">{ic.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-snug">
                          {act.title || act.type}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {act.message || act.content || ''}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 block tracking-wider uppercase">
                          {timeAgo(act.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100">
              <Link
                to="/settings"
                className="w-full text-sm font-semibold text-center block transition-colors hover:opacity-80"
                style={{ color: '#00b2d6' }}
              >
                XEM TẤT CẢ THÔNG BÁO
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
