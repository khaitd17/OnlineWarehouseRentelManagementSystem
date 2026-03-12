import { Navigate, Outlet } from "react-router-dom";

function RoleBasedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (user.role || user.roleName || "").toUpperCase();

  if (!token) {
    return <Navigate to="/auth" />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Không có quyền -> đá về dashboard (hoặc trang chủ / unauthorized)
    if (userRole === "RENTER") {
        return <Navigate to="/renter-dashboard" />;
    } else if (userRole === "STAFF" || userRole === "MANAGER") {
        return <Navigate to="/staff-dashboard" />;
    } else if (userRole === "OWNER") {
        return <Navigate to="/dashboard" />;
    }
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

export default RoleBasedRoute;
