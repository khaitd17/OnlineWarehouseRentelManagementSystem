import React from 'react';
import { Link } from 'react-router-dom';

const RenterDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = (user.fullName || user.FullName || 'Alex').split(' ')[0] || 'Alex';

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Bảng điều khiển</h2>
          <p className="text-slate-500 text-sm mt-1">Chào mừng trở lại, {userName}. Đây là những gì đang diễn ra hôm nay.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/create-inbound" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tạo yêu cầu nhập kho
          </Link>
          <Link to="/create-outbound" className="flex items-center gap-2 px-4 py-2.5 bg-primary/20 text-primary rounded-lg font-semibold text-sm hover:bg-primary/30 transition-colors">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Tạo yêu cầu xuất kho
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined">corporate_fare</span>
            </div>
            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+2 this month</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Kho đang hoạt động</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">12</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined">category</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Hàng hóa lưu kho</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">4,250</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined">login</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Yêu cầu nhập đang chờ</p>
          <h3 className="text-3xl font-bold mt-1 text-emerald-600">8</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <span className="material-symbols-outlined">logout</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Yêu cầu xuất đang chờ</p>
          <h3 className="text-3xl font-bold mt-1 text-red-600">5</h3>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Inventory Overview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Tổng quan tồn kho</h3>
            <Link to="/my-rental-requests" className="text-primary text-sm font-semibold hover:underline">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-3">Nhà kho</th>
                  <th className="px-5 py-3">Tên mặt hàng</th>
                  <th className="px-5 py-3">Số lượng</th>
                  <th className="px-5 py-3">Cập nhật lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-900">Central HUB - A1</td>
                  <td className="px-5 py-4">Ergonomic Chairs</td>
                  <td className="px-5 py-4">450 đơn vị</td>
                  <td className="px-5 py-4 text-slate-500">2 giờ trước</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-900">South Port Log.</td>
                  <td className="px-5 py-4">MacBook Air M2</td>
                  <td className="px-5 py-4">450 đơn vị</td>
                  <td className="px-5 py-4 text-slate-500">5 giờ trước</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-900">North Ridge Depot</td>
                  <td className="px-5 py-4">Curved Monitors</td>
                  <td className="px-5 py-4">450 đơn vị</td>
                  <td className="px-5 py-4 text-slate-500">Hôm qua</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-900">East Gate Storage</td>
                  <td className="px-5 py-4">Standing Desks</td>
                  <td className="px-5 py-4">450 đơn vị</td>
                  <td className="px-5 py-4 text-slate-500">2 ngày trước</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Inbound Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Yêu cầu nhập gần đây</h3>
            <Link to="/create-inbound" className="text-primary text-sm font-semibold hover:underline">Theo dõi tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nhà kho</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Ngày dự kiến đến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-primary">#IN-9824</td>
                  <td className="px-5 py-4">Central HUB - A1</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Đang vận chuyển</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">Oct 24, 2023</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-primary">#IN-9820</td>
                  <td className="px-5 py-4">North Ridge Depot</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Đang xử lý</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">Oct 25, 2023</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-primary">#IN-9815</td>
                  <td className="px-5 py-4">South Port Log.</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Đã đến</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">Oct 21, 2023</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Outbound Requests (Full Width) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-2">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Yêu cầu xuất gần đây</h3>
            <Link to="/transaction-history" className="text-primary text-sm font-semibold hover:underline">Tải báo cáo</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-3">ID yêu cầu</th>
                  <th className="px-5 py-3">Nhà kho</th>
                  <th className="px-5 py-3">Chi tiết mặt hàng</th>
                  <th className="px-5 py-3">Điểm đến</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-primary">#OUT-1102</td>
                  <td className="px-5 py-4">Central HUB - A1</td>
                  <td className="px-5 py-4">450 đơn vị</td>
                  <td className="px-5 py-4">Berlin Global Tech Center</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Đã gửi hàng</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-primary">#OUT-1105</td>
                  <td className="px-5 py-4">South Port Log.</td>
                  <td className="px-5 py-4">450 đơn vị</td>
                  <td className="px-5 py-4">London Creative Office</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đang lấy hàng</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-primary">#OUT-1099</td>
                  <td className="px-5 py-4">East Gate Storage</td>
                  <td className="px-5 py-4">450 đơn vị</td>
                  <td className="px-5 py-4">Paris Sales HQ</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Đang chờ</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-slate-400 text-sm border-t border-slate-200">
        © 2023 Hệ thống quản lý cho thuê kho trực tuyến (OWRMS). Bảo lưu mọi quyền.
      </footer>
    </div>
  );
};

export default RenterDashboard;
