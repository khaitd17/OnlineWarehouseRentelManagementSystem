import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import favoritesService from '../services/favoritesService';
import OWRMSLogo from '../components/OWRMSLogo';

const DASHBOARD_PATHS = [
  '/dashboard', '/my-warehouses', '/post-warehouse', '/create-warehouse',
  '/warehouse-edit', '/warehouse-new', '/owner-warehouse', '/create-staff', '/list-staff',
  '/pending-rental-requests', '/rental-request', '/owner-inventory-requests',
  '/occupancy-dashboard', '/equipment-management', '/task-scheduling',
  '/owner-audit-sessions', '/staff-audit-sessions', '/renter-audit-sessions',
  '/staff-dashboard', '/inbound-requests', '/outbound-requests',
  '/confirm-movement', '/create-inbound', '/create-outbound',
  '/renter-dashboard', '/my-rental-requests', '/my-ratings', '/my-favorites', '/renter-inbound-requests', '/renter-outbound-requests',
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

  .nav-logo {
    cursor: pointer;
  }
  .owrms-logo-svg {
    height: 64px;
    width: 64px;
    flex-shrink: 0;
    overflow: visible;
  }
  .owrms-logo-svg:hover .logo-ring-1 {
    filter: drop-shadow(0 0 6px #00d2ff);
  }
  @keyframes logo-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes logo-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  @keyframes logo-pulse-glow {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  .logo-ring-rotate {
    transform-origin: 50% 50%;
    animation: logo-spin 8s linear infinite;
  }
  .logo-icon-float {
    transform-origin: 50% 65%;
    animation: logo-float 3.5s ease-in-out infinite;
  }
  .logo-glow-pulse {
    animation: logo-pulse-glow 2.8s ease-in-out infinite;
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
    white-space: nowrap;
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
    white-space: nowrap;
  }
  .nav-dashboard-link:hover {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
  }

  .nav-favorites-link {
    text-decoration: none;
    color: #fb7185;
    font-weight: 700;
    font-size: 0.88rem;
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
    border: 1.5px solid rgba(251,113,133,0.3);
    display: flex;
    align-items: center;
    gap: 5px;
    position: relative;
    transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    white-space: nowrap;
  }
  .nav-favorites-link:hover {
    background: rgba(251,113,133,0.1);
    border-color: rgba(251,113,133,0.6);
    color: #f43f5e;
  }
  .nav-favorites-badge {
    background: #fb7185;
    color: #fff;
    border-radius: 9px;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 1px 5px;
    min-width: 16px;
    text-align: center;
    line-height: 1.4;
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
    white-space: nowrap;
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
    white-space: nowrap;
  }
  .btn-logout:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  .nav-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2.5px solid rgba(56, 189, 248, 0.55);
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    background: #1e3a5f;
    flex-shrink: 0;
    display: block;
  }
  .nav-avatar:hover {
    border-color: #38bdf8;
    transform: scale(1.07);
    box-shadow: 0 0 0 4px rgba(56,189,248,0.15);
  }

  /* ── Avatar Dropdown ── */
  .nav-user-dropdown {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  /* invisible bridge fills the gap between trigger and menu */
  .nav-user-dropdown::after {
    content: '';
    position: absolute;
    top: 100%;
    left: -10px;
    right: -10px;
    height: 14px;
  }
  .nav-user-dropdown:hover .nav-dropdown-menu,
  .nav-user-dropdown:focus-within .nav-dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: all;
  }
  .nav-user-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 4px 6px 4px 4px;
    border-radius: 999px;
    transition: background 0.2s;
  }
  .nav-user-trigger:hover {
    background: rgba(255,255,255,0.06);
  }
  .nav-user-trigger-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
    line-height: 1.1;
  }
  .nav-user-trigger-sub {
    font-size: 0.7rem;
    color: rgba(56,189,248,0.75);
    font-weight: 500;
    line-height: 1;
  }
  .nav-dropdown-caret {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
    transition: transform 0.2s;
    margin-left: 2px;
  }
  .nav-user-dropdown:hover .nav-dropdown-caret {
    transform: rotate(180deg);
  }
  .nav-dropdown-menu {
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    min-width: 210px;
    background: rgba(13, 22, 45, 0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(56,189,248,0.12);
    border-radius: 14px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(56,189,248,0.05);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    z-index: 2000;
    overflow: hidden;
    pointer-events: none;
  }
  /* remove old ::before bridge (now handled by parent ::after) */
  .nav-dropdown-menu::before { display: none; }
  .nav-dropdown-user-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nav-dropdown-user-header img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(56,189,248,0.4);
    flex-shrink: 0;
  }
  .nav-dropdown-item {
    display: block;
    padding: 12px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(210,230,255,0.85);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
    cursor: pointer;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    font-family: 'Inter', sans-serif;
  }
  .nav-dropdown-item:hover {
    background: rgba(56,189,248,0.08);
    color: #38bdf8;
  }
  .nav-dropdown-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 4px 0;
  }
  .nav-dropdown-item.logout {
    color: rgba(239,68,68,0.85);
  }
  .nav-dropdown-item.logout:hover {
    background: rgba(239,68,68,0.08);
    color: #ef4444;
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

  /* ── Nav Hamburger (Mobile) ── */
  .nav-hamburger {
    display: none;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    color: rgba(255,255,255,0.8);
    transition: background 0.2s ease;
    flex-shrink: 0;
  }
  .nav-hamburger:hover {
    background: rgba(255,255,255,0.08);
  }
  .nav-hamburger .material-symbols-outlined {
    font-size: 26px;
  }

  /* ── Mobile Drawer Overlay ── */
  .mobile-nav-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 1998;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
  }
  .mobile-nav-overlay.open {
    display: block;
  }

  /* ── Mobile Drawer Panel ── */
  .mobile-nav-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    max-width: 85vw;
    background: linear-gradient(180deg, #0a1628 0%, #0d1e3a 100%);
    z-index: 1999;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    overflow-y: auto;
  }
  .mobile-nav-drawer.open {
    transform: translateX(0);
    box-shadow: -8px 0 32px rgba(0,0,0,0.4);
  }
  .mobile-nav-drawer .drawer-close {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1.5rem;
  }
  .mobile-nav-drawer .drawer-close button {
    background: rgba(255,255,255,0.08);
    border: none;
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .mobile-nav-drawer .drawer-close button:hover {
    background: rgba(255,255,255,0.15);
    color: #fff;
  }
  .mobile-nav-drawer .drawer-nav-link {
    display: block;
    text-decoration: none;
    color: rgba(255,255,255,0.75);
    font-weight: 500;
    font-size: 1rem;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    transition: color 0.2s, background 0.2s;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .mobile-nav-drawer .drawer-nav-link:hover,
  .mobile-nav-drawer .drawer-nav-link.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
  }
  .mobile-nav-drawer .drawer-divider {
    height: 1px;
    background: rgba(255,255,255,0.08);
    margin: 1rem 0;
  }
  .mobile-nav-drawer .drawer-actions {
    margin-top: auto;
    padding-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* ── Responsive Breakpoints ── */
  @media (max-width: 900px) {
    .main-nav {
      padding: 0 1rem;
      min-height: 60px;
    }
    .nav-links {
      display: none;
    }
    .nav-hamburger {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-right-desktop {
      display: none;
    }
    .nav-logo img {
      height: 52px;
      width: 52px;
    }
  }
  @media (min-width: 901px) {
    .mobile-nav-overlay,
    .mobile-nav-drawer {
      display: none !important;
    }
  }
`;

const MainLayout = () => {
  const location = useLocation();
  const isDashboard = DASHBOARD_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const [favoritesCount, setFavoritesCount] = useState(() => favoritesService.count());

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 900;

  useEffect(() => {
    const handler = () => setFavoritesCount(favoritesService.count());
    window.addEventListener('favoritesChanged', handler);
    return () => window.removeEventListener('favoritesChanged', handler);
  }, []);

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

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

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
  const warehouseCtx = (() => { try { return JSON.parse(localStorage.getItem('warehouseContext') || '{}'); } catch { return {}; } })();
  const warehouseRoles = (warehouseCtx.warehouses || []).map(w => (w.role || '').toUpperCase());
  const ROLE_PRIORITY = ['OWNER', 'OPERATOR', 'MANAGER', 'STAFF', 'RENTER'];
  const effectiveRole = (() => {
    const sysRole = (warehouseCtx.systemRole || user?.role || user?.roleName || '').toUpperCase();
    if (sysRole === 'ADMIN') return 'ADMIN';
    for (const r of ROLE_PRIORITY) { if (warehouseRoles.includes(r)) return r; }
    if (sysRole === 'RENTER' && !warehouseRoles.includes('RENTER')) return 'USER';
    return sysRole || userRole || 'USER';
  })();
  const isRenter = effectiveRole === 'RENTER';
  const dashboardPath = effectiveRole === 'STAFF' || effectiveRole === 'MANAGER' ? '/staff-dashboard'
    : effectiveRole === 'RENTER' ? '/renter-dashboard'
    : '/dashboard';

  return (
    <div className="nav-root" style={{ fontFamily: "'Inter', sans-serif", color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{NAV_STYLES}</style>

      {/* === Mobile Nav Overlay === */}
      <div
        className={`mobile-nav-overlay${mobileNavOpen ? ' open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* === Mobile Nav Drawer === */}
      <div className={`mobile-nav-drawer${mobileNavOpen ? ' open' : ''}`}>
        <div className="drawer-close">
          <button onClick={() => setMobileNavOpen(false)}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>
        </div>

        {/* Logo (mobile drawer) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <OWRMSLogo size={40} variant="mini" />
          <span style={{ fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OWRMS</span>
        </div>

        {/* Nav links */}
        <Link to="/" className={`drawer-nav-link${isActive('/') ? ' active' : ''}`}>Trang chủ</Link>
        <Link to="/search" className={`drawer-nav-link${isActive('/search') ? ' active' : ''}`}>Tìm kiếm kho</Link>
        <Link to="/ai-analyzer" className={`drawer-nav-link${isActive('/ai-analyzer') ? ' active' : ''}`}>AI Phân Tích Đồ Vật</Link>
        <Link to="/about" className={`drawer-nav-link${isActive('/about') ? ' active' : ''}`}>Về chúng tôi</Link>

        <div className="drawer-divider" />

        {isAuthenticated ? (
          <>
            <Link to={dashboardPath} className="drawer-nav-link">📊 Dashboard</Link>
            {dashboardPath === '/renter-dashboard' && (
              <Link to="/my-favorites" className="drawer-nav-link" style={{ color: '#fb7185' }}>
                ❤️ Yêu thích {favoritesCount > 0 && `(${favoritesCount})`}
              </Link>
            )}
            <Link to="/profile" className="drawer-nav-link">👤 Trang cá nhân</Link>
            <div className="drawer-divider" />
            <div className="drawer-actions">
              <button
                className="btn-logout"
                style={{ width: '100%', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          </>
        ) : (
          <div className="drawer-actions">
            <Link to="/post-warehouse" className="btn-post" style={{ textAlign: 'center', display: 'block' }}>Đăng tin cho thuê</Link>
            <button className="btn-login" style={{ width: '100%' }} onClick={() => navigate('/auth', { state: { mode: 'login' } })}>Đăng nhập</button>
          </div>
        )}
      </div>

      {/* === Navbar === */}
      <nav className={`main-nav${scrolled ? ' scrolled' : ''}`}>
        {/* Left: Logo + Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Link to="/" className="nav-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <OWRMSLogo size={64} variant="mini" />
          </Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>Trang chủ</Link>
            <Link to="/search" className={`nav-link${isActive('/search') ? ' active' : ''}`}>Tìm kiếm kho</Link>
            <Link to="/ai-analyzer" className={`nav-link nav-ai-link${isActive('/ai-analyzer') ? ' active' : ''}`}>AI Phân Tích Đồ Vật</Link>
            <Link to="/about" className={`nav-link${isActive('/about') ? ' active' : ''}`}>Về chúng tôi</Link>
          </div>
        </div>

        {/* Right Desktop: Auth buttons (hidden on mobile) */}
        <div
          className="nav-right-desktop"
          style={{ display: isMobile ? 'none' : 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          {isAuthenticated ? (
            <>

              {user && (
                <div className="nav-user-dropdown">
                  {/* Trigger */}
                  <div className="nav-user-trigger">
                    <img
                      className="nav-avatar"
                      src={user?.avatarUrl || user?.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName||user?.FullName||'U')}&background=0ea5e9&color=fff`}
                      alt="Avatar"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="nav-user-trigger-name">
                        Xin chào, {(user?.fullName || user?.FullName || 'Bạn').split(' ').slice(-2).join(' ')}
                      </span>
                    </div>
                    <span className="nav-dropdown-caret">▾</span>
                  </div>

                  {/* Dropdown */}
                  <div className="nav-dropdown-menu">
                    {/* User header */}
                    <div className="nav-dropdown-user-header">
                      <img
                        src={user?.avatarUrl || user?.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName||user?.FullName||'U')}&background=0ea5e9&color=fff`}
                        alt="Avatar"
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'rgba(220,235,255,0.95)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.fullName || user?.FullName || 'Người dùng'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(56,189,248,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.email || ''}
                        </p>
                      </div>
                    </div>

                    {/* Hồ sơ */}
                    <Link to="/profile" className="nav-dropdown-item">
                      Hồ sơ
                    </Link>

                    {/* Dashboard */}
                    <Link to={dashboardPath} className="nav-dropdown-item">
                      Dashboard
                    </Link>

                    {/* Kho yêu thích - chỉ hiện với Renter */}
                    {isRenter && (
                      <Link to="/my-favorites" className="nav-dropdown-item">
                        Kho yêu thích
                      </Link>
                    )}

                    <div className="nav-dropdown-divider" />

                    {/* Đăng xuất */}
                    <button className="nav-dropdown-item logout" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/post-warehouse" className="btn-post">Đăng tin cho thuê</Link>
              <button className="btn-login" onClick={() => navigate('/auth', { state: { mode: 'login' } })}>Đăng nhập</button>
            </>
          )}
        </div>

        {/* Right Mobile: Hamburger (only on mobile) */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Mở menu"
          style={{ display: isMobile ? 'flex' : 'none' }}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <OWRMSLogo size={40} variant="mini" />
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
              <li><Link to="/ai-analyzer" className="footer-link">AI Phân Tích Đồ Vật</Link></li>
              <li><Link to="/about" className="footer-link">Về chúng tôi</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hỗ trợ</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><span className="footer-link" style={{cursor:'pointer'}}>Trung tâm hỗ trợ</span></li>
              <li><span className="footer-link" style={{cursor:'pointer'}}>Điều khoản dịch vụ</span></li>
              <li><span className="footer-link" style={{cursor:'pointer'}}>Chính sách bảo mật</span></li>
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
