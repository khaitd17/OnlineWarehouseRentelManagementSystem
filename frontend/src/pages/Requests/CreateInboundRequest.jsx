import React from 'react';

const CreateInboundRequest = () => {
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

{/*  Breadcrumbs  */}
<nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
<a className="hover:text-primary" href="#">Dashboard</a>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<a className="hover:text-primary" href="#">Inbound Management</a>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<span className="text-slate-900 dark:text-slate-200 font-semibold">Create Request</span>
</nav>
{/*  Page Header  */}
<div className="mb-10">
<h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create Inbound Request</h1>
<p className="mt-2 text-slate-500 dark:text-slate-400">Register a new incoming shipment into the warehouse management system.</p>
</div>
{/*  Form Container  */}
<form className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
<div className="p-8 space-y-8">
{/*  Grid Layout for Form  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
{/*  Left Column  */}
<div className="space-y-6">
<div>
<label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Warehouse Selection</label>
<div className="relative">
<select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 py-3 pl-4 pr-10 appearance-none">
<option value="">Select destination warehouse</option>
<option value="central-01">Central Hub - New York (NY-01)</option>
<option value="west-02">West Coast Logistics - Los Angeles (LA-02)</option>
<option value="mid-03">Midwest Storage - Chicago (CH-03)</option>
</select>
<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
<span className="material-symbols-outlined">expand_more</span>
</div>
</div>
</div>
<div>
<label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Item Name</label>
<input className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 py-3 px-4" placeholder="Enter product name or SKU code" type="text"/>
</div>
<div>
<label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Item Description</label>
<textarea className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 py-3 px-4 resize-none" placeholder="Provide additional details about the item..." rows="4"></textarea>
</div>
</div>
{/*  Right Column  */}
<div className="space-y-6">
<div>
<label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
<div className="flex items-center gap-2">
<input className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 py-3 px-4" min="1" placeholder="0" type="number"/>
<span className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">Units</span>
</div>
</div>
<div>
<label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Expected Arrival Date</label>
<div className="relative">
<input className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 py-3 px-4" type="date"/>
</div>
</div>
<div>
<label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Shipment Notes</label>
<textarea className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 py-3 px-4 resize-none" placeholder="Handling instructions, delivery notes, etc." rows="4"></textarea>
</div>
</div>
</div>
{/*  Informational Section  */}
<div className="p-4 bg-primary/5 rounded-lg flex gap-4 border border-primary/20">
<span className="material-symbols-outlined text-primary">info</span>
<div>
<p className="text-sm font-semibold text-primary">Pre-arrival Check</p>
<p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">Ensure that all items are labeled with the appropriate barcodes and documentation is attached to the exterior of the pallet for rapid processing upon arrival.</p>
</div>
</div>
</div>
{/*  Form Actions  */}
<div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3">
<button className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" type="button">
                        Cancel
                    </button>
<button className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2" type="submit">
<span className="material-symbols-outlined text-lg">check_circle</span>
                        Create Inbound Request
                    </button>
</div>
</form>
{/*  Footer Help Text  */}
<div className="mt-12 text-center">
<p className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-sm">help</span>
                    Need assistance with inbound scheduling? Contact the <a className="text-primary hover:underline" href="#">Support Desk</a>.
                </p>
</div>

</div>
  );
};

export default CreateInboundRequest;
