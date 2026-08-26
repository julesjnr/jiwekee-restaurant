import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const REMEMBER_KEY = "jiwekee_remembered_email";
const REMEMBER_FLAG = "jiwekee_remember_me";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load remembered email on mount if previously stored
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_KEY);
      const savedFlag = localStorage.getItem(REMEMBER_FLAG);
      if (savedEmail) {
        setEmail(savedEmail);
      }
      if (savedFlag !== null) {
        setRememberMe(savedFlag === "true");
      }
    } catch (_e) {
      // ignore storage access errors
    }

    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location]);

  // Client-side input validation
  function validateForm() {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address (e.g. foodie@example.com).";
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Determine redirection destination based on user role
  function getRedirectPath(user) {
    // If a redirect origin was specified in navigation state, honor it for customer routes
    const fromPath = location.state?.from?.pathname;
    const role = (user?.role || "").toLowerCase();
    const isAdmin = Boolean(user?.is_admin || role === "owner" || role === "manager" || role === "admin");

    if (fromPath && !fromPath.startsWith("/login") && !fromPath.startsWith("/signup")) {
      return fromPath;
    }

    if (isAdmin) {
      return "/admin/dashboard";
    }
    if (role === "kitchen" || role === "chef") {
      return "/kitchen";
    }
    if (role === "cashier") {
      return "/pos";
    }
    if (role === "waiter") {
      return "/service";
    }
    if (role === "accountant") {
      return "/admin/reports";
    }

    // Default for customer accounts
    return "/menu";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const authUser = await login(email.trim(), password, rememberMe);

      // Manage Remember Me preference
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, email.trim());
          localStorage.setItem(REMEMBER_FLAG, "true");
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          localStorage.setItem(REMEMBER_FLAG, "false");
        }
      } catch (_e) {
        // ignore storage errors
      }

      // Role-based redirection
      const destination = getRedirectPath(authUser);
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.message || "Failed to sign in. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page-container">
      <div className="login-card-wrapper">
        {/* Header Section */}
        <div className="login-header-section">
          <div className="login-brand-icon-wrapper">
            <span className="login-brand-icon" role="img" aria-label="Restaurant Cloche">
              🍽️
            </span>
          </div>
          <h1 className="login-main-title">Welcome Back</h1>
          <p className="login-sub-title">Sign in to your Jiwekee dining & loyalty profile</p>
        </div>

        {/* User-friendly Error Alert */}
        {error && (
          <div className="login-error-banner" role="alert">
            <svg
              className="login-error-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="18"
              height="18"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                className={`login-input-field ${fieldErrors.email ? "input-error" : ""}`}
                placeholder="e.g. foodie@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: null }));
                  }
                }}
                autoComplete="email"
                required
              />
            </div>
            {fieldErrors.email && (
              <span style={{ color: "#E53E3E", fontSize: "12px", marginTop: "2px", fontWeight: "500" }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`login-input-field ${fieldErrors.password ? "input-error" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: null }));
                  }
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  /* Eye Off Icon */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Eye Icon */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <span style={{ color: "#E53E3E", fontSize: "12px", marginTop: "2px", fontWeight: "500" }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="login-options-row">
            <label className="login-remember-wrapper">
              <input
                type="checkbox"
                className="login-remember-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="login-remember-label">Remember me</span>
            </label>

            <Link to="/forgot-password" className="login-forgot-link">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Action */}
          <button type="submit" className="btn-login-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="login-btn-spinner" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <span style={{ fontSize: "16px" }}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Register Prompt */}
        <p className="login-register-prompt">
          Don't have a dining account?{" "}
          <Link to="/register" className="login-register-link">
            Register here
          </Link>
        </p>

        {/* Restaurant Staff & Management Portal Section */}
        <div className="login-staff-divider">
          <span className="login-staff-divider-text">Restaurant Staff & Management Portal</span>
        </div>

        <Link to="/staff/login" className="login-staff-btn">
          <span className="login-staff-btn-icon">⚡</span>
          <span>Restaurant Staff & Management Portal →</span>
        </Link>
      </div>
    </main>
  );
}
