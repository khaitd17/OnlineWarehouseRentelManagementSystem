import React from 'react';

const ConfirmMovement = () => {
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

<div className="space-y-8">
{/*  Page Title & Main Actions  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div className="space-y-1">
<h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Confirm Movement</h1>
<p className="text-slate-500 dark:text-slate-400">Manage and confirm inbound and outbound stock movements across all zones.</p>
</div>
<div className="flex gap-3">
<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
<span className="material-symbols-outlined text-lg">download</span>
                            Generate Report
                        </button>
<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
<span className="material-symbols-outlined text-lg">add</span>
                            New Movement
                        </button>
</div>
</div>
{/*  Filters & Search Bar  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
<div className="md:col-span-7 relative">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
<input className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-base" placeholder="Search Request ID, Item Name, or SKU..." type="text"/>
</div>
<div className="md:col-span-3">
<select className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-base appearance-none cursor-pointer">
<option value="all">All Movement Types</option>
<option value="inbound">Inbound Only</option>
<option value="outbound">Outbound Only</option>
</select>
</div>
<div className="md:col-span-2">
<button className="w-full h-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
<span className="material-symbols-outlined text-lg">filter_list</span>
                            More Filters
                        </button>
</div>
</div>
{/*  Data Table Container  */}
<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Request ID</th>
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Warehouse</th>
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Item Name</th>
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Qty</th>
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Requested By</th>
<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
{/*  Row 1: Inbound Pending  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 font-mono text-sm font-semibold text-primary">#REQ-82910</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
<span className="material-symbols-outlined text-lg">south_east</span>
                                            Inbound
                                        </div>
</td>
<td className="px-6 py-4 text-sm">Central WH - Z10</td>
<td className="px-6 py-4">
<div className="flex flex-col">
<span className="font-semibold text-sm">Pneumatic Actuators</span>
<span className="text-xs text-slate-400">SKU: PA-4420-B</span>
</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-center">250</td>
<td className="px-6 py-4">
<span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Pending</span>
</td>
<td className="px-6 py-4 text-sm">John Doe</td>
<td className="px-6 py-4 text-right">
<button className="px-4 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold transition-colors dark:bg-emerald-900/40 dark:text-emerald-300">
                                            Confirm Inbound
                                        </button>
</td>
</tr>
{/*  Row 2: Outbound In-Progress  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 font-mono text-sm font-semibold text-primary">#REQ-82915</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium text-sm">
<span className="material-symbols-outlined text-lg">north_east</span>
                                            Outbound
                                        </div>
</td>
<td className="px-6 py-4 text-sm">East-Side Hub</td>
<td className="px-6 py-4">
<div className="flex flex-col">
<span className="font-semibold text-sm">High-Cap Li-Ion Cells</span>
<span className="text-xs text-slate-400">SKU: LI-900-X</span>
</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-center">1,200</td>
<td className="px-6 py-4">
<span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">In-Progress</span>
</td>
<td className="px-6 py-4 text-sm">Sarah Jenkins</td>
<td className="px-6 py-4 text-right">
<button className="px-4 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold transition-colors dark:bg-orange-900/40 dark:text-orange-300">
                                            Confirm Outbound
                                        </button>
</td>
</tr>
{/*  Row 3: Outbound Ready  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 font-mono text-sm font-semibold text-primary">#REQ-82921</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium text-sm">
<span className="material-symbols-outlined text-lg">north_east</span>
                                            Outbound
                                        </div>
</td>
<td className="px-6 py-4 text-sm">Main Logistics Park</td>
<td className="px-6 py-4">
<div className="flex flex-col">
<span className="font-semibold text-sm">Control Unit v4</span>
<span className="text-xs text-slate-400">SKU: CU-V4-SYS</span>
</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-center">45</td>
<td className="px-6 py-4">
<span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Ready</span>
</td>
<td className="px-6 py-4 text-sm">Mike Ross</td>
<td className="px-6 py-4 text-right">
<button className="px-4 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold transition-colors dark:bg-orange-900/40 dark:text-orange-300">
                                            Confirm Outbound
                                        </button>
</td>
</tr>
{/*  Row 4: Inbound In-Progress  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 font-mono text-sm font-semibold text-primary">#REQ-82924</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
<span className="material-symbols-outlined text-lg">south_east</span>
                                            Inbound
                                        </div>
</td>
<td className="px-6 py-4 text-sm">Cold Storage Alpha</td>
<td className="px-6 py-4">
<div className="flex flex-col">
<span className="font-semibold text-sm">Silicone Gaskets</span>
<span className="text-xs text-slate-400">SKU: SG-12-RED</span>
</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-center">5,000</td>
<td className="px-6 py-4">
<span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">In-Progress</span>
</td>
<td className="px-6 py-4 text-sm">Elena Gilbert</td>
<td className="px-6 py-4 text-right">
<button className="px-4 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold transition-colors dark:bg-emerald-900/40 dark:text-emerald-300">
                                            Confirm Inbound
                                        </button>
</td>
</tr>
{/*  Row 5: Inbound Ready  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 font-mono text-sm font-semibold text-primary">#REQ-82930</td>
<td className="px-6 py-4">
<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
<span className="material-symbols-outlined text-lg">south_east</span>
                                            Inbound
                                        </div>
</td>
<td className="px-6 py-4 text-sm">Distribution Cntr 2</td>
<td className="px-6 py-4">
<div className="flex flex-col">
<span className="font-semibold text-sm">Steel Frame Supports</span>
<span className="text-xs text-slate-400">SKU: ST-FR-88</span>
</div>
</td>
<td className="px-6 py-4 text-sm font-bold text-center">80</td>
<td className="px-6 py-4">
<span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Ready</span>
</td>
<td className="px-6 py-4 text-sm">David King</td>
<td className="px-6 py-4 text-right">
<button className="px-4 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold transition-colors dark:bg-emerald-900/40 dark:text-emerald-300">
                                            Confirm Inbound
                                        </button>
</td>
</tr>
</tbody>
</table>
</div>
{/*  Table Pagination  */}
<div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
<p className="text-sm text-slate-500">Showing 1 to 5 of 42 movements</p>
<div className="flex gap-2">
<button className="size-8 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-50" disabled="">
<span className="material-symbols-outlined text-lg">chevron_left</span>
</button>
<button className="size-8 rounded border border-primary bg-primary text-white flex items-center justify-center font-bold text-sm">1</button>
<button className="size-8 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 font-bold text-sm">2</button>
<button className="size-8 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 font-bold text-sm">3</button>
<button className="size-8 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500">
<span className="material-symbols-outlined text-lg">chevron_right</span>
</button>
</div>
</div>
</div>
{/*  Status Legend / Summary Cards  */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
<div className="size-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
<span className="material-symbols-outlined text-2xl">input</span>
</div>
<div>
<p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inbound Ready</p>
<p className="text-2xl font-black text-slate-900 dark:text-slate-100">14</p>
</div>
</div>
<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
<div className="size-12 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
<span className="material-symbols-outlined text-2xl">output</span>
</div>
<div>
<p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Outbound Ready</p>
<p className="text-2xl font-black text-slate-900 dark:text-slate-100">08</p>
</div>
</div>
<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
<div className="size-12 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
<span className="material-symbols-outlined text-2xl">schedule</span>
</div>
<div>
<p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pending</p>
<p className="text-2xl font-black text-slate-900 dark:text-slate-100">12</p>
</div>
</div>
<div className="bg-primary p-5 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-4 text-white">
<div className="size-12 rounded-lg bg-white/20 flex items-center justify-center">
<span className="material-symbols-outlined text-2xl">verified</span>
</div>
<div>
<p className="text-xs font-bold uppercase tracking-widest opacity-80">Confirmed Today</p>
<p className="text-2xl font-black">156</p>
</div>
</div>
</div>
</div>

</div>
  );
};

export default ConfirmMovement;
