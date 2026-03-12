import React from 'react';

const IconPersonAdd = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const activities = [
  { title: 'New employee registered', desc: "Marcus Wright joined 'East Coast Depot'", time: '2 HOURS AGO', Icon: IconPersonAdd, color: '#eff6ff', iconColor: '#2563eb' },
  { title: 'Monthly audit completed', desc: 'South Storage Center passed compliance', time: '5 HOURS AGO', Icon: IconCheck, color: '#f0fdf4', iconColor: '#16a34a' },
  { title: 'Capacity alert triggered', desc: 'East Coast Depot reached 95% capacity', time: 'YESTERDAY', Icon: IconWarning, color: '#fff7ed', iconColor: '#ea580c' },
  { title: 'Warehouse record updated', desc: 'Insurance policy renewed for all sites', time: '2 DAYS AGO', Icon: IconFile, color: '#f5f3ff', iconColor: '#7c3aed' },
];

const RecentActivity = () => (
  <div
    style={{
      backgroundColor: '#fff',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #f1f5f9',
      width: '100%',
      minWidth: 0,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Recent Activity</h3>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {activities.map((activity, index) => (
        <div key={index} style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: activity.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: activity.iconColor,
            }}
          >
            <activity.Icon />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{activity.title}</p>
            <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>{activity.desc}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
    <button
      style={{
        width: '100%',
        marginTop: '24px',
        padding: '12px',
        backgroundColor: 'transparent',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        color: '#1152d4',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
      }}
    >
      See All Activity
    </button>
  </div>
);

export default RecentActivity;
