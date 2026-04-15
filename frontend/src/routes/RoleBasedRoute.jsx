import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import authService from "../services/authService";

function RoleBasedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const [contextVersion, setContextVersion] = useState(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const warehouseContext = JSON.parse(localStorage.getItem("warehouseContext") || "{}");

  useEffect(() => {
    let isMounted = true;
    const syncContext = async () => {
      if (!token) return;
      await authService.refreshWarehouseContext();
      if (isMounted) {
        setContextVersion(v => v + 1);
        window.dispatchEvent(new Event("authChange"));
      }
    };
    syncContext();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/auth" />;
  }

  // Build set of effective roles: system role + tất cả warehouse roles
  // w.roles = array tất cả role codes (BE mới); fallback về [w.role] nếu chưa có
  const systemRole = (user.role || user.roleName || "").toUpperCase();
  const warehouseRoles = (warehouseContext?.warehouses || []).flatMap(w =>
    (w.roles?.length ? w.roles : [w.role || ""]).map(r => r.toUpperCase())
  );
  const effectiveRoles = new Set([systemRole, ...warehouseRoles].filter(Boolean));

  const hasAccess = !allowedRoles || allowedRoles.length === 0 ||
    allowedRoles.some(r => effectiveRoles.has(r.toUpperCase()));
  void contextVersion;

  if (!hasAccess) {
    // Redirect to the most appropriate dashboard
    if (effectiveRoles.has("RENTER")) return <Navigate to="/renter-dashboard" />;
    if (effectiveRoles.has("STAFF") || effectiveRoles.has("MANAGER")) return <Navigate to="/staff-dashboard" />;
    if (effectiveRoles.has("OWNER") || effectiveRoles.has("OPERATOR")) return <Navigate to="/dashboard" />;
    if (systemRole === "ADMIN") return <Navigate to="/admin" />;
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

export default RoleBasedRoute;
