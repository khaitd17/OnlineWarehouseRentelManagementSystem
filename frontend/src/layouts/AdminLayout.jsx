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
} from "lucide-react";
import { ToastProvider } from "../components/Toast";
import "../styles/admin.css";

const NAV_ITEMS = [
  { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Tài khoản", path: "/admin/accounts", icon: Users },
  { label: "Kho bãi", path: "/admin/warehouses", icon: Warehouse },
  // { label: "Kiểm kê", path: "/admin/audit-sessions", icon: ClipboardList },
  { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  return (
    <ToastProvider>
      <div className="admin-layout">
        {/* Sidebar */}
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
              style={{
                background: "none",
                border: "none",
                color: "#8892a4",
                cursor: "pointer",
                padding: 4,
              }}
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="admin-main">
          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
