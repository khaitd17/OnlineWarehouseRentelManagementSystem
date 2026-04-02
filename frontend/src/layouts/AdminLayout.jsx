import React, { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Warehouse,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
  Star,
  Menu,
  X,
} from "lucide-react";
import { ToastProvider } from "../components/Toast";
import OWRMSLogo from "../components/OWRMSLogo";
import "../styles/admin.css";

const NAV_ITEMS = [
  { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Tài khoản", path: "/admin/accounts", icon: Users },
  { label: "Duyệt kho", path: "/admin/pending-warehouses", icon: ClipboardCheck, badgeKey: "pending" },
  { label: "Kho bãi", path: "/admin/warehouses", icon: Warehouse },
  { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
  { label: "Đánh giá", path: "/admin/ratings", icon: Star },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isMobile = windowWidth < 900;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { default: adminService } = await import("../services/adminService");
        const res = await adminService.getPendingWarehouses({ page: 1, pageSize: 1 });
        if (res.data.success) setPendingCount(res.data.data.totalCount || 0);
      } catch { /* silent */ }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    window.addEventListener("pendingWarehousesChanged", fetchPending);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pendingWarehousesChanged", fetchPending);
    };
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const badges = { pending: pendingCount };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const avatarUrl = user.avatarUrl
    ? `http://localhost:5276${user.avatarUrl}`
    : null;

  const goToProfile = () => navigate('/admin/profile');

  return (
    <ToastProvider>
      <div className="admin-layout">
        {/* ── Mobile Sidebar Overlay ── */}
        <div
          className={`admin-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── Sidebar ── */}
        <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="admin-sidebar-logo" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <OWRMSLogo size={32} variant="mini" />
              <span>OWRMS Admin</span>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                display: isMobile ? 'flex' : 'none',
                background: 'none', border: 'none',
                color: '#8892a4', cursor: 'pointer',
                padding: '4px', borderRadius: '6px',
                alignItems: 'center', justifyContent: 'center',
              }}
              className="admin-sidebar-close-btn"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="admin-sidebar-nav">
            <div className="admin-sidebar-section">Menu</div>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <item.icon size={18} />
                {item.label}
                {item.badgeKey && badges[item.badgeKey] > 0 && (
                  <span style={{
                    marginLeft: "auto", minWidth: 20, height: 20,
                    background: "#f59e0b", color: "#fff",
                    borderRadius: 10, fontSize: 11, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "0 6px", animation: "pulseBadge 2s ease infinite",
                  }}>
                    {badges[item.badgeKey] > 99 ? "99+" : badges[item.badgeKey]}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-avatar">
              {(user.fullName || "A").charAt(0).toUpperCase()}
            </div>
            <div className="admin-sidebar-user-info">
              <div className="admin-sidebar-user-name">
                {user.fullName || "Admin"}
              </div>
              <div className="admin-sidebar-user-role">Quản trị viên</div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", padding: 4 }}
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="admin-main">

          {/* ── Top Bar ── */}
          <header className="admin-topbar">
            {/* Hamburger (mobile only) */}
            <button
              className="admin-hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              title="Mở menu"
              style={{ display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={20} />
            </button>

            <div className="admin-topbar-left" />

            <div className="admin-topbar-right">
              {/* Bell icon */}
              <button className="admin-topbar-icon-btn" title="Thông báo">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </button>

              {/* Help icon */}
              <button className="admin-topbar-icon-btn" title="Trợ giúp">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </button>

              {/* Divider */}
              <div className="admin-topbar-divider" />

              {/* User info + Avatar Dropdown */}
              <div className="nav-user-dropdown" style={{ marginLeft: '8px' }}>
                <div className="nav-user-trigger">
                  <div className="admin-topbar-avatar" style={{ margin: 0, width: 38, height: 38, flexShrink: 0 }}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: '50%', color: '#475569', fontWeight: 600 }}>{(user.fullName || "A").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="admin-topbar-user-text" style={{ textAlign: 'left' }}>
                    <span className="admin-topbar-user-name">
                      {user.fullName || "Admin"}
                    </span>
                    <span className="admin-topbar-user-role">Quản trị viên</span>
                  </div>
                  <span className="nav-dropdown-caret" style={{ color: '#94a3b8' }}>▾</span>
                </div>

                <div className="nav-dropdown-menu">
                  <div className="nav-dropdown-user-header">
                    <div className="admin-topbar-avatar" style={{ margin: 0, width: 36, height: 36, flexShrink: 0 }}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                        />
                      ) : (
                        <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: '50%', color: '#475569', fontWeight: 600 }}>{(user.fullName || "A").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.fullName || "Admin User"}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email || ''}
                      </p>
                    </div>
                  </div>

                  <Link to="/admin/profile" className="nav-dropdown-item">Hồ sơ</Link>
                  <div className="nav-dropdown-divider" />
                  <button className="nav-dropdown-item logout" onClick={handleLogout}>Đăng xuất</button>
                </div>
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile sidebar close button style */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar-close-btn {
            display: block !important;
          }
        }
        
        /* Avatar Dropdown Styles for Light Theme */
        .nav-user-dropdown { position: relative; display: inline-flex; align-items: center; }
        .nav-user-dropdown::after { content: ''; position: absolute; top: 100%; left: -10px; right: -10px; height: 14px; z-index: 10; }
        .nav-user-dropdown:hover .nav-dropdown-menu,
        .nav-user-dropdown:focus-within .nav-dropdown-menu {
          opacity: 1; visibility: visible; transform: translateY(0); pointer-events: all;
        }
        .nav-user-trigger {
          display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; padding-right: 8px;
          border-radius: 999px; transition: background 0.2s;
        }
        .nav-user-trigger:hover { background: #f1f5f9; }
        .nav-dropdown-caret { font-size: 0.65rem; color: #94a3b8; transition: transform 0.2s; margin-left: 2px; }
        .nav-user-dropdown:hover .nav-dropdown-caret { transform: rotate(180deg); }
        .nav-dropdown-menu {
          position: absolute; top: calc(100% + 14px); right: 0; min-width: 210px;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          opacity: 0; visibility: hidden; transform: translateY(-6px);
          transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
          z-index: 2000; overflow: hidden; pointer-events: none;
        }
        .nav-dropdown-user-header {
          padding: 14px 16px 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px;
        }
        .nav-dropdown-item {
          display: block; padding: 12px 16px; font-size: 0.875rem; font-weight: 500; color: #475569;
          text-decoration: none; transition: background 0.15s, color 0.15s; cursor: pointer;
          background: transparent; border: none; width: 100%; text-align: left; font-family: 'Inter', sans-serif;
        }
        .nav-dropdown-item:hover { background: #f8fafc; color: #0284c7; }
        .nav-dropdown-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }
        .nav-dropdown-item.logout { color: #ef4444; }
        .nav-dropdown-item.logout:hover { background: #fef2f2; color: #dc2626; }
      `}</style>
    </ToastProvider>
  );
}
