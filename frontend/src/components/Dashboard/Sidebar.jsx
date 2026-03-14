import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || user.roleName || '').toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const allMenus = {
    OWNER: [
      { icon: 'dashboard', label: 'Tổng quan', path: '/dashboard' },
      { icon: 'warehouse', label: 'Kho của tôi', path: '/my-warehouses' },
      { icon: 'add_circle', label: 'Tạo kho mới', path: '/post-warehouse' },
      { icon: 'inventory_2', label: 'Yêu cầu nhập/xuất', path: '/owner-inventory-requests', section: 'YÊU CẦU' },
      { icon: 'group', label: 'Quản lý nhân viên', path: '/list-staff', section: 'QUẢN LÝ' },
      { icon: 'person_add', label: 'Tạo nhân viên', path: '/create-staff' },
      { icon: 'bar_chart', label: 'Phân tích doanh thu', path: '/analytics', section: 'BÁO CÁO' },
      { icon: 'settings', label: 'Cài đặt', path: '/settings', isBottom: true },
    ],
    RENTER: [
      { icon: 'dashboard', label: 'Bảng điều khiển', path: '/renter-dashboard' },
      { icon: 'move_to_inbox', label: 'Yêu cầu nhập kho', path: '/renter-inbound-requests' },
      { icon: 'outbox', label: 'Yêu cầu xuất kho', path: '/renter-outbound-requests' },
      { icon: 'add_circle', label: 'Tạo yêu cầu nhập', path: '/create-inbound' },
      { icon: 'upload', label: 'Tạo yêu cầu xuất', path: '/create-outbound' },
      { icon: 'bar_chart', label: 'Báo cáo', path: '/transaction-history' },
      { icon: 'settings', label: 'Cài đặt', path: '/settings', isBottom: true },
    ],
    STAFF: [
      { icon: 'dashboard', label: 'Bảng điều khiển', path: '/staff-dashboard' },
      { icon: 'move_to_inbox', label: 'Yêu cầu nhập kho', path: '/inbound-requests' },
      { icon: 'outbox', label: 'Yêu cầu xuất kho', path: '/outbound-requests' },
      { icon: 'swap_horiz', label: 'Xác nhận di chuyển', path: '/confirm-movement' },
      { icon: 'history', label: 'Lịch sử giao dịch', path: '/transaction-history' },
      { icon: 'settings', label: 'Cài đặt', path: '/settings', isBottom: true },
    ],
  };

  allMenus['MANAGER'] = allMenus['STAFF'];

  const menuItems = allMenus[userRole] || allMenus['OWNER'];
  const accentColor = '#00b2d6';
  const activeBg = '#e0f2fe';

  return (
    <div style={{
      width: '240px',
      height: '100vh',
      backgroundColor: '#fff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Logo Section - click → Homepage */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '20px 16px',
          borderBottom: '1px solid #f1f5f9',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
        title="Về trang chủ"
      >
        <div style={{
          width: '36px',
          height: '36px',
          backgroundColor: accentColor,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5l5 3.75V19h-3v-5h-4v5H7v-9.75l5-3.75z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: accentColor, letterSpacing: '0.5px' }}>OWRMS</h1>
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          if (item.isBottom) {
            return (
              <React.Fragment key={index}>
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '12px 8px' }} />
                <NavLink item={item} isActive={isActive} accentColor={accentColor} activeBg={activeBg} />
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={index}>
              {item.section && (
                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', margin: '20px 8px 8px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  {item.section}
                </p>
              )}
              <NavLink item={item} isActive={isActive} accentColor={accentColor} activeBg={activeBg} />
            </React.Fragment>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 8px' }}>
        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', marginBottom: '4px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${accentColor}22` }}>
            <img
              src={user.avatarUrl || user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.FullName || userRole)}&background=00b2d6&color=fff`}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName || user.FullName || userRole}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280' }}>
              {userRole === 'OWNER' ? 'Chủ kho' : userRole === 'RENTER' ? 'Người thuê' : 'Quản trị kho'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#dc2626',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

const NavLink = ({ item, isActive, accentColor, activeBg }) => (
  <Link
    to={item.path}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '8px',
      textDecoration: 'none',
      color: isActive ? accentColor : '#4b5563',
      backgroundColor: isActive ? activeBg : 'transparent',
      marginBottom: '2px',
      fontWeight: isActive ? 600 : 500,
      fontSize: '0.9rem',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => {
      if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc';
    }}
    onMouseLeave={e => {
      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    {isActive && (
      <span style={{
        position: 'absolute',
        left: 0,
        width: '3px',
        height: '32px',
        backgroundColor: accentColor,
        borderRadius: '0 3px 3px 0',
      }} />
    )}
    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
    <span>{item.label}</span>
  </Link>
);

export default Sidebar;
