import React from 'react';
import { Link } from 'react-router-dom';

const PortfolioTable = () => {
  const warehouses = [
    { name: 'North Logistics Hub', location: 'Jersey City, NJ', occupancy: 85, revenue: '$45,000', status: 'ACTIVE' },
    { name: 'South Storage Center', location: 'Austin, TX', occupancy: 62, revenue: '$32,800', status: 'ACTIVE' },
    { name: 'East Coast Depot', location: 'Brooklyn, NY', occupancy: 95, revenue: '$58,200', status: 'AT CAPACITY' },
    { name: 'West Wing Terminal', location: 'Denver, CO', occupancy: 48, revenue: '$21,400', status: 'ACTIVE' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return { bg: '#dcfce7', text: '#166534' };
      case 'AT CAPACITY': return { bg: '#fef3c7', text: '#92400e' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const getProgressColor = (percent) => {
    if (percent > 90) return '#ea580c';
    if (percent > 70) return '#1152d4';
    return '#1152d4';
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0',
      flex: 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Warehouse Portfolio</h3>
        <Link to="/my-warehouses" style={{ color: '#1152d4', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>View All</Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
            <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>WAREHOUSE NAME</th>
            <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OCCUPANCY</th>
            <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MONTHLY REV</th>
            <th style={{ textAlign: 'right', padding: '12px 0', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.map((warehouse, index) => {
            const statusStyle = getStatusColor(warehouse.status);
            return (
              <tr key={index} style={{ borderBottom: index === warehouses.length - 1 ? 'none' : '1px solid #f9fafb' }}>
                <td style={{ padding: '20px 0' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{warehouse.name}</p>
                  <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '0.8rem' }}>{warehouse.location}</p>
                </td>
                <td style={{ padding: '20px 0', width: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', position: 'relative' }}>
                      <div style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        height: '100%', 
                        width: `${warehouse.occupancy}%`, 
                        backgroundColor: getProgressColor(warehouse.occupancy), 
                        borderRadius: '3px' 
                      }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>{warehouse.occupancy}%</span>
                  </div>
                </td>
                <td style={{ padding: '20px 0' }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{warehouse.revenue}</span>
                </td>
                <td style={{ padding: '20px 0', textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {warehouse.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
