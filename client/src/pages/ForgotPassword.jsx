import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.forgotPassword({ email });
      setSuccess(true);
      if (res.resetUrl) {
        setResetUrl(res.resetUrl);
      }
    } catch (err) {
      setError(err.message || "Failed to process request. Please try again.");
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
            <i className="fa fa-key"></i>
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "26px", fontWeight: "800", color: "var(--restoran-dark)", margin: "0 0 6px" }}>
            Forgot Password
          </h2>
          <p className="login-card-subtitle" style={{ margin: 0 }}>
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                padding: "16px",
                background: "rgba(63, 125, 88, 0.12)",
                border: "1px solid #3f7d58",
                color: "#276749",
                borderRadius: "10px",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              <strong>Check your email / link:</strong>
              <p style={{ margin: "6px 0 0" }}>
                If an account with <strong>{email}</strong> exists, a password reset link has been generated.
              </p>
            </div>

            {resetUrl && (
              <div
                style={{
                  padding: "14px",
                  background: "var(--color-surface-soft)",
                  borderRadius: "8px",
                  border: "1px dashed var(--restoran-primary)",
                  marginBottom: "20px",
                  fontSize: "13px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: "700", color: "var(--restoran-primary)", marginBottom: "4px" }}>
                  Demo / Development Direct Link:
                </div>
                <a
                  href={resetUrl}
                  style={{
                    color: "var(--restoran-dark)",
                    wordBreak: "break-all",
                    textDecoration: "underline",
                    fontWeight: "600",
                  }}
                >
                  {resetUrl}
                </a>
                <div style={{ marginTop: "10px" }}>
                  <Link
                    to={resetUrl.replace(window.location.origin, "")}
                    className="btn-action-sm btn-action-primary"
                    style={{ display: "inline-block", textAlign: "center", width: "100%", padding: "10px" }}
                  >
                    Proceed to Reset Password →
                  </Link>
                </div>
              </div>
            )}

            <Link
              to="/login"
              style={{
                color: "var(--restoran-primary)",
                fontWeight: "700",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ← Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-input-group">
              <label htmlFor="email">Registered Email Address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="e.g. yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              }}
            >
              {loading ? "Generating Link..." : "Send Reset Link →"}
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
                Remember your password? <strong style={{ color: "var(--restoran-primary)" }}>Sign In</strong>
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
