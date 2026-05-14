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
import CreateShiftPage from "../pages/CreateShiftPage";
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
import ContractPaymentSelection from "../pages/ContractPaymentSelection";
import ContractPayment from "../pages/ContractPayment";
import PaymentResult from "../pages/PaymentResult";
import PendingCashPayments from "../pages/PendingCashPayments";
import WarehouseContracts from "../pages/WarehouseContracts";
import OccupancyDashboard from "../pages/OccupancyDashboard";
import RoleBasedRoute from "./RoleBasedRoute";

// Import New Pages for Requests
import ConfirmMovement from "../pages/Requests/ConfirmMovement";
// OutboundRequestsList removed (unused)
import InboundRequestsManagement from "../pages/Requests/InboundRequestsManagement";
import StaffDashboard from "../pages/Requests/StaffDashboard";
import RenterDashboard from "../pages/Requests/RenterDashboard";
import CreateInboundRequest from "../pages/Requests/CreateInboundRequest";
import TransactionHistory from "../pages/Requests/TransactionHistory";
import RenterInboundList from "../pages/Requests/RenterInboundList";
import RenterOutboundList from "../pages/Requests/RenterOutboundList";
import RenterInventoryHistory from "../pages/Requests/RenterInventoryHistory";
import OwnerInventoryRequests from "../pages/Requests/OwnerInventoryRequests";
// StaffInventoryRequests (old) removed — replaced by StaffInventoryRequestsNew
import StaffInventoryRequestsNew from "../pages/Requests/StaffInventoryRequestsNew";
import ManagerInventoryRequests from "../pages/Requests/ManagerInventoryRequests";
import PendingCapacityApprovals from "../pages/Requests/PendingCapacityApprovals";
import PaymentHistory from "../pages/Requests/PaymentHistory";
import CreateInventoryRequest from "../pages/Requests/CreateInventoryRequest";
import RenterInventoryPage from "../pages/RenterInventoryPage";
import OwnerInventoryPage from "../pages/OwnerInventoryPage";
import StaffInventoryPage from "../pages/StaffInventoryPage";
import SubscriptionPage from "../pages/SubscriptionPage";
import AiItemAnalyzerPage from "../pages/AiItemAnalyzerPage";
import WarehouseGridManager from "../pages/Requests/WarehouseGridManager";
import WarehouseGridMapPage from "../pages/Requests/WarehouseGridMapPage";

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
import ReportsPage from "../pages/admin/ReportsPage";
import RatingsPage from "../pages/admin/RatingsPage";
import AdminProfilePage from "../pages/admin/AdminProfilePage";
import AdminPendingWarehousesPage from "../pages/admin/AdminPendingWarehousesPage";
import SubscriptionsPage from "../pages/admin/SubscriptionsPage";

import EquipmentManagement from "../pages/EquipmentManagement";
import MyRatingsPage from "../pages/MyRatingsPage";
import FavoritesPage from "../pages/FavoritesPage";
import QRVerifyPage from "../pages/QRVerifyPage";
import OwnerContracts from "../pages/OwnerContracts";

// Contract Extension Pages
import RenterExtensionPage from "../pages/RenterExtensionPage.jsx";
import OwnerExtensionPage from "../pages/OwnerExtensionPage.jsx";
import ContractSigningWrapper from "../components/contract/ContractSigningWrapper.jsx";

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
    if (systemRole === 'renter' && !roles.includes('RENTER')) {
      _navigate('/my-rental-requests', { replace: true });
      return;
    }
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
        {/* ── QR Verify: Public standalone page (no layout/auth needed) ── */}
        <Route path="/verify/:requestCode" element={<QRVerifyPage />} />

        {/* ── PUBLIC pages: MainLayout (public navbar + footer) ── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/warehouse/:id" element={<WarehouseDetailsPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/ai-analyzer" element={<AiItemAnalyzerPage />} />
        </Route>

        {/* ── DASHBOARD pages: NO public navbar ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/my-rental-requests" element={<MyRentalRequests />} />
            <Route path="/my-contracts" element={<MyContracts />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/contracts/:id/payment" element={<ContractPaymentSelection />} />
            <Route path="/contracts/:id/payment/online" element={<ContractPayment />} />
            <Route path="/payment-result" element={<PaymentResult />} />
            <Route path="/sign-contract/:contractId" element={<ContractSigningWrapper userRole="RENTER" />} />
            <Route path="/sign-contract/:contractId/extension/:extensionId" element={<ContractSigningWrapper userRole="RENTER" />} />
            <Route path="/settings" element={<ProfilePage />} />
            <Route path="/subscriptions" element={<SubscriptionPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/create-warehouse" element={<CreateWarehouse />} />
            <Route path="/post-warehouse" element={<PostWarehousePage />} />
          </Route>
        </Route>

        {/* ── OWNER / OPERATOR ── */}
        <Route element={<RoleBasedRoute allowedRoles={['OWNER', 'OPERATOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/owner-dashboard" element={<Dashboard />} />
            <Route path="/occupancy-dashboard" element={<OccupancyDashboard />} />
            <Route path="/my-warehouses" element={<OwnerWarehouseList />} />
            <Route path="/owner-warehouse/:id" element={<OwnerWarehouseDetailPage />} />
            <Route path="/warehouse-edit/:id" element={<EditWarehouse />} />
            <Route path="/warehouse-new/:id" element={<WarehouseDetail />} />
            <Route path="/pending-rental-requests" element={<PendingRentalRequests />} />
            <Route path="/rental-request/:id" element={<RentalRequestDetail />} />
            <Route path="/owner-contracts" element={<OwnerContracts />} />
            <Route path="/warehouse-contracts/:warehouseId" element={<WarehouseContracts />} />
            <Route path="/contract-extensions" element={<OwnerExtensionPage />} />
            <Route path="/pending-cash-payments" element={<PendingCashPayments />} />
            <Route path="/sign-contract-owner/:contractId" element={<ContractSigningWrapper userRole="OWNER" />} />
            <Route path="/sign-contract-owner/:contractId/extension/:extensionId" element={<ContractSigningWrapper userRole="OWNER" />} />
            <Route path="/owner-inventory-requests" element={<OwnerInventoryRequests />} />
            <Route path="/owner-inventory" element={<OwnerInventoryPage />} />
          </Route>
        </Route>


        {/* ── OPERATOR ONLY: Quản lý ca làm ── */}
        <Route element={<RoleBasedRoute allowedRoles={['OPERATOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/create-shift" element={<CreateShiftPage />} />
          </Route>
        </Route>

        {/* ── OPERATOR / MANAGER: quản lý nhân sự kho (OWNER thuần không thấy) ── */}
        <Route element={<RoleBasedRoute allowedRoles={['OPERATOR', 'MANAGER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/create-staff" element={<CreateStaff />} />
            <Route path="/list-staff" element={<ListStaff />} />
            <Route path="/shift-scheduling" element={<ShiftSchedulingPage />} />
            <Route path="/task-scheduling" element={<TaskSchedulingPage />} />
          </Route>
        </Route>

        {/* ── MANAGER / OPERATOR: quản lý yêu cầu nhập/xuất + lịch sử ── */}
        <Route element={<RoleBasedRoute allowedRoles={['MANAGER', 'OPERATOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/inbound-requests" element={<InboundRequestsManagement />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
          </Route>
        </Route>

        {/* ── MANAGER: Chỉ Duyệt / Từ chối phiếu nhập/xuất ── */}
        <Route element={<RoleBasedRoute allowedRoles={['MANAGER', 'OPERATOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/staff-inventory-requests" element={<ManagerInventoryRequests />} />
            <Route path="/pending-capacity" element={<PendingCapacityApprovals />} />
          </Route>
        </Route>

        {/* ── STAFF: Xử lý phiếu (Verify + Confirm) ── */}
        <Route element={<RoleBasedRoute allowedRoles={['STAFF']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/staff-inventory-requests-staff" element={<StaffInventoryRequestsNew />} />
          </Route>
        </Route>

        {/* ── Nhân viên kho vận hành: STAFF/MANAGER/OPERATOR (OWNER không vận hành) ── */}
        <Route element={<RoleBasedRoute allowedRoles={['STAFF', 'MANAGER', 'OPERATOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/confirm-movement" element={<ConfirmMovement />} />
            <Route path="/staff-inventory" element={<StaffInventoryPage />} />
            <Route path="/warehouse-grid-map" element={<WarehouseGridMapPage />} />
            <Route path="/staff-audit-sessions" element={<StaffAuditSessionsPage />} />
            <Route path="/staff-audit-sessions/:id" element={<StaffAuditSessionDetailPage />} />
            <Route path="/equipment-management" element={<EquipmentManagement />} />
            <Route path="/warehouse-grid/:reqId" element={<WarehouseGridManager />} />
          </Route>
        </Route>

        {/* ── Lịch cá nhân: chỉ STAFF và MANAGER (có ca làm việc cụ thể) ── */}
        <Route element={<RoleBasedRoute allowedRoles={['STAFF', 'MANAGER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/my-schedule" element={<MySchedulePage />} />
          </Route>
        </Route>


        {/* ── RENTER (có hợp đồng thuê kho) ── */}
        <Route element={<RoleBasedRoute allowedRoles={['RENTER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/renter-dashboard" element={<RenterDashboard />} />
            <Route path="/contract-extensions-renter" element={<RenterExtensionPage />} />
            {/* Merged history page (2 tabs) */}
            <Route path="/renter-inventory-history" element={<RenterInventoryHistory />} />
            {/* Keep old routes for backward compatibility */}
            <Route path="/renter-inbound-requests" element={<RenterInboundList />} />
            <Route path="/renter-outbound-requests" element={<RenterOutboundList />} />
            <Route path="/renter-audit-sessions" element={<RenterAuditSessionsPage />} />
            <Route path="/renter-audit-sessions/:id" element={<RenterAuditSessionDetailPage />} />
            <Route path="/renter-inventory" element={<RenterInventoryPage />} />
            <Route path="/my-ratings" element={<MyRatingsPage />} />
            <Route path="/my-favorites" element={<FavoritesPage />} />
            <Route path="/ai-analyzer" element={<AiItemAnalyzerPage />} />
          </Route>
        </Route>

        {/* ── Tất cả thành viên kho (tạo yêu cầu, thanh toán) ── */}
        <Route element={<RoleBasedRoute allowedRoles={['STAFF', 'MANAGER', 'OPERATOR', 'OWNER', 'RENTER']} />}>
          <Route element={<DashboardLayout />}>
            {/* Merged create page (2 tabs) */}
            <Route path="/create-inventory" element={<CreateInventoryRequest />} />
            {/* Keep old routes for backward compatibility */}
            <Route path="/create-inbound" element={<CreateInboundRequest />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
          </Route>
        </Route>


        {/* ── Kiểm kê kho ── */}
        <Route element={<RoleBasedRoute allowedRoles={['OWNER', 'OPERATOR', 'MANAGER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/owner-audit-sessions" element={<OwnerAuditSessionsPage />} />
            <Route path="/owner-audit-sessions/:id" element={<OwnerAuditSessionDetailPage />} />
          </Route>
        </Route>

        {/* ── Admin Routes: chỉ ADMIN hệ thống ── */}
        <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/accounts" element={<AccountsPage />} />
            <Route path="/admin/pending-warehouses" element={<AdminPendingWarehousesPage />} />
            <Route path="/admin/warehouses" element={<WarehousesPage />} />
            <Route path="/admin/warehouses/:id" element={<WarehouseDetailPage />} />
            <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/ratings" element={<RatingsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        <Route path="/login" element={<AuthPage />} />

        {/* ── Catch-all 404 Not Found ── */}
        <Route path="*" element={
          <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: 'Inter, sans-serif' }}>
            <h1 style={{ fontSize: '4rem', color: '#0ea5e9', margin: 0 }}>404</h1>
            <h2 style={{ color: '#334155', fontWeight: 700 }}>Không tìm thấy trang</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <a href="/" style={{ padding: '10px 24px', background: '#0ea5e9', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Quay về Trang chủ</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
