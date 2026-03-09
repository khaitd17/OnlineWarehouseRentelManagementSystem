import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: '📊', label: 'Tổng quan', path: '/dashboard', active: true },
    { icon: '🏠', label: 'Kho của tôi', path: '/my-warehouses' },
    { icon: '➕', label: 'Tạo kho mới', path: '/post-warehouse' },
    { icon: '👥', label: 'Quản lý nhân viên', path: '/list-staff', section: 'QUẢN LÝ' },
    { icon: '👤', label: 'Tạo nhân viên', path: '/create-staff' },
    { icon: '📈', label: 'Doanh thu & Phân tích', path: '/analytics', section: 'INSIGHTS' },
    { icon: '⚙️', label: 'Cài đặt', path: '/settings' },
  ];

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#fff',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#1152d4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>WC</div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#111827' }}>WarehouseConnect</h1>
          <p style={{ fontSize: '0.75rem', margin: 0, color: '#6b7280', fontWeight: 600 }}>OWNER PORTAL</p>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.section && (
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', margin: '24px 8px 12px', letterSpacing: '0.05em' }}>{item.section}</p>
            )}
            <Link 
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: item.active ? '#1152d4' : '#4b5563',
                backgroundColor: item.active ? '#eff6ff' : 'transparent',
                marginBottom: '4px',
                fontWeight: item.active ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
            </Link>
          </React.Fragment>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 8px 0' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src="https://ui-avatars.com/api/?name=Owner&background=random" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Chủ kho</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Quản lý hệ thống</p>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
