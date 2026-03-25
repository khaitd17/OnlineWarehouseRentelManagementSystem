import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/authService";

/* ── Menu definitions per warehouse role ── */
const MENU_BY_ROLE = {
  // Chủ kho / Điều phối viên: quản lý toàn bộ kho
  OWNER: [
    { icon: "dashboard",               label: "Tổng quan",           path: "/owner-dashboard" },
    { icon: "donut_large",             label: "Biểu đồ công suất",   path: "/occupancy-dashboard" },
    { icon: "warehouse",               label: "Kho của tôi",         path: "/my-warehouses" },
    { icon: "inventory_2",             label: "Yêu cầu nhập/xuất",   path: "/owner-inventory-requests", section: "YÊU CẦU" },
    { icon: "fact_check",              label: "Kiểm kê kho",         path: "/owner-audit-sessions" },
    { icon: "pending_actions",         label: "Yêu cầu thuê kho",    path: "/pending-rental-requests" },
    { icon: "receipt_long",            label: "Lịch sử thanh toán",  path: "/payment-history",       section: "TÀI CHÍNH" },
    { icon: "group",                   label: "Quản lý nhân viên",   path: "/list-staff",            section: "NHÂN SỰ" },
    { icon: "person_add",              label: "Thêm nhân viên",      path: "/create-staff" },
    { icon: "schedule",                label: "Phân ca",             path: "/shift-scheduling",      section: "VẬN HÀNH" },
    { icon: "calendar_month",          label: "Lịch công việc",      path: "/task-scheduling" },
    { icon: "precision_manufacturing", label: "Quản lý thiết bị",    path: "/equipment-management" },
    { icon: "settings",                label: "Cài đặt",             path: "/settings",              isBottom: true },
  ],
  // Quản lý kho / Điều phối viên dùng cùng menu với OWNER (có quản lý nhân viên)
  OPERATOR: [
    { icon: "dashboard",               label: "Tổng quan",           path: "/owner-dashboard" },
    { icon: "donut_large",             label: "Biểu đồ công suất",   path: "/occupancy-dashboard" },
    { icon: "warehouse",               label: "Kho của tôi",         path: "/my-warehouses" },
    { icon: "inventory_2",             label: "Yêu cầu nhập/xuất",   path: "/owner-inventory-requests", section: "YÊU CẦU" },
    { icon: "fact_check",              label: "Kiểm kê kho",         path: "/owner-audit-sessions" },
    { icon: "pending_actions",         label: "Yêu cầu thuê kho",    path: "/pending-rental-requests" },
    { icon: "receipt_long",            label: "Lịch sử thanh toán",  path: "/payment-history",       section: "TÀI CHÍNH" },
    { icon: "group",                   label: "Quản lý nhân viên",   path: "/list-staff",            section: "NHÂN SỰ" },
    { icon: "person_add",              label: "Thêm nhân viên",      path: "/create-staff" },
    { icon: "schedule",                label: "Phân ca",             path: "/shift-scheduling",      section: "VẬN HÀNH" },
    { icon: "calendar_month",          label: "Lịch công việc",      path: "/task-scheduling" },
    { icon: "precision_manufacturing", label: "Quản lý thiết bị",    path: "/equipment-management" },
    { icon: "settings",                label: "Cài đặt",             path: "/settings",              isBottom: true },
  ],
  // Quản lý: có quản lý nhân viên + làm việc kho
  MANAGER: [
    { icon: "dashboard",               label: "Bảng điều khiển",       path: "/staff-dashboard" },
    { icon: "group",                   label: "Quản lý nhân viên",     path: "/list-staff",            section: "NHÂN SỰ" },
    { icon: "person_add",              label: "Thêm nhân viên",        path: "/create-staff" },
    { icon: "schedule",                label: "Phân ca",               path: "/shift-scheduling" },
    { icon: "calendar_month",          label: "Lịch công việc",        path: "/task-scheduling" },
    { icon: "fact_check",              label: "Kiểm kê kho",           path: "/staff-audit-sessions",  section: "KHO" },
    { icon: "inventory_2",             label: "Yêu cầu nhập / xuất kho", path: "/staff-inventory-requests" },
    { icon: "history",                 label: "Lịch sử nhập/ xuất kho",   path: "/transaction-history" },
    { icon: "precision_manufacturing", label: "Quản lý thiết bị",      path: "/equipment-management" },
    { icon: "settings",                label: "Cài đặt",               path: "/settings",              isBottom: true },
  ],
  // Nhân viên: chỉ làm chức năng kho, không quản lý người
  STAFF: [
    { icon: "dashboard",               label: "Bảng điều khiển",          path: "/staff-dashboard" },
    { icon: "swap_horiz",              label: "Xác nhận di chuyển",       path: "/confirm-movement",         section: "KHO" },
    { icon: "fact_check",              label: "Kiểm kê kho",              path: "/staff-audit-sessions" },
    { icon: "calendar_month",          label: "Lịch của tôi",             path: "/my-schedule",              section: "CÁ NHÂN" },
    { icon: "precision_manufacturing", label: "Quản lý thiết bị",         path: "/equipment-management" },
    { icon: "settings",                label: "Cài đặt",                  path: "/settings",                 isBottom: true },
  ],
  // Người thuê kho
  RENTER: [
    { icon: "description",             label: "Hợp đồng của tôi",    path: "/my-contracts" },
    { icon: "list_alt",                label: "Yêu cầu thuê kho",   path: "/my-rental-requests" },
    { icon: "move_to_inbox",           label: "Yêu cầu nhập kho",    path: "/renter-inbound-requests",  section: "KHO" },
    { icon: "outbox",                  label: "Yêu cầu xuất kho",    path: "/renter-outbound-requests" },
    { icon: "add_circle",              label: "Tạo yêu cầu nhập",    path: "/create-inbound" },
    { icon: "upload",                  label: "Tạo yêu cầu xuất",    path: "/create-outbound" },
    { icon: "fact_check",              label: "Kiểm kê kho",         path: "/renter-audit-sessions" },
    { icon: "receipt_long",            label: "Lịch sử thanh toán",  path: "/payment-history",       section: "TÀI CHÍNH" },
    { icon: "settings",                label: "Cài đặt",             path: "/settings",              isBottom: true },
  ],
  // Người dùng thường chưa có kho
  USER: [
    { icon: "search",                  label: "Tìm kho thuê",        path: "/search" },
    { icon: "description",             label: "Hợp đồng của tôi",    path: "/my-contracts" },
    { icon: "list_alt",                label: "Yêu cầu thuê",        path: "/my-rental-requests" },
    { icon: "settings",                label: "Cài đặt",             path: "/settings",              isBottom: true },
  ],
  // Admin hệ thống
  ADMIN: [
    { icon: "admin_panel_settings",    label: "Quản trị viên",       path: "/admin" },
    { icon: "settings",                label: "Cài đặt",             path: "/settings",              isBottom: true },
  ],
};

const ROLE_LABEL = {
  OWNER:    "Chủ kho",
  OPERATOR: "Điều phối viên",
  MANAGER:  "Quản lý kho",
  STAFF:    "Nhân viên kho",
  RENTER:   "Người thuê kho",
  ADMIN:    "Quản trị viên",
  USER:     "Người dùng",
};

// Priority: who gets which menu when user has multiple warehouse roles
const ROLE_PRIORITY = ["OWNER", "OPERATOR", "MANAGER", "STAFF", "RENTER"];

/**
 * Pick the highest-priority warehouse role from warehouseContext.warehouses.
 * Falls back to systemRole if no warehouse membership found.
 */
function resolveEffectiveRole(systemRole, warehouses) {
  if (systemRole === "admin") return "ADMIN";

  // Check warehouse roles in priority order
  const warehouseRoles = (warehouses || []).map(w => (w.role || "").toUpperCase());
  for (const r of ROLE_PRIORITY) {
    if (warehouseRoles.includes(r)) return r;
  }

  // No warehouse membership → check systemRole (e.g. RENTER, OWNER)
  const sr = (systemRole || "").toUpperCase();
  if (MENU_BY_ROLE[sr]) return sr;

  return "USER";
}

const Sidebar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();

  const [effectiveRole, setEffectiveRole] = useState("USER");
  const [displayName,   setDisplayName]   = useState("Người dùng");
  const [avatarSrc,     setAvatarSrc]     = useState("");

  useEffect(() => {
    const user = authService.getCurrentUser() || {};
    const ctx  = authService.getWarehouseContext() || {};
    const systemRole  = (ctx.systemRole || user.role || user.roleName || "user").toLowerCase();
    const warehouses  = ctx.warehouses || [];
    const name        = user.fullName || user.FullName || ctx.name || "Người dùng";
    const avatar      = user.avatarUrl || user.AvatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00b2d6&color=fff`;

    setEffectiveRole(resolveEffectiveRole(systemRole, warehouses));
    setDisplayName(name);
    setAvatarSrc(avatar);
  }, []);

  // Also re-resolve when authChange fires (login/logout)
  useEffect(() => {
    const handler = () => {
      const user = authService.getCurrentUser() || {};
      const ctx  = authService.getWarehouseContext() || {};
      const systemRole = (ctx.systemRole || user.role || user.roleName || "user").toLowerCase();
      const warehouses = ctx.warehouses || [];
      const name       = user.fullName || user.FullName || ctx.name || "Người dùng";
      const avatar     = user.avatarUrl || user.AvatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00b2d6&color=fff`;
      setEffectiveRole(resolveEffectiveRole(systemRole, warehouses));
      setDisplayName(name);
      setAvatarSrc(avatar);
    };
    window.addEventListener("authChange", handler);
    return () => window.removeEventListener("authChange", handler);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.dispatchEvent(new Event("authChange"));
    navigate("/auth");
  };

  const menuItems  = MENU_BY_ROLE[effectiveRole] || MENU_BY_ROLE["USER"];
  const displayRole = ROLE_LABEL[effectiveRole] || effectiveRole;
  const accentColor = "#00b2d6";
  const activeBg    = "#e0f2fe";

  return (
    <div style={{
      width: "240px", height: "100vh", backgroundColor: "#fff",
      borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column",
      position: "fixed", left: 0, top: 0, fontFamily: "Inter, sans-serif",
    }}>
      {/* Logo */}
      <Link to="/" title="Về trang chủ" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "14px 16px", borderBottom: "1px solid #f1f5f9", textDecoration: "none",
      }}>
        <img src="/owrms-logo.png" alt="OWRMS" style={{
          height: "116px", width: "116px", objectFit: "contain", flexShrink: 0,
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))",
        }} />
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {menuItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          if (item.isBottom) return (
            <React.Fragment key={idx}>
              <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "12px 8px" }} />
              <NavLink item={item} isActive={isActive} accentColor={accentColor} activeBg={activeBg} />
            </React.Fragment>
          );
          return (
            <React.Fragment key={idx}>
              {item.section && (
                <p style={{
                  fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af",
                  margin: "20px 8px 8px", letterSpacing: "0.07em", textTransform: "uppercase",
                }}>
                  {item.section}
                </p>
              )}
              <NavLink item={item} isActive={isActive} accentColor={accentColor} activeBg={activeBg} />
            </React.Fragment>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div style={{ borderTop: "1px solid #f0f0f0", padding: "12px 8px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px", borderRadius: "10px", marginBottom: "4px",
        }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%",
            overflow: "hidden", flexShrink: 0, border: `2px solid ${accentColor}22`,
          }}>
            <img src={avatarSrc} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <p style={{
              margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#111827",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {displayName}
            </p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280" }}>{displayRole}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: "10px",
          width: "100%", padding: "10px 12px", borderRadius: "8px",
          border: "none", backgroundColor: "transparent", color: "#dc2626",
          fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
          transition: "all 0.2s", fontFamily: "Inter, sans-serif",
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#fef2f2"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

const NavLink = ({ item, isActive, accentColor, activeBg }) => (
  <Link to={item.path} style={{
    display: "flex", alignItems: "center", gap: "12px",
    padding: "10px 12px", borderRadius: "8px", textDecoration: "none",
    color: isActive ? accentColor : "#4b5563",
    backgroundColor: isActive ? activeBg : "transparent",
    marginBottom: "2px", fontWeight: isActive ? 600 : 500,
    fontSize: "0.9rem", transition: "all 0.15s", position: "relative",
  }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
  >
    {isActive && (
      <span style={{
        position: "absolute", left: 0, width: "3px", height: "32px",
        backgroundColor: accentColor, borderRadius: "0 3px 3px 0",
      }} />
    )}
    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{item.icon}</span>
    <span>{item.label}</span>
  </Link>
);

export default Sidebar;
