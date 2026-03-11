import React from 'react';

const CreateOutboundRequest = () => {
  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

<div className="w-full max-w-[1120px] px-6 lg:px-10 py-6">
{/*  Breadcrumbs  */}
<nav className="flex items-center gap-2 mb-6">
<a className="text-slate-500 hover:text-primary text-sm font-medium" href="#">Dashboard</a>
<span className="text-slate-300 dark:text-slate-700 material-symbols-outlined text-[16px]">chevron_right</span>
<a className="text-slate-500 hover:text-primary text-sm font-medium" href="#">Outbound Management</a>
<span className="text-slate-300 dark:text-slate-700 material-symbols-outlined text-[16px]">chevron_right</span>
<span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Create Request</span>
</nav>
{/*  Page Title  */}
<div className="mb-8">
<h1 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">Create Outbound Request</h1>
<p className="text-slate-500 dark:text-slate-400 mt-1">Initiate a new shipping request by providing the required logistics details.</p>
</div>
{/*  Form Card Container  */}
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
<div className="p-6 md:p-8">
<form className="space-y-8">
{/*  Two Column Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
{/*  Warehouse Selection  */}
<div className="flex flex-col gap-2">
<label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Warehouse</label>
<div className="relative">
<select className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
<option disabled="" selected="" value="">Select originating warehouse</option>
<option value="wh-north">North Region Distribution Center</option>
<option value="wh-south">South Logistics Hub</option>
<option value="wh-east">East Coast Fulfillment</option>
<option value="wh-west">West Coast Warehouse</option>
</select>
<div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
<span className="material-symbols-outlined">expand_more</span>
</div>
</div>
</div>
{/*  Item Name  */}
<div className="flex flex-col gap-2">
<label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Item Name / SKU</label>
<div className="relative">
<input className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. LAPTOP-X1-CARBON or SKU-9902" type="text"/>
<div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
<span className="material-symbols-outlined text-[20px]">inventory_2</span>
</div>
</div>
</div>
{/*  Quantity  */}
<div className="flex flex-col gap-2">
<label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Quantity</label>
<input className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" min="1" placeholder="Enter amount" type="number"/>
</div>
{/*  Destination  */}
<div className="flex flex-col gap-2">
<label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Destination Address</label>
<div className="relative">
<input className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Enter street, city, postal code" type="text"/>
<div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
<span className="material-symbols-outlined text-[20px]">location_on</span>
</div>
</div>
</div>
{/*  Shipping Date  */}
<div className="flex flex-col gap-2">
<label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Expected Shipping Date</label>
<div className="relative">
<input className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" type="date"/>
<div className="absolute inset-y-0 right-10 flex items-center pointer-events-none text-slate-400">
{/*  The native calendar icon is usually visible, adding extra margin if needed  */}
</div>
</div>
</div>
{/*  Empty spacer for layout balance on md+ screens  */}
<div className="hidden md:block"></div>
{/*  Notes (Full width on md+)  */}
<div className="flex flex-col gap-2 md:col-span-2">
<label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Additional Notes</label>
<textarea className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="Mention handling instructions, urgency or gate information..." rows="4"></textarea>
</div>
</div>
{/*  Form Actions  */}
<div className="flex flex-col sm:flex-row-reverse items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
<button className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2" type="submit">
<span className="material-symbols-outlined text-[20px]">send</span>
                                    Create Outbound Request
                                </button>
<button className="w-full sm:w-auto px-8 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2" type="button">
                                    Cancel
                                </button>
</div>
</form>
</div>
</div>
{/*  Status Cards (Optional Decoration/Context)  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
<div className="p-5 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-4">
<div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined">verified</span>
</div>
<div>
<p className="text-xs font-bold text-primary uppercase tracking-wider">Validation</p>
<p className="text-sm text-slate-600 dark:text-slate-400">Auto-check stock availability</p>
</div>
</div>
<div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 opacity-60">
<div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
<span className="material-symbols-outlined">schedule</span>
</div>
<div>
<p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Processing</p>
<p className="text-sm text-slate-600 dark:text-slate-400">Assign to carrier fleet</p>
</div>
</div>
<div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 opacity-60">
<div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
<span className="material-symbols-outlined">local_shipping</span>
</div>
<div>
<p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatched</p>
<p className="text-sm text-slate-600 dark:text-slate-400">Tracking link generation</p>
</div>
</div>
</div>
</div>

</div>
  );
};

export default CreateOutboundRequest;
