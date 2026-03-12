import React, { useState } from 'react';

const MOCK_DATA = [
  { id: '#ORD-7721', warehouse: 'Central HUB (A)', item: 'Industrial Steel Pipes', quantity: '500 units', destination: 'Chicago, IL', shippingDate: 'Nov 15, 2023', status: 'Đang chờ', createdDate: 'Nov 10, 2023' },
  { id: '#ORD-7722', warehouse: 'West Coast Log.', item: 'High-Grade Copper Wire', quantity: '1,200 units', destination: 'Austin, TX', shippingDate: 'Nov 14, 2023', status: 'Đã giao', createdDate: 'Nov 09, 2023' },
  { id: '#ORD-7723', warehouse: 'Central HUB (A)', item: 'Aluminium Sheets (4×8)', quantity: '300 units', destination: 'Seattle, WA', shippingDate: 'Nov 18, 2023', status: 'Đã hủy', createdDate: 'Nov 11, 2023' },
  { id: '#ORD-7724', warehouse: 'Southern Depot (C)', item: 'Mounting Brackets', quantity: '2,500 units', destination: 'Miami, FL', shippingDate: 'Nov 16, 2023', status: 'Đang chờ', createdDate: 'Nov 12, 2023' },
  { id: '#ORD-7725', warehouse: 'West Coast Log.', item: 'Power Converters', quantity: '45 units', destination: 'Portland, OR', shippingDate: 'Nov 13, 2023', status: 'Đã giao', createdDate: 'Nov 08, 2023' },
];

const STATUS_FILTERS = ['Tất cả', 'Đang chờ', 'Đã giao', 'Đã hủy'];

const StatusBadge = ({ status }) => {
  const map = {
    'Đang chờ': 'bg-amber-100 text-amber-700 border border-amber-200',
    'Đã giao': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'Đã hủy': 'bg-slate-100 text-slate-600 border border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

const OutboundRequestsList = () => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const filtered = MOCK_DATA.filter(row => {
    const matchSearch = !search || [row.id, row.item, row.destination].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = activeFilter === 'Tất cả' || row.status === activeFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu xuất kho</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi các lô hàng xuất kho và đơn hàng vận chuyển.</p>
      </div>

      {/* ── Filter Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm placeholder-slate-400 outline-none transition-all"
              placeholder="Tìm kiếm theo ID, Mặt hàng hoặc Điểm đến..."
              type="text"
            />
          </div>

          {/* Status pills + more filter */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeFilter === f
                    ? 'bg-[#00b2d6]/10 text-[#00b2d6] border border-[#00b2d6]/30'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors text-sm font-medium">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Thêm bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Mã yêu cầu</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Nhà kho</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Tên mặt hàng</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Số lượng</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Điểm đến</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Ngày giao hàng</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-[#00b2d6]">{row.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.warehouse}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">{row.item}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.quantity}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.destination}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.shippingDate}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{row.createdDate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button title="Chỉnh sửa" className="p-1.5 text-slate-400 hover:text-[#00b2d6] hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg leading-none">edit</span>
                      </button>
                      <button title="Xóa" className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg leading-none">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Không tìm thấy yêu cầu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            Hiển thị <span className="font-bold text-slate-700">1</span> đến <span className="font-bold text-slate-700">5</span> trong số <span className="font-bold text-slate-700">84</span> yêu cầu
          </span>
          <div className="flex items-center gap-1.5">
            <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {[1, 2, 3].map(n => (
              <button
                key={n}
                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  n === 1 ? 'bg-[#00b2d6] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
            <span className="px-1 text-slate-400 text-sm">...</span>
            <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              12
            </button>
            <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutboundRequestsList;
