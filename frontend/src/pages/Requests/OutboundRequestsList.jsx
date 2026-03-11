import React from 'react';

const OutboundRequestsList = () => {
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

{/*  Page Title and CTA  */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
<div>
<h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Outbound Requests</h1>
<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and track your outgoing shipments and delivery orders.</p>
</div>
<button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm shadow-primary/20">
<span className="material-symbols-outlined text-lg">add_circle</span>
                Create Outbound Request
            </button>
</div>
{/*  Filters Section  */}
<div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
<div className="flex flex-col lg:flex-row gap-4">
<div className="flex-1 relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
<input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Search by Request ID, Item or Destination..." type="text"/>
</div>
<div className="flex flex-wrap gap-2">
<button className="px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm border border-primary/20">All Requests</button>
<button className="px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors">Pending</button>
<button className="px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors">Shipped</button>
<button className="px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors">Cancelled</button>
<div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
<button className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
<span className="material-symbols-outlined text-lg">filter_list</span>
<span className="text-sm font-medium">More Filters</span>
</button>
</div>
</div>
</div>
{/*  Table Container  */}
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
<div className="overflow-x-auto @container">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Request ID</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Warehouse</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item Name</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shipping Date</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created Date</th>
<th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
<tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-bold text-primary">#ORD-7721</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Central HUB (A)</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">Industrial Steel Pipes</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">500 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Chicago, IL</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Nov 15, 2023</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Pending
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-400">Nov 10, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
<button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
</div>
</td>
</tr>
<tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-bold text-primary">#ORD-7722</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">West Coast Log.</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">High-Grade Copper Wire</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">1,200 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Austin, TX</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Nov 14, 2023</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    Shipped
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-400">Nov 09, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
<button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
</div>
</td>
</tr>
<tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-bold text-primary">#ORD-7723</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Central HUB (A)</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">Aluminium Sheets (4x8)</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">300 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Seattle, WA</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Nov 18, 2023</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    Cancelled
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-400">Nov 11, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
<button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
</div>
</td>
</tr>
<tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-bold text-primary">#ORD-7724</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Southern Depot (C)</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">Mounting Brackets</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">2,500 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Miami, FL</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Nov 16, 2023</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Pending
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-400">Nov 12, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
<button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
</div>
</td>
</tr>
<tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
<td className="px-6 py-4 text-sm font-bold text-primary">#ORD-7725</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">West Coast Log.</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">Power Converters</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">45 units</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Portland, OR</td>
<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Nov 13, 2023</td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    Shipped
                                </span>
</td>
<td className="px-6 py-4 text-sm text-slate-400">Nov 08, 2023</td>
<td className="px-6 py-4 text-right">
<div className="flex justify-end gap-2">
<button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
<button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
{/*  Pagination  */}
<div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
<p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-900 dark:text-slate-100">1</span> to <span className="font-semibold text-slate-900 dark:text-slate-100">5</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">84</span> requests
                </p>
<div className="flex items-center gap-2">
<button className="flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
<span className="material-symbols-outlined text-lg">chevron_left</span>
</button>
<button className="flex items-center justify-center size-9 rounded-lg bg-primary text-white font-bold text-sm">1</button>
<button className="flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm">2</button>
<button className="flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm">3</button>
<span className="text-slate-400 px-1">...</span>
<button className="flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm">12</button>
<button className="flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
<span className="material-symbols-outlined text-lg">chevron_right</span>
</button>
</div>
</div>
</div>

</div>
  );
};

export default OutboundRequestsList;
