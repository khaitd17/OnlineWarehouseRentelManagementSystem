import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  return token ? <Outlet /> : <Navigate to="/auth" state={{ mode: 'login', returnUrl: location.pathname + location.search }} />;
}

export default ProtectedRoute;