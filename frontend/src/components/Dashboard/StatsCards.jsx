import React from 'react';

const StatsCards = () => {
  const stats = [
    { label: 'Tổng doanh thu', value: '$428,500', trend: '+12.5%', icon: '💰', iconBg: '#eff6ff', iconColor: '#1152d4' },
    { label: 'Tỉ suất lấp đầy', value: '84.2%', trend: '+3.2%', icon: '📊', iconBg: '#fff7ed', iconColor: '#ea580c' },
    { label: 'Tổng số kho', value: '12', trend: 'Static', icon: '🏢', iconBg: '#f5f3ff', iconColor: '#7c3aed' },
    { label: 'Tổng nhân viên', value: '48', trend: '+2', icon: '👥', iconBg: '#f0fdf4', iconColor: '#16a34a' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      {stats.map((stat, index) => (
        <div key={index} style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: stat.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {stat.icon}
            </div>
            <div style={{
              backgroundColor: stat.trend.startsWith('+') ? '#dcfce7' : '#f3f4f6',
              color: stat.trend.startsWith('+') ? '#166534' : '#6b7280',
              padding: '4px 8px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {stat.trend}
            </div>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>{stat.label}</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
