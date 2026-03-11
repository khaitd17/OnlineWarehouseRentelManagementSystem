import React, { useState } from 'react';

const MOCK_DATA = [
  { id: '#REQ-1024', warehouse: 'North Hub', item: 'Steel Pipes', quantity: '500 units', requester: 'John Doe', status: 'Đang chờ', date: 'Oct 24, 2023' },
  { id: '#REQ-1023', warehouse: 'East Wing', item: 'Copper Wire', quantity: '1,200 m', requester: 'Jane Smith', status: 'Đã duyệt', date: 'Oct 23, 2023' },
  { id: '#REQ-1022', warehouse: 'South Port', item: 'Pallets', quantity: '50 units', requester: 'Mike Ross', status: 'Từ chối', date: 'Oct 23, 2023' },
  { id: '#REQ-1021', warehouse: 'North Hub', item: 'Valves', quantity: '300 units', requester: 'Harvey Specter', status: 'Đang chờ', date: 'Oct 22, 2023' },
  { id: '#REQ-1020', warehouse: 'West Dock', item: 'Fittings', quantity: '150 units', requester: 'Louis Litt', status: 'Đã duyệt', date: 'Oct 22, 2023' },
];

const StatusBadge = ({ status }) => {
  const map = {
    'Đang chờ': 'bg-amber-100 text-amber-700 border border-amber-200',
    'Đã duyệt': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'Từ chối': 'bg-rose-100 text-rose-700 border border-rose-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

const InboundRequestsManagement = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');

  const filtered = MOCK_DATA.filter(row => {
    const matchSearch = !search || [row.id, row.item, row.requester].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'Tất cả trạng thái' || row.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu nhập kho</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi các lô hàng nhập kho tại tất cả các kho trung tâm.</p>
      </div>

      {/* ── Filter Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[260px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tìm kiếm yêu cầu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm placeholder-slate-400 outline-none transition-all"
                placeholder="ID, mặt hàng, hoặc người yêu cầu..."
                type="text"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-[180px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Lọc trạng thái
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm appearance-none outline-none cursor-pointer"
              >
                <option>Tất cả trạng thái</option>
                <option>Đang chờ</option>
                <option>Đã duyệt</option>
                <option>Từ chối</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Advanced */}
          <button className="flex items-center gap-2 px-4 py-2.5 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-slate-50">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Nâng cao
          </button>
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
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Mặt hàng</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Số lượng</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Người yêu cầu</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(row => {
                const isPending = row.status === 'Đang chờ';
                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.warehouse}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.item}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.requester}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{row.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          title="Xem chi tiết"
                          className="p-1.5 text-slate-400 hover:text-[#00b2d6] transition-colors rounded-lg hover:bg-slate-100"
                        >
                          <span className="material-symbols-outlined text-xl leading-none">visibility</span>
                        </button>
                        <button
                          title="Duyệt"
                          disabled={!isPending}
                          className={`p-1.5 rounded-lg transition-colors ${isPending ? 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50' : 'text-slate-200 cursor-not-allowed'}`}
                        >
                          <span className="material-symbols-outlined text-xl leading-none">check_circle</span>
                        </button>
                        <button
                          title="Từ chối"
                          disabled={!isPending}
                          className={`p-1.5 rounded-lg transition-colors ${isPending ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-200 cursor-not-allowed'}`}
                        >
                          <span className="material-symbols-outlined text-xl leading-none">cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Không tìm thấy yêu cầu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <span className="text-sm text-slate-500">
            Hiển thị <span className="font-bold text-slate-700">1-10</span> trong số <span className="font-bold text-slate-700">45</span> yêu cầu
          </span>
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-sm mr-1">chevron_left</span>
              Trước
            </button>
            <button className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
              Sau
              <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboundRequestsManagement;
