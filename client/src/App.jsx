import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

export default function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <ErrorBoundary>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }} className="app-root-container">
        {!isAdminPage && <Navbar />}
        <div style={{ flexGrow: 1 }} className="app-main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/reservations" element={<Reservations />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Staff & Admin Portals */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/staff/login" element={<AdminLogin />} />

            {/* Role-Specific Portal Fast Shortcuts */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireStaff>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={["kitchen", "owner", "manager", "admin"]}>
                  <Navigate to="/admin/kds" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute allowedRoles={["cashier", "owner", "manager", "admin"]}>
                  <Navigate to="/admin/orders" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service"
              element={
                <ProtectedRoute allowedRoles={["waiter", "owner", "manager", "admin"]}>
                  <Navigate to="/admin/tables" replace />
                </ProtectedRoute>
              }
            />

            {/* Protected Customer Routes */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin & Staff Workspace */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireStaff>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:tab"
              element={
                <ProtectedRoute requireStaff>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {!isAdminPage && <Footer />}
        <MobileBottomNav />
      </div>
    </ErrorBoundary>
  );
}
