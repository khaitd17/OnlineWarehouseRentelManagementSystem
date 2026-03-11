import React from 'react';

const TransactionHistory = () => {
  return (
    <div className="w-full flex-1 flex flex-col min-w-0">
<div className="space-y-6">
{/*  Page Header & Actions  */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
<div>
<h1 className="text-3xl font-black tracking-tight">Transaction History</h1>
<p className="text-slate-500 dark:text-slate-400">View and export historical inventory movements across all facilities.</p>
</div>
<button className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
<span className="material-symbols-outlined">download</span>
                        Export to CSV/PDF
                    </button>
</div>
{/*  Filters & Search  */}
<div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm flex flex-col lg:flex-row gap-4">
<div className="flex-1 relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
<input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="Search Transaction ID, Item, or User..." type="text"/>
</div>
<div className="flex flex-wrap items-center gap-3">
<div className="relative min-w-[180px]">
<select className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm appearance-none">
<option>All Warehouses</option>
<option>North Hub (WH-1)</option>
<option>South Hub (WH-2)</option>
<option>Central Storage (WH-3)</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
</div>
<div className="relative min-w-[150px]">
<select className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm appearance-none">
<option>Transaction Type</option>
<option>Inbound</option>
<option>Outbound</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
</div>
<div className="relative">
<button className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
<span className="material-symbols-outlined text-sm">calendar_today</span>
                                Oct 24 - Oct 31, 2023
                            </button>
</div>
<button className="p-2.5 text-primary hover:bg-primary/5 rounded-lg transition-colors">
<span className="material-symbols-outlined">filter_list</span>
</button>
</div>
</div>
{/*  Data Table  */}
<div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/10">
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Performed By</th>
</tr>
</thead>
<tbody className="divide-y divide-primary/5">
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-6 py-4 font-mono text-xs text-primary font-semibold">#TXN-90421</td>
<td className="px-6 py-4">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
<span className="material-symbols-outlined text-[16px]">south_east</span>
                                            Inbound
                                        </span>
</td>
<td className="px-6 py-4 text-sm">North Hub</td>
<td className="px-6 py-4">
<div className="text-sm font-medium">Lithium-Ion Batteries (XL)</div>
<div className="text-[10px] text-slate-400">SKU: BAT-001-X</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-emerald-600">+1,200</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 31, 2023 09:12 AM</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2">
<div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">JD</div>
<span className="text-sm">John Doe</span>
</div>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-6 py-4 font-mono text-xs text-primary font-semibold">#TXN-90419</td>
<td className="px-6 py-4">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
<span className="material-symbols-outlined text-[16px]">north_east</span>
                                            Outbound
                                        </span>
</td>
<td className="px-6 py-4 text-sm">Central Storage</td>
<td className="px-6 py-4">
<div className="text-sm font-medium">Steel Casing Units</div>
<div className="text-[10px] text-slate-400">SKU: ST-CSE-09</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-amber-600">-450</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 31, 2023 08:45 AM</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2">
<div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">SA</div>
<span className="text-sm">Sarah Adams</span>
</div>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-6 py-4 font-mono text-xs text-primary font-semibold">#TXN-90415</td>
<td className="px-6 py-4">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
<span className="material-symbols-outlined text-[16px]">south_east</span>
                                            Inbound
                                        </span>
</td>
<td className="px-6 py-4 text-sm">South Hub</td>
<td className="px-6 py-4">
<div className="text-sm font-medium">Industrial Cables 50m</div>
<div className="text-[10px] text-slate-400">SKU: CAB-50M-HD</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-emerald-600">+25</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 30, 2023 04:20 PM</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2">
<div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">MK</div>
<span className="text-sm">Mike Knight</span>
</div>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-6 py-4 font-mono text-xs text-primary font-semibold">#TXN-90412</td>
<td className="px-6 py-4">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
<span className="material-symbols-outlined text-[16px]">north_east</span>
                                            Outbound
                                        </span>
</td>
<td className="px-6 py-4 text-sm">North Hub</td>
<td className="px-6 py-4">
<div className="text-sm font-medium">Conveyor Belt Segments</div>
<div className="text-[10px] text-slate-400">SKU: CB-SEG-44</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-amber-600">-12</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 30, 2023 02:15 PM</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2">
<div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">JD</div>
<span className="text-sm">John Doe</span>
</div>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-6 py-4 font-mono text-xs text-primary font-semibold">#TXN-90408</td>
<td className="px-6 py-4">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
<span className="material-symbols-outlined text-[16px]">north_east</span>
                                            Outbound
                                        </span>
</td>
<td className="px-6 py-4 text-sm">North Hub</td>
<td className="px-6 py-4">
<div className="text-sm font-medium">Hydraulic Pump V8</div>
<div className="text-[10px] text-slate-400">SKU: HP-V8-PRO</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-amber-600">-100</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 30, 2023 11:30 AM</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2">
<div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">JD</div>
<span className="text-sm">John Doe</span>
</div>
</td>
</tr>
</tbody>
</table>
</div>
{/*  Pagination  */}
<div className="px-6 py-4 flex items-center justify-between border-t border-primary/10 bg-slate-50 dark:bg-slate-800/50">
<p className="text-xs text-slate-500 font-medium">Showing 1 to 5 of 2,410 transactions</p>
<div className="flex items-center gap-2">
<button className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-primary/10 text-slate-400 hover:text-primary transition-colors">
<span className="material-symbols-outlined">chevron_left</span>
</button>
<div className="flex items-center gap-1">
<button className="size-8 rounded-lg bg-primary text-white text-xs font-bold">1</button>
<button className="size-8 rounded-lg bg-white dark:bg-slate-900 border border-primary/10 text-xs font-bold hover:border-primary transition-colors">2</button>
<button className="size-8 rounded-lg bg-white dark:bg-slate-900 border border-primary/10 text-xs font-bold hover:border-primary transition-colors">3</button>
<span className="px-1 text-slate-400">...</span>
<button className="size-8 rounded-lg bg-white dark:bg-slate-900 border border-primary/10 text-xs font-bold hover:border-primary transition-colors">482</button>
</div>
<button className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-primary/10 text-slate-400 hover:text-primary transition-colors">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</div>
{/*  Quick Stats  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
<div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
<div className="flex items-center justify-between mb-2">
<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Inbound</span>
<span className="material-symbols-outlined text-emerald-500">trending_up</span>
</div>
<div className="text-2xl font-black">4,281</div>
<div className="text-[10px] text-emerald-600 font-bold mt-1">+12% from yesterday</div>
</div>
<div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
<div className="flex items-center justify-between mb-2">
<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Outbound</span>
<span className="material-symbols-outlined text-amber-500">trending_down</span>
</div>
<div className="text-2xl font-black">2,904</div>
<div className="text-[10px] text-amber-600 font-bold mt-1">-5% from yesterday</div>
</div>
<div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
<div className="flex items-center justify-between mb-2">
<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Error Rate</span>
<span className="material-symbols-outlined text-primary">analytics</span>
</div>
<div className="text-2xl font-black">0.02%</div>
<div className="text-[10px] text-primary font-bold mt-1">Maintaining SLA</div>
</div>
</div>
</div>

</div>
  );
};

export default TransactionHistory;
