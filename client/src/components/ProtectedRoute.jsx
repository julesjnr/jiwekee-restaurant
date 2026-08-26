import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute component
 * Restricts access to authenticated users and verifies role-based permissions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authorized
 * @param {string[]|string} [props.allowedRoles] - Specific roles allowed to access this route
 * @param {boolean} [props.requireStaff=false] - Whether this route strictly requires restaurant staff/admin
 * @param {string} [props.redirectTo] - Custom redirection path if unauthenticated
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requireStaff = false,
  redirectTo,
}) {
  const { user, loading, isAuthenticated, hasRole, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(212, 167, 74, 0.2)",
            borderTopColor: "var(--color-accent, #D4A74A)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "var(--color-text-muted, #756D66)", fontSize: "14px", fontWeight: "600" }}>
          Verifying security credentials...
        </p>
      </div>
    );
  }

  const isStaffRoute = location.pathname.startsWith("/admin") || requireStaff;

  // If not authenticated, redirect to appropriate login portal
  if (!isAuthenticated || !user) {
    const fallbackPath = redirectTo || (isStaffRoute ? "/admin/login" : "/login");
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If staff/admin is required
  if (isStaffRoute && !isStaff) {
    return (
      <Navigate
        to="/admin/login"
        state={{ error: "Access restricted: Restaurant staff credentials required." }}
        replace
      />
    );
  }

  // If specific roles are specified
  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <Navigate
        to="/dashboard"
        state={{ error: "You do not have permission to view that section." }}
        replace
      />
    );
  }

  return children;
}
