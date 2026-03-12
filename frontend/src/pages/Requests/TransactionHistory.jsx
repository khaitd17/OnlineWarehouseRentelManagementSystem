import React, { useState } from 'react';

const MOCK_DATA = [
  {
    id: '#TXN-90421',
    type: 'Nhập kho',
    warehouse: 'North Hub',
    item: 'Lithium-Ion Batteries (XL)',
    sku: 'BAT-001-X',
    quantity: '+1,200',
    positive: true,
    datetime: 'Oct 31, 2023\n09:12 AM',
    performer: 'John Doe',
    initials: 'JD',
    color: 'bg-emerald-100 text-emerald-700',
    icon: 'south_east',
  },
  {
    id: '#TXN-90419',
    type: 'Xuất kho',
    warehouse: 'Central Storage',
    item: 'Steel Casing Units',
    sku: 'ST-CSE-09',
    quantity: '-450',
    positive: false,
    datetime: 'Oct 31, 2023\n08:45 AM',
    performer: 'Sarah Adams',
    initials: 'SA',
    color: 'bg-amber-100 text-amber-700',
    icon: 'north_east',
  },
  {
    id: '#TXN-90415',
    type: 'Nhập kho',
    warehouse: 'South Hub',
    item: 'Industrial Cables 50m',
    sku: 'CAB-50M-HD',
    quantity: '+25',
    positive: true,
    datetime: 'Oct 30, 2023\n04:20 PM',
    performer: 'Mike Knight',
    initials: 'MK',
    color: 'bg-emerald-100 text-emerald-700',
    icon: 'south_east',
  },
  {
    id: '#TXN-90412',
    type: 'Xuất kho',
    warehouse: 'North Hub',
    item: 'Conveyor Belt Segments',
    sku: 'CB-SEG-44',
    quantity: '-12',
    positive: false,
    datetime: 'Oct 30, 2023\n02:15 PM',
    performer: 'John Doe',
    initials: 'JD',
    color: 'bg-amber-100 text-amber-700',
    icon: 'north_east',
  },
  {
    id: '#TXN-90408',
    type: 'Xuất kho',
    warehouse: 'North Hub',
    item: 'Hydraulic Pump V8',
    sku: 'HP-V8-PRO',
    quantity: '-100',
    positive: false,
    datetime: 'Oct 30, 2023\n11:30 AM',
    performer: 'John Doe',
    initials: 'JD',
    color: 'bg-amber-100 text-amber-700',
    icon: 'north_east',
  },
];

const TransactionHistory = () => {
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('Tất cả kho hàng');
  const [txType, setTxType] = useState('Tất cả kho hàng');

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lịch sử giao dịch</h1>
            <p className="text-slate-500 text-sm mt-1">Xem và xuất lịch sử biến động kho hàng trên tất cả các kho.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#00b2d6] hover:bg-[#00a0c0] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg leading-none">download</span>
            Xuất CSV/PDF
          </button>
        </div>

        {/* ── Filter Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm placeholder-slate-400 outline-none transition-all"
                placeholder="Tìm mã giao dịch, mặt hàng, hoặc..."
                type="text"
              />
            </div>

            {/* Warehouse filter */}
            <div className="relative min-w-[180px]">
              <select
                value={warehouse}
                onChange={e => setWarehouse(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm appearance-none outline-none cursor-pointer"
              >
                <option>Tất cả kho hàng</option>
                <option>North Hub</option>
                <option>South Hub</option>
                <option>Central Storage</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            {/* Type filter */}
            <div className="relative min-w-[160px]">
              <select
                value={txType}
                onChange={e => setTxType(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00b2d6]/30 focus:border-[#00b2d6] text-sm appearance-none outline-none cursor-pointer"
              >
                <option>Tất cả kho hàng</option>
                <option>Nhập kho</option>
                <option>Xuất kho</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            {/* Date range */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Chọn ngày
            </button>

            {/* Filter icon */}
            <button className="p-2.5 text-[#00b2d6] hover:bg-[#00b2d6]/10 rounded-lg transition-colors border border-transparent hover:border-[#00b2d6]/20">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Mã giao dịch</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Kho hàng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Tên mặt hàng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Ngày giờ</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-[#00b2d6] uppercase tracking-wider">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_DATA.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-[#00b2d6] font-semibold">{row.id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${row.color}`}>
                        <span className="material-symbols-outlined text-[15px] leading-none">{row.icon}</span>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.warehouse}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{row.item}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">SKU: {row.sku}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold ${row.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {row.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-pre-line leading-5">{row.datetime}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                          {row.initials}
                        </div>
                        <span className="text-sm text-slate-700">{row.performer}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <span className="text-sm text-slate-500">
              Hiển thị <span className="font-bold text-slate-700">1</span> đến <span className="font-bold text-slate-700">5</span> trong số <span className="font-bold text-slate-700">2.410</span> giao dịch
            </span>
            <div className="flex items-center gap-1.5">
              <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors bg-white">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#00b2d6] text-white text-sm font-bold">
                <span className="material-symbols-outlined text-lg">download</span>
              </button>
              {[2, 3].map(n => (
                <button
                  key={n}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold bg-white"
                >
                  {n}
                </button>
              ))}
              <span className="px-1 text-slate-400 text-sm">...</span>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold bg-white">
                482
              </button>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors bg-white">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nhập kho hôm nay</span>
              <span className="material-symbols-outlined text-emerald-500">trending_up</span>
            </div>
            <div className="text-3xl font-black text-slate-900">4,281</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">+12% so với hôm qua</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Xuất kho hôm nay</span>
              <span className="material-symbols-outlined text-amber-500">trending_down</span>
            </div>
            <div className="text-3xl font-black text-slate-900">2,904</div>
            <div className="text-[11px] text-amber-600 font-bold mt-1">-5% so với hôm qua</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ lỗi</span>
              <span className="material-symbols-outlined text-[#00b2d6]">analytics</span>
            </div>
            <div className="text-3xl font-black text-slate-900">0.02%</div>
            <div className="text-[11px] text-[#00b2d6] font-bold mt-1">Duy trì SLA</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransactionHistory;
