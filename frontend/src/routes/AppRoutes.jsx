import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import HomePage from "../pages/HomePage";
import SearchResultsPage from "../pages/SearchResultsPage";
import WarehouseDetailsPage from "../pages/WarehouseDetailsPage"
import AuthPage from "../pages/AuthPage";
import PostWarehousePage from "../pages/PostWarehousePage";
import AboutUsPage from "../pages/AboutUsPage";
import Dashboard from "../pages/Dashboard";
import ProfilePage from "../pages/ProfilePage";
import CreateStaff from "../pages/CreateStaff";
import ListStaff from "../pages/ListStaff";
import TaskSchedulingPage from "../pages/TaskSchedulingPage";
import ShiftSchedulingPage from "../pages/ShiftSchedulingPage";
import MySchedulePage from "../pages/MySchedulePage";
import ForgotPage from "../pages/ForgotPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ProtectedRoute from "./ProtectedRoute";
import CreateWarehouse from "../pages/CreateWarehouse";
import WarehouseDetail from "../pages/WarehouseDetail";
import OwnerWarehouseList from "../pages/OwnerWarehouseList";
import OwnerWarehouseDetailPage from "../pages/OwnerWarehouseDetailPage";
import EditWarehouse from "../pages/EditWarehouse";
import MyRentalRequests from "../pages/MyRentalRequests";
import PendingRentalRequests from "../pages/PendingRentalRequests";
import RentalRequestDetail from "../pages/RentalRequestDetail";
import MyContracts from "../pages/MyContracts";
import ContractDetail from "../pages/ContractDetail";
import WarehouseContracts from "../pages/WarehouseContracts";
import OccupancyDashboard from "../pages/OccupancyDashboard";
import RoleBasedRoute from "./RoleBasedRoute";

// Import New Pages for Requests
import ConfirmMovement from "../pages/Requests/ConfirmMovement";
import OutboundRequestsList from "../pages/Requests/OutboundRequestsList";
import InboundRequestsManagement from "../pages/Requests/InboundRequestsManagement";
import CreateOutboundRequest from "../pages/Requests/CreateOutboundRequest";
import StaffDashboard from "../pages/Requests/StaffDashboard";
import RenterDashboard from "../pages/Requests/RenterDashboard";
import CreateInboundRequest from "../pages/Requests/CreateInboundRequest";
import TransactionHistory from "../pages/Requests/TransactionHistory";
import RenterInboundList from "../pages/Requests/RenterInboundList";
import RenterOutboundList from "../pages/Requests/RenterOutboundList";
import OwnerInventoryRequests from "../pages/Requests/OwnerInventoryRequests";
import StaffInventoryRequests from "../pages/Requests/StaffInventoryRequests";
import PaymentHistory from "../pages/Requests/PaymentHistory";

// Audit session pages
import OwnerAuditSessionsPage from "../pages/OwnerAuditSessionsPage";
import OwnerAuditSessionDetailPage from "../pages/OwnerAuditSessionDetailPage";
import StaffAuditSessionsPage from "../pages/StaffAuditSessionsPage";
import StaffAuditSessionDetailPage from "../pages/StaffAuditSessionDetailPage";
import RenterAuditSessionsPage from "../pages/RenterAuditSessionsPage";
import RenterAuditSessionDetailPage from "../pages/RenterAuditSessionDetailPage";


// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AccountsPage from "../pages/admin/AccountsPage";
import WarehousesPage from "../pages/admin/WarehousesPage";
import WarehouseDetailPage from "../pages/admin/WarehouseDetailPage";
import AuditSessionsPage from "../pages/admin/AuditSessionsPage";
import AuditSessionDetailPage from "../pages/admin/AuditSessionDetailPage";
import ReportsPage from "../pages/admin/ReportsPage";

import EquipmentManagement from "../pages/EquipmentManagement";

import authService from "../services/authService";

// Inline redirect: reads warehouseContext and sends user to their dashboard
const ROLE_PRIORITY_REDIRECT = ['OWNER', 'OPERATOR', 'MANAGER', 'STAFF', 'RENTER'];
const DashboardRedirect = () => {
  const _navigate = useNavigate();
  useEffect(() => {
    const user = authService.getCurrentUser() || {};
    const ctx = authService.getWarehouseContext() || {};
    const systemRole = (ctx.systemRole || user.role || user.roleName || 'user').toLowerCase();
    const roles = (ctx.warehouses || []).map(w => (w.role || '').toUpperCase());
    if (systemRole === 'admin') { _navigate('/admin', { replace: true }); return; }
    for (const r of ROLE_PRIORITY_REDIRECT) {
      if (roles.includes(r)) {
        if (r === 'OWNER' || r === 'OPERATOR') _navigate('/owner-dashboard', { replace: true });
        else if (r === 'MANAGER' || r === 'STAFF') _navigate('/staff-dashboard', { replace: true });
        else if (r === 'RENTER') _navigate('/renter-dashboard', { replace: true });
        return;
      }
    }
    _navigate('/my-rental-requests', { replace: true });
  }, [_navigate]);
  return null;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── PUBLIC pages: MainLayout (public navbar + footer) ── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/warehouse/:id" element={<WarehouseDetailsPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── DASHBOARD pages: NO public navbar ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/my-rental-requests" element={<MyRentalRequests />} />
            <Route path="/my-contracts" element={<MyContracts />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/settings" element={<ProfilePage />} />
            <Route path="/create-warehouse" element={<CreateWarehouse />} />
            <Route path="/post-warehouse" element={<PostWarehousePage />} />
          </Route>
        </Route>

        {/* ── OWNER / OPERATOR ── */}
        <Route element={<RoleBasedRoute allowedRoles={['OWNER', 'OPERATOR', 'USER', 'ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/owner-dashboard" element={<Dashboard />} />
            <Route path="/occupancy-dashboard" element={<OccupancyDashboard />} />
            <Route path="/my-warehouses" element={<OwnerWarehouseList />} />
            <Route path="/owner-warehouse/:id" element={<OwnerWarehouseDetailPage />} />
            <Route path="/warehouse-edit/:id" element={<EditWarehouse />} />
            <Route path="/warehouse-new/:id" element={<WarehouseDetail />} />
            <Route path="/pending-rental-requests" element={<PendingRentalRequests />} />
            <Route path="/rental-request/:id" element={<RentalRequestDetail />} />
            <Route path="/warehouse-contracts/:warehouseId" element={<WarehouseContracts />} />
            <Route path="/owner-inventory-requests" element={<OwnerInventoryRequests />} />
          </Route>
        </Route>

        {/* ── OWNER / OPERATOR / MANAGER: staff management ── */}
        <Route element={<RoleBasedRoute allowedRoles={['OWNER', 'OPERATOR', 'MANAGER', 'ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/create-staff" element={<CreateStaff />} />
            <Route path="/list-staff" element={<ListStaff />} />
            <Route path="/shift-scheduling" element={<ShiftSchedulingPage />} />
            <Route path="/task-scheduling" element={<TaskSchedulingPage />} />
            <Route path="/equipment-management" element={<EquipmentManagement />} />
          </Route>
        </Route>

        {/* ── STAFF / MANAGER / OPERATOR / OWNER ── */}
        <Route element={<RoleBasedRoute allowedRoles={['STAFF', 'MANAGER', 'OPERATOR', 'OWNER', 'ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/staff-inventory-requests" element={<StaffInventoryRequests />} />
            <Route path="/inbound-requests" element={<InboundRequestsManagement />} />
            <Route path="/outbound-requests" element={<OutboundRequestsList />} />
            <Route path="/confirm-movement" element={<ConfirmMovement />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/my-schedule" element={<MySchedulePage />} />
            <Route path="/staff-audit-sessions" element={<StaffAuditSessionsPage />} />
            <Route path="/staff-audit-sessions/:id" element={<StaffAuditSessionDetailPage />} />
          </Route>
        </Route>

        {/* ── RENTER ── */}
        <Route element={<RoleBasedRoute allowedRoles={['RENTER', 'USER', 'ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/renter-dashboard" element={<RenterDashboard />} />
            <Route path="/renter-inbound-requests" element={<RenterInboundList />} />
            <Route path="/renter-outbound-requests" element={<RenterOutboundList />} />
            <Route path="/renter-audit-sessions" element={<RenterAuditSessionsPage />} />
            <Route path="/renter-audit-sessions/:id" element={<RenterAuditSessionDetailPage />} />
          </Route>
        </Route>

        {/* ── Any warehouse member ── */}
        <Route element={<RoleBasedRoute allowedRoles={['STAFF', 'MANAGER', 'OPERATOR', 'OWNER', 'RENTER', 'USER', 'ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/create-inbound" element={<CreateInboundRequest />} />
            <Route path="/create-outbound" element={<CreateOutboundRequest />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
          </Route>
        </Route>

        {/* ── OWNER audit sessions ── */}
        <Route element={<RoleBasedRoute allowedRoles={['OWNER', 'OPERATOR', 'MANAGER', 'ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/owner-audit-sessions" element={<OwnerAuditSessionsPage />} />
            <Route path="/owner-audit-sessions/:id" element={<OwnerAuditSessionDetailPage />} />
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