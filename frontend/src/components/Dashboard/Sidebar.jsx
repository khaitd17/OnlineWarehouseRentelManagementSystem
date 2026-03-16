import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

/* ── Cấu hình menu theo warehouse role ────────────────────────── */
const MENU_BY_ROLE = {
  OWNER: [
    { icon: 'dashboard',      label: 'Tổng quan',          path: '/dashboard' },
    { icon: 'add_circle',     label: 'Tạo kho mới',        path: '/create-warehouse' },
    { icon: 'donut_large',    label: 'Biểu đồ công suất',   path: '/occupancy-dashboard' },
    { icon: 'warehouse',      label: 'Kho của tôi',        path: '/my-warehouses' },
    { icon: 'inventory_2',    label: 'Yêu cầu nhập/xuất',  path: '/owner-inventory-requests', section: 'YÊU CẦU' },
    { icon: 'pending_actions',label: 'Yêu cầu thuê kho',   path: '/pending-rental-requests' },
    { icon: 'group',          label: 'Quản lý nhân viên',  path: '/list-staff',       section: 'NHÂN SỰ' },
    { icon: 'person_add',     label: 'Thêm nhân viên',     path: '/create-staff' },
    { icon: 'calendar_month', label: 'Lịch công việc',     path: '/task-scheduling',  section: 'VẬN HÀNH' },
    { icon: 'precision_manufacturing', label: 'Quản lý thiết bị', path: '/equipment-management' },
    { icon: 'settings',       label: 'Cài đặt',            path: '/settings',         isBottom: true },
  ],
  USER: [
    { icon: 'dashboard',      label: 'Tổng quan',          path: '/dashboard' },
    { icon: 'add_circle',     label: 'Tạo kho mới',        path: '/create-warehouse' },
    { icon: 'donut_large',    label: 'Biểu đồ công suất',   path: '/occupancy-dashboard' },
    { icon: 'warehouse',      label: 'Kho của tôi',        path: '/my-warehouses' },
    { icon: 'inventory_2',    label: 'Yêu cầu nhập/xuất',  path: '/owner-inventory-requests', section: 'YÊU CẦU' },
    { icon: 'pending_actions',label: 'Yêu cầu thuê kho',   path: '/pending-rental-requests' },
    { icon: 'group',          label: 'Quản lý nhân viên',  path: '/list-staff',       section: 'NHÂN SỰ' },
    { icon: 'person_add',     label: 'Thêm nhân viên',     path: '/create-staff' },
    { icon: 'calendar_month', label: 'Lịch công việc',     path: '/task-scheduling',  section: 'VẬN HÀNH' },
    { icon: 'precision_manufacturing', label: 'Quản lý thiết bị', path: '/equipment-management' },
    { icon: 'settings',       label: 'Cài đặt',            path: '/settings',         isBottom: true },
  ],
  OPERATOR: [
    { icon: 'dashboard',      label: 'Tổng quan',          path: '/dashboard' },
    { icon: 'add_circle',     label: 'Tạo kho mới',        path: '/create-warehouse' },
    { icon: 'donut_large',    label: 'Biểu đồ công suất',   path: '/occupancy-dashboard' },
    { icon: 'warehouse',      label: 'Kho của tôi',        path: '/my-warehouses' },
    { icon: 'inventory_2',    label: 'Yêu cầu nhập/xuất',  path: '/owner-inventory-requests', section: 'YÊU CẦU' },
    { icon: 'pending_actions',label: 'Yêu cầu thuê kho',   path: '/pending-rental-requests' },
    { icon: 'group',          label: 'Quản lý nhân viên',  path: '/list-staff',       section: 'NHÂN SỰ' },
    { icon: 'person_add',     label: 'Thêm nhân viên',     path: '/create-staff' },
    { icon: 'calendar_month', label: 'Lịch công việc',     path: '/task-scheduling',  section: 'VẬN HÀNH' },
    { icon: 'precision_manufacturing', label: 'Quản lý thiết bị', path: '/equipment-management' },
    { icon: 'settings',       label: 'Cài đặt',            path: '/settings',         isBottom: true },
  ],
  MANAGER: [
    { icon: 'dashboard',       label: 'Tổng quan',         path: '/dashboard' },
    { icon: 'group',           label: 'Quản lý nhân viên', path: '/list-staff',       section: 'NHÂN SỰ' },
    { icon: 'person_add',      label: 'Thêm nhân viên',    path: '/create-staff' },
    { icon: 'calendar_month',  label: 'Lịch công việc',    path: '/task-scheduling',  section: 'VẬN HÀNH' },
    { icon: 'precision_manufacturing', label: 'Quản lý thiết bị', path: '/equipment-management' },
    { icon: 'move_to_inbox',   label: 'Nhập kho',          path: '/inbound-requests', section: 'KHO' },
    { icon: 'outbox',          label: 'Xuất kho',          path: '/outbound-requests' },
    { icon: 'history',         label: 'Lịch sử giao dịch', path: '/transaction-history' },
    { icon: 'settings',        label: 'Cài đặt',           path: '/settings',         isBottom: true },
  ],
  STAFF: [
    { icon: 'dashboard',    label: 'Bảng điều khiển',     path: '/staff-dashboard' },
    { icon: 'move_to_inbox',label: 'Yêu cầu nhập kho',   path: '/inbound-requests' },
    { icon: 'outbox',       label: 'Yêu cầu xuất kho',   path: '/outbound-requests' },
    { icon: 'swap_horiz',   label: 'Xác nhận di chuyển', path: '/confirm-movement' },
    { icon: 'precision_manufacturing', label: 'Quản lý thiết bị', path: '/equipment-management' },
    { icon: 'history',      label: 'Lịch sử giao dịch',  path: '/transaction-history' },
    { icon: 'settings',     label: 'Cài đặt',             path: '/settings',         isBottom: true },
  ],
  RENTER: [
    { icon: 'dashboard',    label: 'Bảng điều khiển',    path: '/renter-dashboard' },
    { icon: 'move_to_inbox',label: 'Yêu cầu nhập kho',  path: '/renter-inbound-requests' },
    { icon: 'outbox',       label: 'Yêu cầu xuất kho',  path: '/renter-outbound-requests' },
    { icon: 'add_circle',   label: 'Tạo yêu cầu nhập',  path: '/create-inbound' },
    { icon: 'upload',       label: 'Tạo yêu cầu xuất',  path: '/create-outbound' },
    { icon: 'history',      label: 'Lịch sử giao dịch', path: '/transaction-history' },
    { icon: 'settings',     label: 'Cài đặt',            path: '/settings',         isBottom: true },
  ],
  ADMIN: [
    { icon: 'admin_panel_settings', label: 'Quản trị', path: '/admin' },
  ],
};

const ROLE_PRIORITY = ['OWNER', 'OPERATOR', 'MANAGER', 'STAFF'];

/* ── Label hiển thị role ──────────────────────────────────────── */
const ROLE_LABEL = {
  OWNER:    'Chủ kho',
  OPERATOR: 'Điều phối viên',
  MANAGER:  'Quản lý kho',
  STAFF:    'Nhân viên kho',
  RENTER:   'Người thuê kho',
  ADMIN:    'Quản trị viên',
  USER:     'Người dùng',
};

const Sidebar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const systemRole = (user.role || user.roleName || '').toUpperCase();

  const [warehouseRole, setWarehouseRole] = useState(null); // role cao nhất từ warehouse membership
  const [loading,        setLoading]       = useState(true);

  useEffect(() => {
    if (systemRole === 'ADMIN') { setLoading(false); return; }
    if (systemRole === 'RENTER') { setLoading(false); return; }

    axiosClient.get('/staff/my-warehouses')
      .then(res => {
        const list = res.data || [];
        for (const r of ROLE_PRIORITY) {
          if (list.some(w => w.roleCode === r)) {
            setWarehouseRole(r);
            return;
          }
        }
        // If no specifically prioritized warehouse role is found, don't force 'STAFF'
        // This allows the systemRole (like USER or OWNER) to take precedence.
      })
      .catch(() => setWarehouseRole(null))
      .finally(() => setLoading(false));
  }, [systemRole]);

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
      { icon: 'fact_check', label: 'Kiểm kê kho', path: '/owner-audit-sessions' },
      { icon: 'bar_chart', label: 'Phân tích doanh thu', path: '/analytics', section: 'BÁO CÁO' },
      { icon: 'settings', label: 'Cài đặt', path: '/settings', isBottom: true },
    ],
    RENTER: [
      { icon: 'dashboard', label: 'Bảng điều khiển', path: '/renter-dashboard' },
      { icon: 'move_to_inbox', label: 'Yêu cầu nhập kho', path: '/renter-inbound-requests' },
      { icon: 'outbox', label: 'Yêu cầu xuất kho', path: '/renter-outbound-requests' },
      { icon: 'add_circle', label: 'Tạo yêu cầu nhập', path: '/create-inbound' },
      { icon: 'upload', label: 'Tạo yêu cầu xuất', path: '/create-outbound' },
      { icon: 'fact_check', label: 'Kiểm kê kho', path: '/renter-audit-sessions' },
      { icon: 'bar_chart', label: 'Báo cáo', path: '/transaction-history' },
      { icon: 'settings', label: 'Cài đặt', path: '/settings', isBottom: true },
    ],
    STAFF: [
      { icon: 'dashboard', label: 'Bảng điều khiển', path: '/staff-dashboard' },
      { icon: 'move_to_inbox', label: 'Yêu cầu nhập kho', path: '/inbound-requests' },
      { icon: 'outbox', label: 'Yêu cầu xuất kho', path: '/outbound-requests' },
      { icon: 'swap_horiz', label: 'Xác nhận di chuyển', path: '/confirm-movement' },
      { icon: 'fact_check', label: 'Kiểm kê kho', path: '/staff-audit-sessions' },
      { icon: 'history', label: 'Lịch sử giao dịch', path: '/transaction-history' },
      { icon: 'settings', label: 'Cài đặt', path: '/settings', isBottom: true },
    ],
  };

  allMenus['MANAGER'] = allMenus['STAFF'];
  /* Chọn menu theo ưu tiên: ADMIN > warehouseRole > systemRole > STAFF */
  let effectiveRole;
  if (systemRole === 'ADMIN') {
    effectiveRole = 'ADMIN';
  } else if (systemRole === 'RENTER') {
    effectiveRole = 'RENTER';
  } else {
    effectiveRole = warehouseRole || systemRole || 'STAFF';
  }

  const menuItems = MENU_BY_ROLE[effectiveRole] || MENU_BY_ROLE['STAFF'];
  const displayRole = ROLE_LABEL[effectiveRole] || effectiveRole;
  const accentColor = '#00b2d6';
  const activeBg    = '#e0f2fe';

  return (
    <div style={{
      width: '240px', height: '100vh', backgroundColor: '#fff',
      borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, fontFamily: 'Inter, sans-serif',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '20px 16px', borderBottom: '1px solid #f1f5f9',
        textDecoration: 'none', cursor: 'pointer',
      }} title="Về trang chủ">
        <div style={{
          width: '36px', height: '36px', backgroundColor: accentColor,
          borderRadius: '10px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5l5 3.75V19h-3v-5h-4v5H7v-9.75l5-3.75z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: accentColor, letterSpacing: '0.5px' }}>OWRMS</h1>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {loading ? (
          <p style={{ fontSize: '0.78rem', color: '#9ca3af', padding: '16px 12px' }}>Đang tải...</p>
        ) : (
          menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            if (item.isBottom) return (
              <React.Fragment key={idx}>
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '12px 8px' }} />
                <NavLink item={item} isActive={isActive} accentColor={accentColor} activeBg={activeBg} />
              </React.Fragment>
            );
            return (
              <React.Fragment key={idx}>
                {item.section && (
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', margin: '20px 8px 8px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    {item.section}
                  </p>
                )}
                <NavLink item={item} isActive={isActive} accentColor={accentColor} activeBg={activeBg} />
              </React.Fragment>
            );
          })
        )}
      </nav>

      {/* User Info + Logout */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', marginBottom: '4px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${accentColor}22` }}>
            <img
              src={user.avatarUrl || user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.FullName || 'User')}&background=00b2d6&color=fff`}
              alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName || user.FullName || 'Người dùng'}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280' }}>{displayRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
            padding: '10px 12px', borderRadius: '8px', border: 'none',
            backgroundColor: 'transparent', color: '#dc2626',
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
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
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
      color: isActive ? accentColor : '#4b5563',
      backgroundColor: isActive ? activeBg : 'transparent',
      marginBottom: '2px', fontWeight: isActive ? 600 : 500,
      fontSize: '0.9rem', transition: 'all 0.15s', position: 'relative',
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    {isActive && (
      <span style={{
        position: 'absolute', left: 0, width: '3px', height: '32px',
        backgroundColor: accentColor, borderRadius: '0 3px 3px 0',
      }} />
    )}
    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
    <span>{item.label}</span>
  </Link>
);

export default Sidebar;
