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
import ForgotPage from "../pages/ForgotPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ProtectedRoute from "./ProtectedRoute";

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
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/post-warehouse" element={<PostWarehousePage />} />
            <Route path="/create-staff" element={<CreateStaff />} />
            <Route path="/list-staff" element={<ListStaff />} />
          </Route>
        </Route>

        {/* Legacy redirect or direct access if needed */}
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;