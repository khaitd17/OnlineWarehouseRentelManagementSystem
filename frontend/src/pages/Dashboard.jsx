import React from 'react';
import { Link } from 'react-router-dom';
<<<<<<< Updated upstream
import StatsCards from '../components/Dashboard/StatsCards';
import PortfolioTable from '../components/Dashboard/PortfolioTable';
import RecentActivity from '../components/Dashboard/RecentActivity';
=======
>>>>>>> Stashed changes

// Custom KPI icons - solid/filled style like reference
const IconMoney = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 shrink-0">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
  </svg>
);
const IconChart = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-orange-600 shrink-0">
    <path d="M5 19h2v-7H5v7zm4 0h2V5H9v14zm4 0h2v-4h-2v4zm4 0h2v-9h-2v9z"/>
  </svg>
);
const IconBuildings = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-purple-600 shrink-0">
    <path d="M12 3L2 12h3v8h14v-8h3L12 3zm-2 14H6v-4h4v4zm6 0h-4v-6h4v6zm0-8h-4V7h4v2z"/>
  </svg>
);
const IconGroup = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600 shrink-0">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0C6.34 11 5 9.66 5 8s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const Dashboard = () => {
  return (
<<<<<<< Updated upstream
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#111827' }}>Dashboard Overview</h1>
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#64748b' }}>
          Real-time performance metrics across your warehouse portfolio.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          style={{
            padding: '10px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: '#fff',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Last 30 Days
        </button>
        <button
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#2563eb',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Report
        </button>
      </div>

      <StatsCards />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)', gap: '24px', alignItems: 'start' }}>
        <PortfolioTable />
        <RecentActivity />
=======
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Real-time performance metrics across your warehouse portfolio.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 border border-slate-200 bg-white rounded-lg flex items-center gap-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              Last 30 Days
            </button>
            <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-lg">download</span>
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <IconMoney />
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">+12.5%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">$428,500</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <IconChart />
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">+3.2%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Overall Occupancy %</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">84.2%</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <IconBuildings />
              </div>
              <span className="text-slate-400 text-xs font-semibold px-2 py-1">Static</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Warehouses</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">12</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <IconGroup />
              </div>
              <span className="text-emerald-600 text-xs font-bold px-2 py-1">+2</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Staff</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">48</h3>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouse Portfolio */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Warehouse Portfolio</h2>
              <Link to="/my-warehouses" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4">WAREHOUSE NAME</th>
                    <th className="px-6 py-4">OCCUPANCY</th>
                    <th className="px-6 py-4">MONTHLY REV</th>
                    <th className="px-6 py-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">North Logistics Hub</div>
                      <div className="text-xs text-slate-500">Jersey City, NJ</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="font-semibold">85%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">$45,000</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">South Storage Center</div>
                      <div className="text-xs text-slate-500">Austin, TX</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '62%' }}></div>
                        </div>
                        <span className="font-semibold">62%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">$32,800</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">East Coast Depot</div>
                      <div className="text-xs text-slate-500">Brooklyn, NY</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                        <span className="font-semibold">95%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">$58,200</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">AT CAPACITY</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">West Wing Terminal</div>
                      <div className="text-xs text-slate-500">Denver, CO</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '48%' }}></div>
                        </div>
                        <span className="font-semibold">48%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">$21,400</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-600">refresh</span>
            </div>
            <div className="flex-1 space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">New employee registered</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Marcus Wright joined &apos;East Coast Depot&apos;</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase tracking-wide">2 HOURS AGO</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Monthly audit completed</h4>
                  <p className="text-xs text-slate-500 mt-0.5">South Storage Center passed compliance</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase tracking-wide">5 HOURS AGO</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Capacity alert triggered</h4>
                  <p className="text-xs text-slate-500 mt-0.5">East Coast Depot reached 95% capacity</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase tracking-wide">YESTERDAY</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <span className="material-symbols-outlined text-xl">store</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Warehouse record updated</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Insurance policy renewed for all sites</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase tracking-wide">2 DAYS AGO</span>
                </div>
              </div>
            </div>
            <Link to="/my-warehouses" className="w-full py-3 mt-6 border-t border-slate-100 text-sm font-semibold text-blue-600 hover:text-blue-800 text-center transition-colors">
              See All Activity
            </Link>
          </div>
        </div>
>>>>>>> Stashed changes
      </div>
    </div>
  );
};

export default Dashboard;
