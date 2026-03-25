import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Warehouse,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Star,
} from "lucide-react";
import { ToastProvider } from "../components/Toast";
import "../styles/admin.css";

const NAV_ITEMS = [
  { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Tài khoản", path: "/admin/accounts", icon: Users },
  { label: "Kho bãi", path: "/admin/warehouses", icon: Warehouse },
  // { label: "Kiểm kê", path: "/admin/audit-sessions", icon: ClipboardList },
  { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
  { label: "Đánh giá", path: "/admin/ratings", icon: Star },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
        {/* ── Sidebar ── */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <Settings size={20} />
            <span>OWRMS Admin</span>
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

              {/* User info + Avatar */}
              <div
                className="admin-topbar-user"
                onClick={goToProfile}
                title="Xem hồ sơ cá nhân"
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-topbar-user-text">
                  <span className="admin-topbar-user-name">
                    {user.fullName || "Admin User"}
                  </span>
                  <span className="admin-topbar-user-role">Quản trị viên</span>
                </div>
                <div className="admin-topbar-avatar">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    <span>{(user.fullName || "A").charAt(0).toUpperCase()}</span>
                  )}
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
    </ToastProvider>
  );
}
