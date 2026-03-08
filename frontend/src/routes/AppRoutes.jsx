import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
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
import ProtectedRoute from "./ProtectedRoute";
import CreateWarehouse from "../pages/CreateWarehouse";
import WarehouseDetail from "../pages/WarehouseDetail";
import OwnerWarehouseList from "../pages/OwnerWarehouseList";
import EditWarehouse from "../pages/EditWarehouse";
import MyRentalRequests from "../pages/MyRentalRequests";
import PendingRentalRequests from "../pages/PendingRentalRequests";
import RentalRequestDetail from "../pages/RentalRequestDetail";

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
            <Route path="/create-warehouse" element={<CreateWarehouse />} />
            <Route path="/warehouse-edit/:id" element={<EditWarehouse />} />
            <Route path="/warehouse-new/:id" element={<WarehouseDetail />} />        
            <Route path="/my-warehouses" element={<OwnerWarehouseList />} />
            <Route path="/create-staff" element={<CreateStaff />} />
            <Route path="/list-staff" element={<ListStaff />} />
            <Route path="/my-rental-requests" element={<MyRentalRequests />} />
            <Route path="/pending-rental-requests" element={<PendingRentalRequests />} />
            <Route path="/rental-request/:id" element={<RentalRequestDetail />} />
          </Route>
        </Route>

        {/* Legacy redirect or direct access if needed */}
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;