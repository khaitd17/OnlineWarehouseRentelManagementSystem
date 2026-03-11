import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// SVG Icons - clean line style matching sample
const IconGrid = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconWarehouse = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconPlusCircle = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const IconBriefcase = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconPersonAdd = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const IconBarChart = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const IconSettings = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconInbox = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);
const IconArrowRight = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="16" height="16" rx="2" ry="2" />
    <line x1="22" y1="12" x2="16" y2="12" />
    <polyline points="18 8 22 12 18 16" />
  </svg>
);
const IconArrowLeft = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="16" height="16" rx="2" ry="2" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <polyline points="6 8 2 12 6 16" />
  </svg>
);
const IconHistory = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconBox = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const Sidebar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user?.role || user?.roleName || 'OWNER').toUpperCase();

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const ownerMenus = [
    { icon: IconGrid, label: 'Overview', path: '/dashboard' },
    { icon: IconWarehouse, label: 'My Warehouses', path: '/my-warehouses' },
    { icon: IconPlusCircle, label: 'Create New Warehouse', path: '/post-warehouse' },
    { icon: IconBriefcase, label: 'Staff Management', path: '/list-staff', section: 'MANAGEMENT' },
    { icon: IconPersonAdd, label: 'Create Employee', path: '/create-staff' },
    { icon: IconBarChart, label: 'Revenue & Analytics', path: '/analytics', section: 'INSIGHTS' },
    { icon: IconSettings, label: 'Settings', path: '/settings' },
  ];

  const renterMenus = [
    { icon: IconGrid, label: 'Bảng điều khiển', path: '/renter-dashboard' },
    { icon: IconBox, label: 'Tồn kho', path: '/my-rental-requests' },
    { icon: IconArrowRight, label: 'Yêu cầu nhập', path: '/create-inbound' },
    { icon: IconArrowLeft, label: 'Yêu cầu xuất', path: '/outbound-requests' },
    { icon: IconBarChart, label: 'Báo cáo', path: '/transaction-history' },
    { icon: IconSettings, label: 'Cài đặt', path: '/settings' },
  ];

  const staffMenus = [
    { icon: IconGrid, label: 'Bảng điều khiển', path: '/staff-dashboard' },
    { icon: IconArrowRight, label: 'Nhiệm vụ Nhập kho', path: '/inbound-requests' },
    { icon: IconArrowLeft, label: 'Nhiệm vụ Xuất kho', path: '/outbound-requests' },
    { icon: IconBox, label: 'Tồn kho', path: '/inventory' },
    { icon: IconHistory, label: 'Giao dịch', path: '/transaction-history' },
    { icon: IconSettings, label: 'Cài đặt', path: '/settings' },
  ];

  const menuMap = { OWNER: ownerMenus, RENTER: renterMenus, STAFF: staffMenus };
  const menuItems = menuMap[userRole] || menuMap.OWNER;

  // Staff uses solid turquoise bg + white text for active (image 3)
  const isStaff = userRole === 'STAFF';
  const activeBg = isStaff ? '#0d9488' : '#eff6ff';
  const activeText = isStaff ? '#fff' : '#1152d4';
  const sidebarBg = isStaff ? '#fff' : '#f8fafc';

  return (
    <div style={{
      width: '240px',
      minWidth: '240px',
      height: '100vh',
      backgroundColor: sidebarBg,
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      fontFamily: 'Inter, sans-serif',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '24px 16px 0' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: userRole === 'OWNER' ? '#2563eb' : '#0d9488',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}>
          <IconWarehouse size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            {userRole === 'OWNER' ? 'WarehouseConnect' : 'OWRMS'}
          </h1>
          {userRole === 'OWNER' && (
            <p style={{ fontSize: '0.65rem', margin: '2px 0 0', color: '#6b7280', fontWeight: 600, letterSpacing: '0.05em' }}>OWNER PORTAL</p>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {menuItems.map((item, idx) => {
          const active = isActive(item.path);
          const IconComp = item.icon;
          return (
            <React.Fragment key={idx}>
              {item.section && (
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', margin: '20px 8px 10px', letterSpacing: '0.1em' }}>{item.section}</p>
              )}
              <Link
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: active ? activeText : '#475569',
                  backgroundColor: active ? activeBg : 'transparent',
                  marginBottom: '2px',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={20} color={active ? (isStaff ? '#fff' : '#1152d4') : '#64748b'} />
                </span>
                <span>{item.label}</span>
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid #e2e8f0',
        padding: '16px 12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#e0f2fe',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <img
            src={user?.avatarUrl || user?.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.FullName || 'U')}&background=0d9488&color=fff`}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.fullName || user?.FullName || 'User'}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
            {userRole === 'OWNER' ? 'Regional Director' : userRole === 'RENTER' ? 'Người thuê' : 'Quản trị kho'}
          </p>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
