import React from 'react';

const IconMoney = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
  </svg>
);
const IconChart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500">
    <path d="M5 19h2v-7H5v7zm4 0h2V5H9v14zm4 0h2v-4h-2v4zm4 0h2v-9h-2v9z"/>
  </svg>
);
const IconBuildings = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-purple-600">
    <path d="M12 3L2 12h3v8h14v-8h3L12 3zm-2 14H6v-4h4v4zm6 0h-4v-6h4v6zm0-8h-4V7h4v2z"/>
  </svg>
);
const IconGroup = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0C6.34 11 5 9.66 5 8s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const stats = [
  { label: 'Total Revenue', value: '$428,500', trend: '+12.5%', trendGreen: true, Icon: IconMoney, iconBg: '#eff6ff' },
  { label: 'Overall Occupancy %', value: '84.2%', trend: '+3.2%', trendGreen: true, Icon: IconChart, iconBg: '#fff7ed' },
  { label: 'Total Warehouses', value: '12', trend: 'Static', trendGreen: false, Icon: IconBuildings, iconBg: '#f5f3ff' },
  { label: 'Total Staff', value: '48', trend: '+2', trendGreen: true, Icon: IconGroup, iconBg: '#f0fdf4' },
];

const StatsCards = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
    {stats.map((stat, index) => (
      <div
        key={index}
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: stat.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <stat.Icon />
          </div>
          <span
            style={{
              backgroundColor: stat.trendGreen ? '#dcfce7' : '#f1f5f9',
              color: stat.trendGreen ? '#166534' : '#64748b',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {stat.trend}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{stat.label}</p>
        <h3 style={{ margin: '6px 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{stat.value}</h3>
      </div>
    ))}
  </div>
);

export default StatsCards;
