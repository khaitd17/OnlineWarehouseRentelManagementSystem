import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const DASHBOARD_PATHS = [
  // Owner paths
  '/dashboard', '/my-warehouses', '/post-warehouse', '/create-warehouse',
  '/warehouse-edit', '/warehouse-new', '/owner-warehouse', '/create-staff', '/list-staff',
  '/pending-rental-requests', '/rental-request', '/owner-inventory-requests',
  '/occupancy-dashboard', '/equipment-management', '/task-scheduling',
  '/owner-audit-sessions', '/staff-audit-sessions', '/renter-audit-sessions',
  // Staff / Manager paths
  '/staff-dashboard', '/inbound-requests', '/outbound-requests',
  '/confirm-movement', '/create-inbound', '/create-outbound',
  // Renter paths
  '/renter-dashboard', '/my-rental-requests', '/renter-inbound-requests', '/renter-outbound-requests',
  // Shared paths (all roles)
  '/transaction-history', '/profile',
];

const MainLayout = () => {
  const location = useLocation();
  const isDashboard = DASHBOARD_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
      setUser(JSON.parse(localStorage.getItem('user')) || {});
    };

    window.addEventListener('authChange', handleAuthChange);
    // Also listen to storage events if login happens in another tab
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser({});
    navigate('/');
  };

  if (isDashboard) {
    return <Outlet />;
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#333', backgroundColor: '#f9fbfd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ 
        backgroundColor: '#fff', 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#00b2d6',
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
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00b2d6', letterSpacing: '0.5px' }}>OWRMS</span>
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#555', fontWeight: 500, fontSize: '0.95rem' }}>Trang chủ</Link>
            <Link to="/search" style={{ textDecoration: 'none', color: '#555', fontWeight: 500, fontSize: '0.95rem' }}>Tìm kiếm kho</Link>
            <Link to="/about" style={{ textDecoration: 'none', color: '#555', fontWeight: 500, fontSize: '0.95rem' }}>Về chúng tôi</Link>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              {/* Hiển thị link Dashboard tuỳ theo role người dùng */}
              {user && (
                <Link 
                  to={
                    (user.role || user.roleName || '').toUpperCase() === 'STAFF' || (user.role || user.roleName || '').toUpperCase() === 'MANAGER' ? '/staff-dashboard' : 
                    (user.role || user.roleName || '').toUpperCase() === 'RENTER' ? '/renter-dashboard' : 
                    '/dashboard'
                  } 
                  style={{ textDecoration: 'none', color: '#555', fontWeight: 600, fontSize: '0.9rem', marginRight: '1rem' }}>
                  Dashboard
                </Link>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/profile" title="Trang cá nhân" style={{ display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={user?.avatarUrl || user?.AvatarUrl || "https://www.svgrepo.com/show/5125/avatar.svg"} 
                    alt="Profile" 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      border: '2px solid #e2e8f0', 
                      cursor: 'pointer',
                      backgroundColor: '#f1f5f9'
                    }} 
                  />
                </Link>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#ef4444', 
                    fontWeight: 600, 
                    fontSize: '0.9rem', 
                    cursor: 'pointer'
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/post-warehouse" style={{ 
                backgroundColor: '#0095c7', 
                color: '#fff', 
                padding: '0.6rem 1.2rem', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}>
                Đăng tin cho thuê
              </Link>
              <button onClick={() => navigate('/auth', { state: { mode: 'login' } })} style={{ background: 'none', border: 'none', color: '#0095c7', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>Đăng nhập</button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#2d3748', color: '#fff', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>OWRMS</h3>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Hệ thống quản lý và tìm kiếm kho bãi trực tuyến hàng đầu Việt Nam. Giải pháp tối ưu cho doanh nghiệp.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Liên kết</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><Link to="/" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Trang chủ</Link></li>
              <li><Link to="/search" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Tìm kiếm</Link></li>
              <li><Link to="/about" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Về chúng tôi</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Hỗ trợ</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Trung tâm hỗ trợ</a></li>
              <li><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Điều khoản dịch vụ</a></li>
              <li><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Chính sách bảo mật</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Liên hệ</h4>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Email: support@owrms.vn</p>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Hotline: 1900 xxxx</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #4a5568', marginTop: '3rem', paddingTop: '2rem', textAlign: 'center', color: '#718096', fontSize: '0.85rem' }}>
          © 2026 OWRMS - Online Warehouse Rental Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;