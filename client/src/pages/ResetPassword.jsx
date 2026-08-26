import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ResetPassword() {
  const { token: paramToken } = useParams();
  const [token, setToken] = useState(paramToken || "");
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError("No reset token provided. Please use the link sent to your email.");
      return;
    }

    setVerifying(true);
    setError("");

    api
      .verifyResetToken(token)
      .then((res) => {
        if (res.valid) {
          setTokenValid(true);
          setUserEmail(res.email || "");
          setUserName(res.name || "");
        } else {
          setError(res.error || "Invalid or expired reset token.");
        }
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired reset token. Please request a new link.");
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-type carefully.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword({ token, password, confirmPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3500);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "60px 24px 100px", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="login-card" style={{ maxWidth: "460px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(254, 161, 22, 0.15)",
              color: "var(--restoran-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 14px",
            }}
          >
            <i className="fa fa-lock"></i>
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "26px", fontWeight: "800", color: "var(--restoran-dark)", margin: "0 0 6px" }}>
            Set New Password
          </h2>
          {userEmail && (
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
              Resetting password for <strong>{userName || userEmail}</strong> ({userEmail})
            </p>
          )}
        </div>

        {verifying ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#888" }}>
            <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "var(--restoran-primary)", marginBottom: "10px" }}></i>
            <p>Verifying secure reset token...</p>
          </div>
        ) : error && !tokenValid ? (
          <div style={{ textAlign: "center" }}>
            <div className="form-error" style={{ marginBottom: "20px" }}>{error}</div>
            <Link to="/forgot-password" className="btn-action-sm btn-action-primary" style={{ padding: "10px 20px" }}>
              Request New Reset Link →
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                padding: "20px",
                background: "rgba(63, 125, 88, 0.12)",
                border: "1px solid #3f7d58",
                color: "#276749",
                borderRadius: "10px",
                fontSize: "14.5px",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎉</div>
              <strong>Password Reset Successfully!</strong>
              <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
                You will be redirected to the sign in page in a few moments...
              </p>
            </div>

            <Link
              to="/login"
              className="btn-action-sm btn-action-primary"
              style={{ display: "inline-block", width: "100%", padding: "12px", textAlign: "center" }}
            >
              Sign In Now →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

            {!paramToken && (
              <div className="form-input-group">
                <label htmlFor="token">Reset Token</label>
                <input
                  id="token"
                  type="text"
                  required
                  placeholder="Paste your reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            )}

            <div className="form-input-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label htmlFor="password" style={{ margin: 0 }}>New Password *</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: "none", border: "none", color: "var(--restoran-primary)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-input-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
              style={{
                background: "var(--restoran-primary)",
                fontFamily: "var(--font-heading)",
                fontWeight: "800",
                marginTop: "12px",
              }}
            >
              {loading ? "Updating Password..." : "Update Password →"}
            </button>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Link
                to="/login"
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Cancel and return to <strong style={{ color: "var(--restoran-primary)" }}>Sign In</strong>
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
