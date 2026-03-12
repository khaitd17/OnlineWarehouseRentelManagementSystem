import React, { useState } from 'react';

const MOCK_DATA = [
  {
    id: '#REQ-82910',
    type: 'Nhập kho',
    isInbound: true,
    warehouse: 'Central WH - Z10',
    item: 'Pneumatic Actuators',
    sku: 'PA-4420-B',
    qty: 250,
    status: 'Đang chờ',
    requester: 'John Doe',
  },
  {
    id: '#REQ-82915',
    type: 'Xuất kho',
    isInbound: false,
    warehouse: 'East-Side Hub',
    item: 'High-Cap Li-Ion Cells',
    sku: 'LI-900-X',
    qty: 1200,
    status: 'Đang xử lý',
    requester: 'Sarah Jenkins',
  },
  {
    id: '#REQ-82921',
    type: 'Xuất kho',
    isInbound: false,
    warehouse: 'Main Logistics Park',
    item: 'Control Unit v4',
    sku: 'CU-V4-SYS',
    qty: 45,
    status: 'Sẵn sàng',
    requester: 'Mike Ross',
  },
  {
    id: '#REQ-82924',
    type: 'Nhập kho',
    isInbound: true,
    warehouse: 'Cold Storage Alpha',
    item: 'Silicone Gaskets',
    sku: 'SG-12-RED',
    qty: 5000,
    status: 'Đang xử lý',
    requester: 'Elena Gilbert',
  },
  {
    id: '#REQ-82930',
    type: 'Nhập kho',
    isInbound: true,
    warehouse: 'Distribution Cntr 2',
    item: 'Steel Frame Supports',
    sku: 'ST-FR-88',
    qty: 80,
    status: 'Sẵn sàng',
    requester: 'David King',
  },
];

const STATUS_MAP = {
  'Đang chờ': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Đang xử lý': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Sẵn sàng': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Đã xác nhận': 'bg-slate-100 text-slate-600 border border-slate-200',
};

const MOVEMENT_FILTERS = ['Tất cả', 'Nhập kho', 'Xuất kho'];

const ConfirmMovement = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tất cả');

  const filtered = MOCK_DATA.filter(row => {
    const matchSearch = !search || [row.id, row.item, row.sku].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    );
    const matchType = typeFilter === 'Tất cả' || row.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Xác nhận di chuyển hàng</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý và xác nhận các lô hàng nhập/xuất kho trên tất cả các khu vực.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-lg leading-none">download</span>
              Tạo báo cáo
            </button>
            <button className="flex items-center gap-2 bg-[#00b2d6] hover:bg-[#00a0c0] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg leading-none">add</span>
              Di chuyển mới
            </button>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">input</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nhập sẵn sàng</p>
              <p className="text-2xl font-black text-slate-900">14</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">output</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Xuất sẵn sàng</p>
              <p className="text-2xl font-black text-slate-900">08</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang chờ</p>
              <p className="text-2xl font-black text-slate-900">12</p>
            </div>
          </div>
          <div className="bg-[#00b2d6] p-5 rounded-xl shadow-lg flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Xác nhận hôm nay</p>
              <p className="text-2xl font-black">156</p>
            </div>
          </div>
        </div>

        {/* ── Filter Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-7 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm placeholder-slate-400 outline-none transition-all"
                placeholder="Tìm Mã yêu cầu, Tên mặt hàng, hoặc SKU..."
                type="text"
              />
            </div>

            {/* Type Filter */}
            <div className="md:col-span-3 flex gap-2 items-center">
              {MOVEMENT_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    typeFilter === f
                      ? 'bg-[#00b2d6]/10 text-[#00b2d6] border border-[#00b2d6]/30'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* More Filters */}
            <div className="md:col-span-2">
              <button className="w-full h-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors border border-slate-200">
                <span className="material-symbols-outlined text-lg leading-none">filter_list</span>
                Bộ lọc
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
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Nhà kho</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Tên mặt hàng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider text-center">Số lượng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Người yêu cầu</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-[#00b2d6]">{row.id}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 font-semibold text-sm ${row.isInbound ? 'text-emerald-600' : 'text-orange-600'}`}>
                        <span className="material-symbols-outlined text-lg leading-none">{row.isInbound ? 'south_east' : 'north_east'}</span>
                        {row.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.warehouse}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800">{row.item}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">SKU: {row.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-center text-slate-800">{row.qty.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_MAP[row.status] || 'bg-slate-100 text-slate-600'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.requester}</td>
                    <td className="px-6 py-4 text-right">
                      {row.isInbound ? (
                        <button className="px-4 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold transition-colors">
                          Xác nhận nhập
                        </button>
                      ) : (
                        <button className="px-4 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold transition-colors">
                          Xác nhận xuất
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
              Hiển thị <span className="font-bold text-slate-700">1</span> đến <span className="font-bold text-slate-700">5</span> trong số <span className="font-bold text-slate-700">42</span> di chuyển
            </span>
            <div className="flex items-center gap-1.5">
              <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors bg-white" disabled>
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00b2d6] text-white text-sm font-bold">1</button>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold bg-white">2</button>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold bg-white">3</button>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors bg-white">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfirmMovement;
