import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const DASHBOARD_PATHS = [
  '/dashboard', '/my-warehouses', '/post-warehouse', '/create-warehouse',
  '/warehouse-edit', '/warehouse-new', '/owner-warehouse', '/create-staff', '/list-staff',
  '/pending-rental-requests', '/rental-request', '/owner-inventory-requests',
  '/occupancy-dashboard', '/equipment-management', '/task-scheduling',
  '/owner-audit-sessions', '/staff-audit-sessions', '/renter-audit-sessions',
  '/staff-dashboard', '/inbound-requests', '/outbound-requests',
  '/confirm-movement', '/create-inbound', '/create-outbound',
  '/renter-dashboard', '/my-rental-requests', '/renter-inbound-requests', '/renter-outbound-requests',
  '/transaction-history', '/payment-history', '/profile',
];

const NAV_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .nav-root {
    font-family: 'Inter', sans-serif;
  }

  .main-nav {
    background: linear-gradient(135deg, #0a1628 0%, #0f2442 50%, #0d1e3a 100%);
    padding: 0 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    min-height: 72px;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .main-nav.scrolled {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(10, 22, 40, 0.92);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .nav-logo img {
    height: 72px;
    width: 72px;
    object-fit: contain;
    filter: drop-shadow(0 0 8px rgba(0, 180, 255, 0.25));
    transition: filter 0.3s ease;
  }
  .nav-logo img:hover {
    filter: drop-shadow(0 0 14px rgba(0, 200, 255, 0.5));
  }

  .nav-links {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    margin-left: 1.5rem;
  }

  .nav-link {
    position: relative;
    text-decoration: none;
    color: rgba(255,255,255,0.72);
    font-weight: 500;
    font-size: 0.92rem;
    padding: 0.5rem 0.9rem;
    border-radius: 8px;
    transition: color 0.2s ease, background 0.2s ease;
    letter-spacing: 0.01em;
  }
  .nav-link:hover {
    color: #fff;
    background: rgba(255,255,255,0.08);
  }
  .nav-link.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 60%;
    height: 2px;
    background: linear-gradient(90deg, #38bdf8, #818cf8);
    border-radius: 2px;
    transition: transform 0.25s ease;
  }
  .nav-link:hover::after, .nav-link.active::after {
    transform: translateX(-50%) scaleX(1);
  }

  .nav-dashboard-link {
    text-decoration: none;
    color: rgba(255,255,255,0.75);
    font-weight: 600;
    font-size: 0.88rem;
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
    transition: color 0.2s ease, background 0.2s ease;
  }
  .nav-dashboard-link:hover {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
  }

  .btn-post {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
    color: #fff;
    padding: 0.55rem 1.25rem;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.88rem;
    letter-spacing: 0.01em;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(14, 165, 233, 0.35);
    white-space: nowrap;
  }
  .btn-post::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -60%;
    width: 50%;
    height: 200%;
    background: rgba(255,255,255,0.2);
    transform: skewX(-20deg);
    transition: left 0.4s ease;
  }
  .btn-post:hover {
    box-shadow: 0 6px 25px rgba(14, 165, 233, 0.55);
    transform: translateY(-1px);
  }
  .btn-post:hover::after {
    left: 150%;
  }

  .btn-login {
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.85);
    padding: 0.5rem 1.2rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: 'Inter', sans-serif;
  }
  .btn-login:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.6);
    color: #fff;
  }

  .btn-logout {
    background: transparent;
    border: 1.5px solid rgba(239, 68, 68, 0.35);
    color: rgba(239, 68, 68, 0.8);
    padding: 0.45rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: 'Inter', sans-serif;
  }
  .btn-logout:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  .nav-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(56, 189, 248, 0.5);
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease;
    background: #1e3a5f;
  }
  .nav-avatar:hover {
    border-color: #38bdf8;
    transform: scale(1.08);
  }

  /* Footer styles */
  .main-footer {
    background: linear-gradient(180deg, #060f1e 0%, #0a1628 100%);
    color: #fff;
    padding: 5rem 2rem 2rem;
    border-top: 1px solid rgba(255,255,255,0.06);
    position: relative;
    overflow: hidden;
  }
  .main-footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #0ea5e9, #818cf8, #0ea5e9);
    background-size: 200% 100%;
    animation: shimmerBar 4s linear infinite;
  }
  @keyframes shimmerBar {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .footer-link {
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    font-size: 0.88rem;
    transition: color 0.2s ease;
  }
  .footer-link:hover {
    color: #38bdf8;
  }
`;

const MainLayout = () => {
  const location = useLocation();
  const isDashboard = DASHBOARD_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
      setUser(JSON.parse(localStorage.getItem('user')) || {});
    };
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser({});
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  if (isDashboard) return <Outlet />;

  const userRole = (user?.systemRole || user?.role || user?.roleName || '').toUpperCase();
  const dashboardPath = userRole === 'STAFF' || userRole === 'MANAGER' ? '/staff-dashboard'
    : userRole === 'RENTER' ? '/renter-dashboard'
    : '/dashboard';

  return (
    <div className="nav-root" style={{ fontFamily: "'Inter', sans-serif", color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{NAV_STYLES}</style>

      {/* Navbar */}
      <nav className={`main-nav${scrolled ? ' scrolled' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" className="nav-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/owrms-logo.png" alt="OWRMS" />
          </Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>Trang chủ</Link>
            <Link to="/search" className={`nav-link${isActive('/search') ? ' active' : ''}`}>Tìm kiếm kho</Link>
            <Link to="/about" className={`nav-link${isActive('/about') ? ' active' : ''}`}>Về chúng tôi</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              {user && (
                <Link to={dashboardPath} className="nav-dashboard-link">Dashboard</Link>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/profile" title="Trang cá nhân">
                  <img
                    className="nav-avatar"
                    src={user?.avatarUrl || user?.AvatarUrl || 'https://www.svgrepo.com/show/5125/avatar.svg'}
                    alt="Profile"
                  />
                </Link>
                <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/post-warehouse" className="btn-post">Đăng tin cho thuê</Link>
              <button className="btn-login" onClick={() => navigate('/auth', { state: { mode: 'login' } })}>Đăng nhập</button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem'
              }}>🏭</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OWRMS</h3>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: '1.65', margin: 0 }}>
              Hệ thống quản lý và tìm kiếm kho bãi trực tuyến hàng đầu Việt Nam. Giải pháp tối ưu cho doanh nghiệp.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Liên kết</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="/" className="footer-link">Trang chủ</Link></li>
              <li><Link to="/search" className="footer-link">Tìm kiếm kho</Link></li>
              <li><Link to="/about" className="footer-link">Về chúng tôi</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hỗ trợ</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><a href="#" className="footer-link">Trung tâm hỗ trợ</a></li>
              <li><a href="#" className="footer-link">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="footer-link">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Liên hệ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#38bdf8' }}>✉</span> support@owrms.vn
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#38bdf8' }}>☎</span> 1900 xxxx
              </p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '3rem', paddingTop: '1.75rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
          © 2026 OWRMS — Online Warehouse Rental Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;