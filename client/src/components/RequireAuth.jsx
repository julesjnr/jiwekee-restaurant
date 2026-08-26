import ProtectedRoute from "./ProtectedRoute";

/**
 * RequireAuth wraps ProtectedRoute for backward compatibility across the application.
 */
export default function RequireAuth({ children, requireStaff = false, allowedRoles }) {
  return (
    <ProtectedRoute requireStaff={requireStaff} allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}
