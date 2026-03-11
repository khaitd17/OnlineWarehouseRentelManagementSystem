import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
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
import ForgotPage from "../pages/ForgotPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ProtectedRoute from "./ProtectedRoute";
import CreateWarehouse from "../pages/CreateWarehouse";
import WarehouseDetail from "../pages/WarehouseDetail";
import OwnerWarehouseList from "../pages/OwnerWarehouseList";
import EditWarehouse from "../pages/EditWarehouse";
import MyRentalRequests from "../pages/MyRentalRequests";
import PendingRentalRequests from "../pages/PendingRentalRequests";
import RentalRequestDetail from "../pages/RentalRequestDetail";
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
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes - chung cho mọi user đã đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Role-Based Routes cho OWNER */}
          <Route element={<RoleBasedRoute allowedRoles={['OWNER']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-warehouses" element={<OwnerWarehouseList />} />
              <Route path="/post-warehouse" element={<PostWarehousePage />} />
              <Route path="/create-warehouse" element={<CreateWarehouse />} />
              <Route path="/warehouse-edit/:id" element={<EditWarehouse />} />
              <Route path="/warehouse-new/:id" element={<WarehouseDetail />} />
              <Route path="/create-staff" element={<CreateStaff />} />
              <Route path="/list-staff" element={<ListStaff />} />
              <Route path="/pending-rental-requests" element={<PendingRentalRequests />} />
              <Route path="/rental-request/:id" element={<RentalRequestDetail />} />
            </Route>
          </Route>

          {/* Role-Based Routes cho STAFF/MANAGER */}
          <Route element={<RoleBasedRoute allowedRoles={['STAFF', 'MANAGER']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/staff-dashboard" element={<StaffDashboard />} />
              <Route path="/inbound-requests" element={<InboundRequestsManagement />} />
              <Route path="/outbound-requests" element={<OutboundRequestsList />} />
              <Route path="/confirm-movement" element={<ConfirmMovement />} />
              <Route path="/transaction-history" element={<TransactionHistory />} />
            </Route>
          </Route>

          {/* Role-Based Routes cho RENTER */}
          <Route element={<RoleBasedRoute allowedRoles={['RENTER']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/renter-dashboard" element={<RenterDashboard />} />
              <Route path="/renter-inbound-requests" element={<RenterInboundList />} />
              <Route path="/renter-outbound-requests" element={<RenterOutboundList />} />
              <Route path="/my-rental-requests" element={<MyRentalRequests />} />
              <Route path="/transaction-history" element={<TransactionHistory />} />
            </Route>
          </Route>

          {/* Routes cho Cả STAFF/MANAGER/OWNER/RENTER */}
          <Route element={<RoleBasedRoute allowedRoles={['STAFF', 'MANAGER', 'OWNER', 'RENTER']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/transaction-history" element={<TransactionHistory />} />
              <Route path="/create-inbound" element={<CreateInboundRequest />} />
              <Route path="/create-outbound" element={<CreateOutboundRequest />} />
            </Route>
          </Route>

        </Route>

        {/* Legacy redirect or direct access if needed */}
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;