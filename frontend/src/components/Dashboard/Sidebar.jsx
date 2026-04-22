import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import rentalService from "../../services/rentalService";
import ratingService from "../../services/ratingService";
import axiosClient from "../../services/axiosClient";
import favoritesService from "../../services/favoritesService";
import subscriptionService from "../../services/subscriptionService";
import OWRMSLogo from "../OWRMSLogo";

/* ── Roles label map ── */
const ROLE_LABEL = {
  OWNER: "Chủ kho",
  OPERATOR: "Điều phối viên",
  OWNER_OPERATOR: "Chủ kho & Điều phối viên",
  MANAGER: "Quản lý kho",
  STAFF: "Nhân viên kho",
  RENTER: "Người thuê kho",
  ADMIN: "Quản trị viên",
  USER: "Người dùng",
};

/**
 * Build menu items dựa trên warehouse roles và skills thực tế của user.
 * Mỗi khả năng là một if-block độc lập — thêm role/skill mới chỉ cần thêm if-block.
 * Trả về { items, roleKey, roleLabel }.
 */
function buildMenu(systemRole, warehouses) {
  // ── Admin bypass ────────────────────────────────────────────
  if ((systemRole || "").toLowerCase() === "admin") {
    return {
      items: [
        {
          icon: "admin_panel_settings",
          label: "Quản trị viên",
          path: "/admin",
        },
        { icon: "star", label: "Quản lý đánh giá", path: "/admin/ratings" },
        {
          icon: "settings",
          label: "Cài đặt",
          path: "/settings",
          isBottom: true,
        },
      ],
      roleKey: "ADMIN",
      roleLabel: "Quản trị viên",
    };
  }

  // ── Phân tích warehouse context ────────────────────────────
  const roles = new Set(
    (warehouses || []).flatMap((w) =>
      (w.roles?.length ? w.roles : [w.role || ""]).map((r) => r.toUpperCase()),
    ),
  );
  const skills = new Set(
    (warehouses || []).flatMap((w) =>
      (w.skills || []).map((s) => s.toUpperCase()),
    ),
  );
  const isAllSkill = (warehouses || []).some((w) => w.isAllSkill);

  const hasOwner = roles.has("OWNER");
  const hasOperator = roles.has("OPERATOR");
  const hasManager = roles.has("MANAGER");
  const hasStaff = roles.has("STAFF");
  const hasRenter = roles.has("RENTER");
  const hasChecker = (hasStaff && isAllSkill) || skills.has("CHECKER");
  const hasInvOp = (hasStaff && isAllSkill) || skills.has("INVENTORY_OPERATOR");

  // ── Fallback: USER không có kho ──────────────────────────
  if (!hasOwner && !hasOperator && !hasManager && !hasStaff && !hasRenter) {
    return {
      items: [
        { icon: "search", label: "Tìm kho thuê", path: "/search" },
        {
          icon: "description",
          label: "Hợp đồng của tôi",
          path: "/my-contracts",
          section: "HỢP ĐỒNG",
        },
        {
          icon: "list_alt",
          label: "Yêu cầu thuê",
          path: "/my-rental-requests",
        },
        {
          icon: "workspace_premium",
          label: "Đăng ký làm chủ kho",
          path: "/subscriptions",
          section: "TRỞ THÀNH ĐỐI TÁC",
        },
        {
          icon: "settings",
          label: "Cài đặt",
          path: "/settings",
          isBottom: true,
        },
      ],
      roleKey: "USER",
      roleLabel: "Người dùng",
    };
  }

  const items = [];

  // ── Dashboard ────────────────────────────────────────────────
  if (hasOwner || hasOperator) {
    items.push({
      icon: "dashboard",
      label: "Tổng quan",
      path: "/owner-dashboard",
    });
    items.push({
      icon: "donut_large",
      label: "Biểu đồ công suất",
      path: "/occupancy-dashboard",
    });
    items.push({
      icon: "warehouse",
      label: "Kho của tôi",
      path: "/my-warehouses",
    });
  }
  if (hasManager) {
    items.push({
      icon: "dashboard",
      label: "Bảng điều khiển",
      path: "/staff-dashboard",
    });
  }
  if (hasRenter) {
    const renterContractSection =
      hasOwner || hasOperator || hasManager ? "HỢP ĐỒNG CỦA TÔI" : undefined;
    items.push({
      icon: "description",
      label: "Hợp đồng của tôi",
      path: "/my-contracts",
      ...(renterContractSection ? { section: renterContractSection } : {}),
    });
    items.push({
      icon: "access_time",
      label: "Gia hạn hợp đồng",
      path: "/contract-extensions-renter",
    });
    items.push({
      icon: "list_alt",
      label: "Yêu cầu thuê kho",
      path: "/my-rental-requests",
    });
    items.push({
      icon: "favorite",
      label: "Kho yêu thích",
      path: "/my-favorites",
      badgeKey: "favoritesCount",
      section: "TÌM KIẾM",
    });
  }

  // ── HỢP ĐỒNG section (OWNER) ────────────────────────────────
  if (hasOwner) {
    items.push({
      icon: "description",
      label: "Quản lý hợp đồng",
      path: "/owner-contracts",
      section: "HỢP ĐỒNG",
    });
    items.push({
      icon: "payments",
      label: "Xác nhận thanh toán",
      path: "/pending-cash-payments",
      badgeKey: "pendingPaymentCount",
    });
    items.push({
      icon: "pending_actions",
      label: "Yêu cầu thuê kho",
      path: "/pending-rental-requests",
    });
  }

  // ── YÊU CẦU / KHO section ─────────────────────────────────
  if (hasOwner || hasOperator) {
    items.push({
      icon: "inventory_2",
      label: "Yêu cầu nhập/xuất",
      path: "/owner-inventory-requests",
      section: "YÊU CẦU",
    });
    items.push({
      icon: "inventory",
      label: "Tồn kho hàng thuê",
      path: "/owner-inventory",
    });
    items.push({
      icon: "fact_check",
      label: "Kiểm kê kho",
      path: "/owner-audit-sessions",
      badgeKey: "pendingAuditCount",
    });
  }
  if (hasManager) {
    items.push({
      icon: "fact_check",
      label: "Kiểm kê kho",
      path: "/staff-audit-sessions",
      section: "KHO",
    });
    items.push({
      icon: "inventory_2",
      label: "Yêu cầu nhập / xuất kho",
      path: "/staff-inventory-requests",
      badgeKey: "pendingRequestCount",
    });
    items.push({
      icon: "inventory",
      label: "Quản lí tồn kho",
      path: "/staff-inventory",
    });
    items.push({
      icon: "history",
      label: "Lịch sử nhập/ xuất kho",
      path: "/transaction-history",
    });
  }
  if (hasRenter) {
    const renterKhoSection =
      hasOwner || hasOperator || hasManager ? "KHO THUÊ" : "KHO";
    items.push({
      icon: "add_circle",
      label: "Tạo yêu cầu nhập/xuất",
      path: "/create-inventory",
      section: renterKhoSection,
    });
    items.push({
      icon: "history",
      label: "Lịch sử nhập/xuất kho",
      path: "/renter-inventory-history",
    });
    items.push({
      icon: "inventory",
      label: "Tồn kho của tôi",
      path: "/renter-inventory",
    });
    items.push({
      icon: "fact_check",
      label: "Kiểm kê kho",
      path: "/renter-audit-sessions",
    });
  }

  // ── NHÂN SỰ / VẬN HÀNH section (OPERATOR, MANAGER) ────────
  if (hasOperator || hasManager) {
    items.push({
      icon: "group",
      label: "Quản lý nhân viên",
      path: "/list-staff",
      section: "NHÂN SỰ",
    });
    items.push({
      icon: "person_add",
      label: "Thêm nhân viên",
      path: "/create-staff",
    });
    items.push({
      icon: "schedule",
      label: "Phân ca",
      path: "/shift-scheduling",
      section: "VẬN HÀNH",
    });
    items.push({
      icon: "calendar_month",
      label: "Lịch công việc",
      path: "/task-scheduling",
    });
  }

  // ── STAFF skills section ─────────────────────────────────────
  if (hasStaff) {
    if (hasChecker) {
      items.push({
        icon: "inventory_2",
        label: "Xác nhận nhập/xuất kho",
        path: "/staff-inventory-requests-staff",
        section: "KHO",
        badgeKey: "pendingAssignedCount",
      });
    }
    if (hasChecker || hasInvOp) {
      const invItem = {
        icon: "inventory",
        label: "Quản lí tồn kho",
        path: "/staff-inventory",
      };
      if (!hasChecker) invItem.section = "KHO";
      items.push(invItem);
    }
    if (hasInvOp) {
      items.push({
        icon: "fact_check",
        label: "Kiểm kê kho",
        path: "/staff-audit-sessions",
      });
    }
  }

  // ── TÀI CHÍNH section ────────────────────────────────────────
  if (hasOwner) {
    items.push({
      icon: "receipt_long",
      label: "Lịch sử thanh toán",
      path: "/payment-history",
      section: "TÀI CHÍNH",
    });
    items.push({
      icon: "workspace_premium",
      label: "Mua gói dịch vụ",
      path: "/subscriptions",
      section: "DỊCH VỤ",
    });
  }
  if (hasRenter && !hasOwner) {
    items.push({
      icon: "receipt_long",
      label: "Lịch sử thanh toán",
      path: "/payment-history",
      section: "TÀI CHÍNH",
    });
    items.push({
      icon: "star",
      label: "Đánh giá của tôi",
      path: "/my-ratings",
      badgeKey: "unratedCount",
    });
  }

  // ── CÁ NHÂN section (STAFF / MANAGER) ──────────────────────
  if (hasStaff) {
    items.push({
      icon: "calendar_month",
      label: "Lịch của tôi",
      path: "/my-schedule",
      section: "CÁ NHÂN",
    });
  }

  // ── Thiết bị + Cài đặt (mọi role có kho) ────────────────────
  items.push({
    icon: "precision_manufacturing",
    label: "Quản lý thiết bị",
    path: "/equipment-management",
  });
  items.push({
    icon: "settings",
    label: "Cài đặt",
    path: "/settings",
    isBottom: true,
  });

  // ── Xác định roleKey cho label ───────────────────────────
  let roleKey = "USER";
  if (hasOwner && hasOperator) roleKey = "OWNER_OPERATOR";
  else if (hasOwner) roleKey = "OWNER";
  else if (hasOperator) roleKey = "OPERATOR";
  else if (hasManager) roleKey = "MANAGER";
  else if (hasStaff) roleKey = "STAFF";
  else if (hasRenter) roleKey = "RENTER";

  return { items, roleKey, roleLabel: ROLE_LABEL[roleKey] || roleKey };
}

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [effectiveRole, setEffectiveRole] = useState("USER");
  const [currentWarehouses, setCurrentWarehouses] = useState([]);
  const [currentSystemRole, setCurrentSystemRole] = useState("user");
  const [displayName, setDisplayName] = useState("Người dùng");
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [unratedCount, setUnratedCount] = useState(0);
  const [unrepliedCount, setUnrepliedCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [pendingAuditCount, setPendingAuditCount] = useState(0);
  const [pendingAssignedCount, setPendingAssignedCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(() =>
    favoritesService.count(),
  );
  const [subStatus, setSubStatus] = useState(null);

  const loadUserInfo = () => {
    const user = authService.getCurrentUser() || {};
    const ctx = authService.getWarehouseContext() || {};
    console.log(ctx);
    const systemRole = (
      ctx.systemRole ||
      user.role ||
      user.roleName ||
      "user"
    ).toLowerCase();
    const warehouses = ctx.warehouses || [];
    const name = user.fullName || user.FullName || ctx.name || "Người dùng";
    const avatar =
      user.avatarUrl ||
      user.AvatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00b2d6&color=fff`;

    const { roleKey } = buildMenu(systemRole, warehouses);
    setEffectiveRole(roleKey);
    setCurrentWarehouses(warehouses);
    setCurrentSystemRole(systemRole);
    setDisplayName(name);
    setAvatarSrc(avatar);
    return roleKey;
  };

  const fetchUnratedCount = async () => {
    try {
      const [contracts, myRatings] = await Promise.all([
        rentalService.getMyContracts(),
        ratingService.getMyRatings(),
      ]);
      const activeContracts = contracts.filter(
        (c) => c.status === "ACTIVE" || c.status === "EXPIRED",
      );
      const ratedContractIds = new Set(myRatings.map((r) => r.contractId));
      const unrated = activeContracts.filter(
        (c) => !ratedContractIds.has(c.contractId),
      );
      setUnratedCount(unrated.length);
    } catch {
      setUnratedCount(0);
    }
  };

  const fetchUnrepliedCount = async () => {
    try {
      const count = await ratingService.getOwnerUnrepliedCount();
      setUnrepliedCount(count);
    } catch {
      setUnrepliedCount(0);
    }
  };

  const fetchPendingRequestCount = async () => {
    try {
      const ctx = authService.getWarehouseContext();
      const wid = ctx?.warehouses?.[0]?.warehouseId; // same as StaffDashboard
      const params = (type) => ({
        type,
        status: "PENDING",
        pageSize: 1,
        ...(wid ? { warehouseId: wid } : {}), // truyền warehouseId nếu có
      });
      const [inbound, outbound] = await Promise.all([
        axiosClient.get("/InventoryRequests", { params: params("INBOUND") }),
        axiosClient.get("/InventoryRequests", { params: params("OUTBOUND") }),
      ]);
      const countIn = inbound.data?.totalCount ?? 0;
      const countOut = outbound.data?.totalCount ?? 0;
      setPendingRequestCount(countIn + countOut);
    } catch {
      setPendingRequestCount(0);
    }
  };

  const fetchPendingPaymentCount = async () => {
    try {
      const response = await axiosClient.get("/payments/pending-confirmation");
      const payments = response.data || [];
      setPendingPaymentCount(payments.length);
    } catch {
      setPendingPaymentCount(0);
    }
  };

  const fetchPendingAuditCount = async () => {
    try {
      const response = await axiosClient.get("/audit-sessions", {
        params: { status: "PENDING_APPROVAL", pageSize: 1 },
      });
      const count = response.data?.data?.totalCount ?? 0;
      setPendingAuditCount(count);
    } catch {
      setPendingAuditCount(0);
    }
  };

  const fetchPendingAssignedCount = async () => {
    try {
      const ctx = authService.getWarehouseContext();
      const wid = ctx?.warehouses?.[0]?.warehouseId;
      const [inbound, outbound] = await Promise.all([
        axiosClient.get("/InventoryRequests", { params: { warehouseId: wid, type: 'INBOUND', status: 'CONFIRMED', pageSize: 1 } }),
        axiosClient.get("/InventoryRequests", { params: { warehouseId: wid, type: 'OUTBOUND', status: 'CONFIRMED', pageSize: 1 } }),
      ]);
      const countIn  = inbound.data?.totalCount ?? 0;
      const countOut = outbound.data?.totalCount ?? 0;
      setPendingAssignedCount(countIn + countOut);
    } catch {
      setPendingAssignedCount(0);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await subscriptionService.getSubscriptionStatus();
      if (res.data?.success) setSubStatus(res.data);
    } catch {
      setSubStatus(null);
    }
  };

  useEffect(() => {
    const role = loadUserInfo();
    if (role === "RENTER") fetchUnratedCount();
    if (role === "OWNER" || role === "OPERATOR" || role === "OWNER_OPERATOR") {
      fetchUnrepliedCount();
      fetchPendingPaymentCount();
      fetchPendingAuditCount();
      fetchSubscriptionStatus();
    }
    if (role === "MANAGER") fetchPendingRequestCount();
    if (role === "STAFF") fetchPendingAssignedCount();
  }, []);

  useEffect(() => {
    const handler = () => {
      const role = loadUserInfo();
      if (role === "RENTER") {
        fetchUnratedCount();
      } else {
        setUnratedCount(0);
      }
      if (role === "OWNER" || role === "OPERATOR" || role === "OWNER_OPERATOR") {
        fetchUnrepliedCount();
        fetchPendingPaymentCount();
        fetchPendingAuditCount();
      } else {
        setUnrepliedCount(0);
        setPendingPaymentCount(0);
        setPendingAuditCount(0);
      }
      if (role === "MANAGER") {
        fetchPendingRequestCount();
      } else {
        setPendingRequestCount(0);
      }
      if (role === "STAFF") {
        fetchPendingAssignedCount();
      } else {
        setPendingAssignedCount(0);
      }
    };
    window.addEventListener("authChange", handler);
    return () => window.removeEventListener("authChange", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (effectiveRole === "RENTER") fetchUnratedCount();
    };
    window.addEventListener("ratingSubmitted", handler);
    return () => window.removeEventListener("ratingSubmitted", handler);
  }, [effectiveRole]);

  useEffect(() => {
    const handler = () => {
      if (effectiveRole === "OWNER" || effectiveRole === "OPERATOR" || effectiveRole === "OWNER_OPERATOR")
        fetchUnrepliedCount();
    };
    window.addEventListener("replyChanged", handler);
    return () => window.removeEventListener("replyChanged", handler);
  }, [effectiveRole]);

  useEffect(() => {
    const handler = () => {
      if (effectiveRole === "MANAGER") fetchPendingRequestCount();
      if (effectiveRole === "STAFF") fetchPendingAssignedCount();
    };
    window.addEventListener("inventoryRequestUpdated", handler);
    return () => window.removeEventListener("inventoryRequestUpdated", handler);
  }, [effectiveRole]);

  useEffect(() => {
    if (effectiveRole === "RENTER") fetchUnratedCount();
    if (effectiveRole === "OWNER" || effectiveRole === "OPERATOR" || effectiveRole === "OWNER_OPERATOR")
      fetchUnrepliedCount();
    if (effectiveRole === "MANAGER") fetchPendingRequestCount();
    if (effectiveRole === "STAFF") fetchPendingAssignedCount();
  }, [location.pathname, effectiveRole]);

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname, onClose]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = () => {
    authService.logout();
    window.dispatchEvent(new Event("authChange"));
    navigate("/auth");
  };

  const { items: menuItems, roleLabel: displayRole } = buildMenu(
    currentSystemRole,
    currentWarehouses,
  );
  const accentColor = "#00d2ff";


  useEffect(() => {
    const handler = () => setFavoritesCount(favoritesService.count());
    window.addEventListener("favoritesChanged", handler);
    return () => window.removeEventListener("favoritesChanged", handler);
  }, []);

  const badgeValues = {
    unratedCount,
    unrepliedCount,
    pendingRequestCount,
    pendingPaymentCount,
    pendingAuditCount,
    pendingAssignedCount,
    favoritesCount,
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 998,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
          className="sidebar-overlay"
        />
      )}

      {/* ── Sidebar styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');

        .dashboard-sidebar {
          background: linear-gradient(175deg, #030b1a 0%, #060f1e 35%, #081522 65%, #040c18 100%) !important;
          border-right: 1px solid rgba(0,195,255,.12) !important;
          background-color: transparent !important;
        }

        /* subtle grid overlay via pseudo on the nav */
        .sb-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,210,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,255,.025) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
        }

        /* custom scrollbar for dark sidebar */
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb { background: rgba(0,200,255,.2); border-radius: 2px; }
        .sb-nav::-webkit-scrollbar-thumb:hover { background: rgba(0,200,255,.4); }

        .sb-nav-link {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 12px;
          border-radius: 9px;
          text-decoration: none;
          color: rgba(170,205,230,.7);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 2px;
          transition: all 0.18s ease;
          position: relative;
          font-family: 'Inter', sans-serif;
        }
        .sb-nav-link:hover {
          background: rgba(0,180,255,.08);
          color: rgba(200,235,255,.95);
        }
        .sb-nav-link.active {
          background: rgba(0,185,255,.12);
          color: #00d2ff;
          font-weight: 600;
        }
        .sb-nav-link.active .sb-active-bar {
          opacity: 1;
          box-shadow: 0 0 8px rgba(0,210,255,.8);
        }
        .sb-nav-link.active .material-symbols-outlined {
          filter: drop-shadow(0 0 4px rgba(0,210,255,.7));
        }
        .sb-active-bar {
          position: absolute;
          left: 0;
          width: 3px;
          height: 28px;
          background: #00d2ff;
          border-radius: 0 3px 3px 0;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .sb-section-label {
          font-size: 0.62rem;
          font-weight: 700;
          color: rgba(0,200,255,.42);
          margin: 18px 10px 6px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }

        .sb-divider {
          height: 1px;
          margin: 10px 10px;
          background: linear-gradient(90deg, transparent, rgba(0,200,255,.2), transparent);
        }

        @keyframes badgePop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 900px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
          }
          .dashboard-sidebar.sidebar-open {
            transform: translateX(0);
            box-shadow: 4px 0 32px rgba(0,0,0,.6), 4px 0 16px rgba(0,150,255,.1);
          }
          .sidebar-overlay { display: block !important; }
          .sidebar-close-btn { display: flex !important; }
        }
        @media (min-width: 901px) {
          .dashboard-sidebar { transform: translateX(0) !important; }
        }
      `}</style>

      <div
        className={`dashboard-sidebar${isOpen ? " sidebar-open" : ""}`}
        style={{
          width: "240px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          fontFamily: "Inter, sans-serif",
          zIndex: 999,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Grid overlay */}
        <div className="sb-grid-overlay" />

        {/* ── Logo Header ── */}
        <div style={{ position: "relative", flexShrink: 0, zIndex: 1 }}>
          {/* Mobile close */}
          {onClose && (
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              style={{
                display: "none",
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "1px solid rgba(0,210,255,.3)",
                backgroundColor: "rgba(0,15,35,.7)",
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(150,220,255,.85)",
                padding: 0,
                zIndex: 5,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "17px" }}
              >
                close
              </span>
            </button>
          )}

          <Link
            to="/"
            title="Về trang chủ"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 16px 8px",
              textDecoration: "none",
            }}
          >
            <OWRMSLogo size={115} variant="full" />
          </Link>

          {/* Brand text */}
          <div style={{ textAlign: "center", padding: "0 16px 14px" }}>
            <p
              style={{
                fontFamily: "'Orbitron', 'Inter', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 900,
                letterSpacing: "4px",
                background:
                  "linear-gradient(135deg, #00d2ff 0%, #a8edff 50%, #3a7bd5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                textTransform: "uppercase",
                filter: "drop-shadow(0 0 6px rgba(0,210,255,.5))",
              }}
            >
              OWRMS
            </p>
            <p
              style={{
                fontSize: "0.5rem",
                color: "rgba(100,170,210,.45)",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                margin: "2px 0 0",
                fontWeight: 600,
              }}
            >
              Warehouse System
            </p>
          </div>

          {/* Glowing separator */}
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(0,210,255,.5) 40%, rgba(60,150,255,.7) 50%, rgba(0,210,255,.5) 60%, transparent)",
              marginBottom: 0,
            }}
          />
        </div>

        {/* ── Navigation ── */}
        <nav
          className="sb-nav"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 8px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {menuItems?.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const badge = item.badgeKey ? badgeValues[item.badgeKey] || 0 : 0;
            const isLocked =
              subStatus &&
              subStatus.isActive &&
              item.path === "/equipment-management" &&
              !subStatus.allowEquipmentManagement;

            return (
              <React.Fragment key={idx}>
                {item.section && (
                  <p className="sb-section-label">{item.section}</p>
                )}
                <NavLink
                  item={item}
                  isActive={isActive}
                  badge={badge}
                  isLocked={isLocked}
                />
              </React.Fragment>
            );
          })}
        </nav>

        {/* ── User Card ── */}
        <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
          {/* Top glow separator */}
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(0,210,255,.35) 40%, rgba(0,210,255,.5) 50%, rgba(0,210,255,.35) 60%, transparent)",
            }}
          />
          <div
            style={{
              margin: "10px 8px 4px",
              padding: "10px 10px 8px",
              borderRadius: "12px",
              background: "rgba(0,30,60,.45)",
              border: "1px solid rgba(0,180,255,.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "2px solid rgba(0,210,255,.35)",
                  boxShadow: "0 0 8px rgba(0,180,255,.25)",
                }}
              >
                {avatarSrc && (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.83rem",
                    fontWeight: 600,
                    color: "rgba(210,235,255,.92)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    color: "rgba(0,210,255,.55)",
                  }}
                >
                  {displayRole}
                </p>
              </div>
            </div>

            {/* Subscription status badge */}
            {(effectiveRole === "OWNER" || effectiveRole === "OPERATOR" || effectiveRole === "OWNER_OPERATOR") &&
              subStatus && (
                <Link
                  to="/subscriptions"
                  style={{
                    textDecoration: "none",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: subStatus.isActive
                        ? "linear-gradient(90deg, rgba(16,185,129,.12), rgba(59,130,246,.12))"
                        : "rgba(239,68,68,.1)",
                      border: `1px solid ${subStatus.isActive ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.25)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "14px",
                          color: subStatus.isActive ? "#10b981" : "#ef4444",
                        }}
                      >
                        {subStatus.isActive ? "verified" : "error"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: subStatus.isActive
                            ? "rgba(16,185,129,.9)"
                            : "rgba(239,68,68,.9)",
                        }}
                      >
                        {subStatus.plan || "Chưa có gói"}
                      </span>
                    </div>
                    {subStatus.isActive &&
                      subStatus.endDate &&
                      (() => {
                        const end = new Date(subStatus.endDate);
                        const days = Math.max(
                          0,
                          Math.ceil((end - new Date()) / 86400000),
                        );
                        const endStr = end.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });
                        return (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              color: "rgba(150,200,230,.6)",
                              fontWeight: 500,
                              textAlign: "right",
                              lineHeight: "1.3",
                            }}
                          >
                            <span style={{ display: "block" }}>
                              HSD: {endStr}
                            </span>
                            <span
                              style={{
                                color:
                                  days <= 7
                                    ? "rgba(251,191,36,.9)"
                                    : "rgba(150,200,230,.45)",
                                fontSize: "0.58rem",
                              }}
                            >
                              (còn {days} ngày)
                            </span>
                          </span>
                        );
                      })()}
                    {!subStatus.isActive && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          color: "rgba(239,68,68,.7)",
                          fontWeight: 600,
                        }}
                      >
                        Gia hạn →
                      </span>
                    )}
                  </div>
                </Link>
              )}

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "7px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,80,80,.18)",
                backgroundColor: "rgba(220,50,50,.08)",
                color: "rgba(255,120,120,.85)",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(220,50,50,.18)";
                e.currentTarget.style.borderColor = "rgba(255,80,80,.35)";
                e.currentTarget.style.color = "rgba(255,140,140,1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(220,50,50,.08)";
                e.currentTarget.style.borderColor = "rgba(255,80,80,.18)";
                e.currentTarget.style.color = "rgba(255,120,120,.85)";
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "17px" }}
              >
                logout
              </span>
              <span>Đăng xuất</span>
            </button>
          </div>
          <div style={{ height: "6px" }} />
        </div>
      </div>

      {/* styles moved above */}
    </>
  );
};

const NavLink = ({ item, isActive, badge = 0, isLocked = false }) => (
  <Link
    to={item.path}
    className={`sb-nav-link${isActive ? " active" : ""}`}
    style={{ opacity: isLocked ? 0.6 : 1 }}
  >
    <span className="sb-active-bar" />
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
        {item.icon}
      </span>
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-7px",
            right: "-9px",
            minWidth: "16px",
            height: "16px",
            borderRadius: "8px",
            backgroundColor: "#ef4444",
            color: "#fff",
            fontSize: "0.6rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            boxShadow: "0 0 6px rgba(239,68,68,.7)",
            border: "1.5px solid rgba(10,20,40,.8)",
            lineHeight: 1,
            animation: "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </span>
    <span style={{ flex: 1 }}>{item.label}</span>
    {isLocked && (
      <span
        className="material-symbols-outlined"
        style={{ fontSize: "14px", color: "rgba(255,185,0,0.8)" }}
      >
        lock
      </span>
    )}
  </Link>
);

export default Sidebar;
