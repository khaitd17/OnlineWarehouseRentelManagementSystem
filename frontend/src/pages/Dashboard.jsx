import React from 'react';
import { Link } from 'react-router-dom';
import StatsCards from '../components/Dashboard/StatsCards';
import PortfolioTable from '../components/Dashboard/PortfolioTable';
import RecentActivity from '../components/Dashboard/RecentActivity';

function Dashboard() {
  return (
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
      </div>
    </div>
  );
}

export default Dashboard;
