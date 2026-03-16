import React from 'react';
import { Link } from 'react-router-dom';

const WAREHOUSES = [
  { name: 'Kho Quận 7 - TP.HCM', city: 'TP. Hồ Chí Minh', pct: 92, rev: '$45,200', status: 'Hoạt động', statusColor: 'bg-emerald-100 text-emerald-700' },
  { name: 'Kho Sóng Thần - Bình Dương', city: 'Bình Dương', pct: 78, rev: '$38,150', status: 'Hoạt động', statusColor: 'bg-emerald-100 text-emerald-700' },
  { name: 'Kho Cảng Hải Phòng', city: 'Hải Phòng', pct: 45, rev: '$22,400', status: 'Bảo trì', statusColor: 'bg-amber-100 text-amber-700' },
  { name: 'Kho Hòa Lạc - Hà Nội', city: 'Hà Nội', pct: 88, rev: '$41,800', status: 'Hoạt động', statusColor: 'bg-emerald-100 text-emerald-700' },
];

const ACTIVITIES = [
  {
    icon: 'person_add',
    iconBg: 'bg-blue-50 text-blue-600',
    title: 'Nhân viên mới đã đăng ký',
    desc: 'Nguyễn Văn A vừa gia nhập Kho Quận 7.',
    time: '2 GIỜ TRƯỚC',
  },
  {
    icon: 'check_circle',
    iconBg: 'bg-emerald-50 text-emerald-600',
    title: 'Kiểm toán hàng tháng hoàn tất',
    desc: 'Báo cáo kiểm kê kho Sóng Thần đã được phê duyệt.',
    time: 'HÔM QUA',
  },
  {
    icon: 'warning',
    iconBg: 'bg-orange-50 text-orange-600',
    title: 'Cảnh báo công suất đã kích hoạt',
    desc: 'Kho Hòa Lạc đã đạt 95% công suất lưu trữ.',
    time: '2 NGÀY TRƯỚC',
  },
  {
    icon: 'local_shipping',
    iconBg: 'bg-purple-50 text-purple-600',
    title: 'Lô hàng lớn đã xuất kho',
    desc: '500 đơn hàng đã được vận chuyển từ Kho Quận 7.',
    time: '3 NGÀY TRƯỚC',
  },
];

const KPI_CARDS = [
  {
    label: 'Tổng doanh thu',
    value: '$428,500',
    badge: '+12.5%',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    icon: 'payments',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Tỷ lệ lấp đầy trung bình',
    value: '84.2%',
    badge: '+3.2%',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    icon: 'donut_large',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  {
    label: 'Tổng số kho',
    value: '12',
    badge: '0%',
    badgeColor: 'bg-slate-100 text-slate-500',
    icon: 'warehouse',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  {
    label: 'Tổng nhân viên',
    value: '48',
    badge: '0%',
    badgeColor: 'bg-slate-100 text-slate-500',
    icon: 'group',
    iconBg: 'bg-teal-100 text-teal-600',
  },
];

// Colour the progress bar based on occupancy %
const barColor = (pct) => {
  if (pct >= 90) return '#f97316'; // orange - near capacity
  if (pct >= 60) return '#00b2d6'; // teal - healthy
  return '#f59e0b';                // amber - low
};

const Dashboard = () => {
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
          {KPI_CARDS.map((card) => (
            <div key={card.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <span className="material-symbols-outlined text-xl leading-none">{card.icon}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{card.value}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Warehouse Portfolio Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Danh mục kho bãi</h2>
              <Link
                to="/my-warehouses"
                className="text-sm font-semibold hover:underline"
                style={{ color: '#00b2d6' }}
              >
                Xem tất cả
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Tên kho</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Tỷ lệ lấp đầy</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Doanh thu tháng</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00b2d6' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {WAREHOUSES.map((wh) => (
                    <tr key={wh.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{wh.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{wh.city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${wh.pct}%`, backgroundColor: barColor(wh.pct) }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{wh.pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{wh.rev}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${wh.statusColor}`}>
                          {wh.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Recent Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Hoạt động gần đây</h2>
              <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">refresh</span>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              {ACTIVITIES.map((act) => (
                <div key={act.title} className="flex gap-4 px-6 py-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${act.iconBg}`}>
                    <span className="material-symbols-outlined text-[18px] leading-none">{act.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{act.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{act.desc}</p>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 block tracking-wider uppercase">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-slate-100">
              <button
                className="w-full text-sm font-semibold text-center transition-colors"
                style={{ color: '#00b2d6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#009bbf'}
                onMouseLeave={e => e.currentTarget.style.color = '#00b2d6'}
              >
                XEM NHẬT KÝ HỆ THỐNG
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
