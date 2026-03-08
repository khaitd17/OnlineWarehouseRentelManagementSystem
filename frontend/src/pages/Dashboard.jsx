import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import Sidebar from '../components/Dashboard/Sidebar';
import StatsCards from '../components/Dashboard/StatsCards';
import PortfolioTable from '../components/Dashboard/PortfolioTable';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  if (!user) return null;

  const role = (user?.role || user?.roleName || '').toUpperCase();
  if (role !== 'OWNER') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: '#111827', marginBottom: '16px' }}>Chào mừng, {user.fullName}!</h2>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Bạn đang đăng nhập với tư cách Khách thuê. Tính năng Dashboard dành cho khách thuê đang được phát triển.</p>
        <button 
          onClick={() => navigate('/')}
          style={{ marginTop: '24px', padding: '12px 24px', backgroundColor: '#1152d4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar />
      
      <main style={{ flex: 1, marginLeft: '260px', padding: '40px' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: 0 }}>Tổng quan Dashboard</h1>
            <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '1rem' }}>Các chỉ số hiệu suất thời gian thực trên toàn bộ danh mục kho bãi của bạn.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 16px', 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              color: '#374151', 
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              30 ngày qua
            </button>
            <button style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 16px', 
              backgroundColor: '#1152d4', 
              border: 'none', 
              borderRadius: '8px', 
              color: '#fff', 
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Xuất báo cáo
            </button>
          </div>
        </header>

        <StatsCards />

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          <PortfolioTable />
          <RecentActivity />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;