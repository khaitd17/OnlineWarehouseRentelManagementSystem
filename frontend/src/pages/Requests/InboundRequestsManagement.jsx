import React from 'react';

const InboundRequestsManagement = () => {
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

{/*  Page Title & Primary Action  */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-8">
<div>
<h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">Inbound Requests</h1>
<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and track incoming stock shipments across all hubs.</p>
</div>
<button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm shadow-primary/20">
<span className="material-symbols-outlined text-sm">add</span>
<span>New Request</span>
</button>
</div>
{/*  Filters Section  */}
<div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end mb-6">
<div className="flex-1 min-w-[300px]">
<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Requests</label>
<div className="relative group">
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
<span className="material-symbols-outlined">search</span>
</div>
<input className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/50 text-sm placeholder-slate-400 transition-all" placeholder="ID, Item, or Requester..." type="text"/>
</div>
</div>
<div className="w-full md:w-48">
<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter Status</label>
<select className="block w-full py-2.5 pl-3 pr-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/50 text-sm appearance-none cursor-pointer">
<option>All Statuses</option>
<option>Pending</option>
<option>Approved</option>
<option>Rejected</option>
</select>
</div>
<button className="flex items-center justify-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
<span className="material-symbols-outlined">filter_list</span>
<span>Advanced</span>
</button>
</div>
{/*  Data Table Section  */}
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Request ID</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requester</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created Date</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
{/*  Row 1  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">#REQ-1024</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">North Hub</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Steel Pipes</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">500 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">John Doe</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                    Pending
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 24, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="View Details">
<span className="material-symbols-outlined text-xl leading-none">visibility</span>
</button>
<button className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors" title="Approve">
<span className="material-symbols-outlined text-xl leading-none">check_circle</span>
</button>
<button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Reject">
<span className="material-symbols-outlined text-xl leading-none">cancel</span>
</button>
</div>
</td>
</tr>
{/*  Row 2  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">#REQ-1023</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">East Wing</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Copper Wire</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">1,200 m</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Jane Smith</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                    Approved
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 23, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="View Details">
<span className="material-symbols-outlined text-xl leading-none">visibility</span>
</button>
<button className="p-1.5 text-slate-200 dark:text-slate-700 cursor-not-allowed" disabled="">
<span className="material-symbols-outlined text-xl leading-none">check_circle</span>
</button>
<button className="p-1.5 text-slate-200 dark:text-slate-700 cursor-not-allowed" disabled="">
<span className="material-symbols-outlined text-xl leading-none">cancel</span>
</button>
</div>
</td>
</tr>
{/*  Row 3  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">#REQ-1022</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">South Port</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Pallets</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">50 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Mike Ross</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                                    Rejected
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 23, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="View Details">
<span className="material-symbols-outlined text-xl leading-none">visibility</span>
</button>
<button className="p-1.5 text-slate-200 dark:text-slate-700 cursor-not-allowed" disabled="">
<span className="material-symbols-outlined text-xl leading-none">check_circle</span>
</button>
<button className="p-1.5 text-slate-200 dark:text-slate-700 cursor-not-allowed" disabled="">
<span className="material-symbols-outlined text-xl leading-none">cancel</span>
</button>
</div>
</td>
</tr>
{/*  Row 4  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">#REQ-1021</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">North Hub</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Valves</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">300 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Harvey Specter</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                    Pending
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 22, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="View Details">
<span className="material-symbols-outlined text-xl leading-none">visibility</span>
</button>
<button className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors" title="Approve">
<span className="material-symbols-outlined text-xl leading-none">check_circle</span>
</button>
<button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Reject">
<span className="material-symbols-outlined text-xl leading-none">cancel</span>
</button>
</div>
</td>
</tr>
{/*  Row 5  */}
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">#REQ-1020</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">West Dock</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Fittings</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">150 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Louis Litt</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                    Approved
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-500">Oct 22, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="View Details">
<span className="material-symbols-outlined text-xl leading-none">visibility</span>
</button>
<button className="p-1.5 text-slate-200 dark:text-slate-700 cursor-not-allowed" disabled="">
<span className="material-symbols-outlined text-xl leading-none">check_circle</span>
</button>
<button className="p-1.5 text-slate-200 dark:text-slate-700 cursor-not-allowed" disabled="">
<span className="material-symbols-outlined text-xl leading-none">cancel</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
{/*  Table Footer / Pagination  */}
<div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
<span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-700 dark:text-slate-200">1-10</span> of <span className="font-bold text-slate-700 dark:text-slate-200">45</span> requests
                </span>
<div className="flex gap-2">
<button className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
<span className="material-symbols-outlined text-sm mr-1">chevron_left</span>
                        Prev
                    </button>
<button className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Next
                        <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
</button>
</div>
</div>
</div>

</div>
  );
};

export default InboundRequestsManagement;
