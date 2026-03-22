import React from 'react';
import { Link } from 'react-router-dom';

const StaffDashboard = () => {
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="space-y-8">
        {/* Welcome & Stats */}
        <section>
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Tổng quan Kho hàng</h3>
              <p className="text-slate-500 text-sm mt-1">Trạng thái thời gian thực của các hoạt động logistics.</p>
            </div>
            <Link
              to="/my-schedule"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #00b2d6 0%, #0284c7 100%)', boxShadow: '0 4px 12px rgba(0,178,214,0.35)', textDecoration: 'none' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>calendar_month</span>
              Lịch của tôi
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Nhập kho Hôm nay</span>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <span className="material-symbols-outlined text-xl">login</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">24</span>
                <span className="text-emerald-500 text-xs font-semibold">+5%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 italic">Dự kiến đến hôm nay</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Xuất kho Hôm nay</span>
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <span className="material-symbols-outlined text-xl">logout</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">18</span>
                <span className="text-rose-500 text-xs font-semibold">-2%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 italic">Lịch giao hàng</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Tổng Yêu cầu Chờ</span>
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <span className="material-symbols-outlined text-xl">hourglass_empty</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">42</span>
                <span className="text-emerald-500 text-xs font-semibold">+12%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 italic">Đang chờ xác nhận</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Đã Hoàn thành Hôm nay</span>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <span className="material-symbols-outlined text-xl">task_alt</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">156</span>
                <span className="text-emerald-500 text-xs font-semibold">+8%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 italic">Lượt luân chuyển đã xử lý</p>
            </div>
          </div>
        </section>

        {/* Pending Inbound Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">input</span>
              Yêu cầu Nhập kho Đang chờ
            </h4>
            <Link to="/inbound-requests" className="text-sm text-primary font-semibold hover:underline">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-3">MÃ YÊU CẦU</th>
                  <th className="px-6 py-3">NHÀ KHO</th>
                  <th className="px-6 py-3">TÊN MẶT HÀNG</th>
                  <th className="px-6 py-3">SỐ LƯỢNG</th>
                  <th className="px-6 py-3">NGÀY ĐẾN</th>
                  <th className="px-6 py-3">TRẠNG THÁI</th>
                  <th className="px-6 py-3">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-primary cursor-pointer hover:underline">#IN-8842</td>
                  <td className="px-6 py-4">Global Central A1</td>
                  <td className="px-6 py-4">Industrial Bearings (T2)</td>
                  <td className="px-6 py-4">450 Units</td>
                  <td className="px-6 py-4">Oct 24, 2023</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Đang vận chuyển</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to="/confirm-movement" className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all inline-block">Xác nhận Nhập</Link>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-primary cursor-pointer hover:underline">#IN-8845</td>
                  <td className="px-6 py-4">West Bay Hub B4</td>
                  <td className="px-6 py-4">LED Panels 4K</td>
                  <td className="px-6 py-4">120 Units</td>
                  <td className="px-6 py-4">Oct 25, 2023</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Đã lên lịch</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to="/confirm-movement" className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all inline-block">Xác nhận Nhập</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Outbound Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">output</span>
              Yêu cầu Xuất kho Đang chờ
            </h4>
            <Link to="/outbound-requests" className="text-sm text-primary font-semibold hover:underline">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-3">MÃ YÊU CẦU</th>
                  <th className="px-6 py-3">NHÀ KHO</th>
                  <th className="px-6 py-3">TÊN MẶT HÀNG</th>
                  <th className="px-6 py-3">SỐ LƯỢNG</th>
                  <th className="px-6 py-3">ĐIỂM ĐẾN</th>
                  <th className="px-6 py-3">TRẠNG THÁI</th>
                  <th className="px-6 py-3">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-primary cursor-pointer hover:underline">#OUT-2104</td>
                  <td className="px-6 py-4">Global Central A1</td>
                  <td className="px-6 py-4">Steel Coils (Grade A)</td>
                  <td className="px-6 py-4">15 Rolls</td>
                  <td className="px-6 py-4">Chicago Factory 9</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Đang xử lý</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to="/confirm-movement" className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all inline-block">Xác nhận Xuất</Link>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-primary cursor-pointer hover:underline">#OUT-2109</td>
                  <td className="px-6 py-4">North Port Section C</td>
                  <td className="px-6 py-4">Solar Battery Pack</td>
                  <td className="px-6 py-4">85 Units</td>
                  <td className="px-6 py-4">Green Energy Corp</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Sẵn sàng</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to="/confirm-movement" className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all inline-block">Xác nhận Xuất</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">history</span>
              Giao dịch Kho Gần đây
            </h4>
            <Link to="/transaction-history" className="text-sm text-primary font-semibold hover:underline">Tải báo cáo</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-3">MÃ GIAO DỊCH</th>
                  <th className="px-6 py-3">LOẠI</th>
                  <th className="px-6 py-3">MẶT HÀNG</th>
                  <th className="px-6 py-3">SỐ LƯỢNG</th>
                  <th className="px-6 py-3">NGÀY</th>
                  <th className="px-6 py-3">THỰC HIỆN BỞI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#TX-90223</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500"></span>
                      <span>NHẬP KHO</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">Textile Rolls (Blue)</td>
                  <td className="px-6 py-4 font-medium">100</td>
                  <td className="px-6 py-4 text-xs">Hôm nay, 10:45 AM</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">AJ</div>
                      <span>Alex J.</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#TX-90222</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-rose-500"></span>
                      <span>XUẤT KHO</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">Automotive Pistons</td>
                  <td className="px-6 py-4 font-medium">50</td>
                  <td className="px-6 py-4 text-xs">Hôm nay, 09:12 AM</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">SM</div>
                      <span>Sarah M.</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#TX-90215</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-500"></span>
                      <span>ĐIỀU CHỈNH</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">Packaging Material</td>
                  <td className="px-6 py-4 font-medium">-12</td>
                  <td className="px-6 py-4 text-xs">Hôm qua, 04:30 PM</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">AJ</div>
                      <span>Alex J.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
