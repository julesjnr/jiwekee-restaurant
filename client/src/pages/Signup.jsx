import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", loyalty: true });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please verify your entries.");
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      navigate("/menu");
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "40px 24px 80px" }}>
      <div className="login-card">
        <h2>Join Jiwekee Club</h2>
        <span className="login-card-subtitle">Earn reward points and order seamlessly</span>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-input-group">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              required
              placeholder="e.g. Julius Mwangi"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="form-input-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              required
              placeholder="e.g. julius@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="form-input-group">
            <label htmlFor="phone">Phone Number (M-Pesa Checkout)</label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. 0712345678"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div className="form-input-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password *</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", color: "var(--color-accent)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Create a strong password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>

          <div className="form-input-group">
            <label htmlFor="confirm_password">Confirm Password *</label>
            <input
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
          </div>

          <div className="loyalty-check">
            <input
              id="loyalty"
              type="checkbox"
              checked={form.loyalty}
              onChange={(e) => update("loyalty", e.target.checked)}
              style={{ width: "auto", accentColor: "var(--color-accent)" }}
            />
            <label htmlFor="loyalty" style={{ margin: 0, fontSize: "13px" }}>
              Enroll in Jiwekee Rewards to earn points on every order
            </label>
          </div>

          <button type="submit" className="btn-login-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Free Account →"}
          </button>
        </form>

        <p className="login-redirect-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </main>
  );
}
