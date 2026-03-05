import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import HomePage from "../pages/HomePage";
import SearchResultsPage from "../pages/SearchResultsPage";
import WarehouseDetailsPage from "../pages/WarehouseDetailsPage"
import AuthPage from "../pages/AuthPage";
import PostWarehousePage from "../pages/PostWarehousePage";
import AboutUsPage from "../pages/AboutUsPage";
import Dashboard from "../pages/Dashboard";
import ProfilePage from "../pages/ProfilePage";
import ProtectedRoute from "./ProtectedRoute";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AccountsPage from "../pages/admin/AccountsPage";
import WarehousesPage from "../pages/admin/WarehousesPage";
import WarehouseDetailPage from "../pages/admin/WarehouseDetailPage";
import AuditSessionsPage from "../pages/admin/AuditSessionsPage";
import AuditSessionDetailPage from "../pages/admin/AuditSessionDetailPage";
import ReportsPage from "../pages/admin/ReportsPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/warehouse/:id" element={<WarehouseDetailsPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/post-warehouse" element={<PostWarehousePage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/accounts" element={<AccountsPage />} />
            <Route path="/admin/warehouses" element={<WarehousesPage />} />
            <Route path="/admin/warehouses/:id" element={<WarehouseDetailPage />} />
            <Route path="/admin/audit-sessions" element={<AuditSessionsPage />} />
            <Route path="/admin/audit-sessions/:id" element={<AuditSessionDetailPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;