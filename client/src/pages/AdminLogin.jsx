import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const ROLE_CONFIG = {
  owner: {
    roleName: "Owner & General Admin",
    badge: "Full Authority",
    badgeColor: "#ffcc00",
    defaultTab: "overview",
    desc: "Complete command across restaurant revenue, staff payroll, system config & Daraja reconciliations.",
  },
  manager: {
    roleName: "Operations Manager",
    badge: "Operations",
    badgeColor: "#38bdf8",
    defaultTab: "overview",
    desc: "Supervises live orders, menu catalog, stock inventory, and customer loyalty adjustments.",
  },
  cashier: {
    roleName: "Head Cashier / POS",
    badge: "Point of Sale",
    badgeColor: "#4ade80",
    defaultTab: "orders",
    desc: "Processes guest bill checkouts, M-Pesa push verification, and daily reconciliation batches.",
  },
  kitchen: {
    roleName: "Executive Kitchen Chef",
    badge: "Kitchen KDS",
    badgeColor: "#f97316",
    defaultTab: "kds",
    desc: "Controls live kitchen display queue, advances preparation stages (Pending → Cooking → Ready).",
  },
  waiter: {
    roleName: "Floor Captain & Waiter",
    badge: "Floor & Tables",
    badgeColor: "#a855f7",
    defaultTab: "tables",
    desc: "Monitors table status (Available, Occupied, Reserved) and handles guest reservation seating.",
  },
  accountant: {
    roleName: "Senior Accountant",
    badge: "Financials",
    badgeColor: "#ec4899",
    defaultTab: "reports",
    desc: "Accesses audit logs, daily revenue reports, payment method breakdowns, and fiscal exports.",
  },
  admin: {
    roleName: "System Administrator",
    badge: "Full Authority",
    badgeColor: "#ffcc00",
    defaultTab: "overview",
    desc: "System administration and operations oversight.",
  },
};

function getRoleDefaultTab(role) {
  const conf = ROLE_CONFIG[(role || "").toLowerCase()];
  return conf ? conf.defaultTab : "overview";
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTabRole, setActiveTabRole] = useState(null);
  const [staffAccounts, setStaffAccounts] = useState([]);

  const { user, adminLogin, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location]);

  // Load live staff accounts from PostgreSQL database
  useEffect(() => {
    api
      .getStaff()
      .then((data) => {
        if (data.staff && data.staff.length > 0) {
          const formatted = data.staff.map((s) => {
            const conf = ROLE_CONFIG[s.role] || ROLE_CONFIG.owner;
            return {
              role: s.role,
              title: s.name,
              email: s.email,
              roleName: conf.roleName,
              badge: conf.badge,
              badgeColor: conf.badgeColor,
              defaultTab: conf.defaultTab,
              desc: conf.desc,
            };
          });
          setStaffAccounts(formatted);
        }
      })
      .catch(() => {
        // Ignored
      });
  }, []);

  const userRole = (user?.role || (user?.is_admin ? "owner" : "customer")).toLowerCase();
  const isAlreadyStaff = user && (user.is_admin || ["owner", "manager", "cashier", "kitchen", "waiter", "accountant", "admin"].includes(userRole));

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let staffUser;
      if (typeof adminLogin === "function") {
        staffUser = await adminLogin(email, password);
      } else {
        const res = await api.adminLogin({ email, password });
        staffUser = res.user;
        if (refreshUser) await refreshUser();
      }

      const role = staffUser?.role || "owner";
      const targetTab = getRoleDefaultTab(role);
      navigate(`/admin/${targetTab}`);
    } catch (err) {
      setError(err.message || "Failed to authenticate staff member. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickDemoRole(role) {
    setError("");
    setLoading(true);
    try {
      const res = await api.switchDemoRole(role);
      if (refreshUser) await refreshUser();
      const targetTab = getRoleDefaultTab(res.user?.role || role);
      navigate(`/admin/${targetTab}`);
    } catch (err) {
      setError(err.message || "Failed to switch role.");
    } finally {
      setLoading(false);
    }
  }

  function handleAutofill(account) {
    setEmail(account.email);
    setPassword("password123");
    setActiveTabRole(account.role);
    setError("");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--light-bg)", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {/* Top Header Banner - Restoran Style */}
        <div
          style={{
            background: "var(--restoran-dark)",
            borderBottom: "4px solid var(--primary)",
            borderRadius: "var(--border-radius)",
            padding: "36px 30px",
            boxShadow: "var(--shadow)",
            marginBottom: "28px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "26px",
              boxShadow: "0 6px 20px rgba(212, 167, 74, 0.4)",
            }}
          >
            <i className="fa fa-utensils"></i>
          </div>
          <span style={{ fontFamily: "Pacifico, cursive", color: "var(--primary)", fontSize: "18px", display: "block", marginBottom: "4px" }}>
            Jiwekee Tavern & Grill
          </span>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", color: "#fff", fontSize: "32px", fontWeight: "900", margin: "0 0 10px 0", letterSpacing: "-0.5px" }}>
            Staff & Administrative Operations Gateway
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "15px", maxWidth: "620px", margin: "0 auto", lineHeight: "1.6" }}>
            Authorized internal access for floor servers, kitchen display station, order fulfillment, and fiscal management.
          </p>
        </div>

        {/* Existing active session notice if user is already logged in as staff */}
        {isAlreadyStaff && (
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid var(--primary)",
              borderRadius: "var(--border-radius)",
              padding: "18px 24px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              boxShadow: "var(--shadow-hover)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(212, 167, 74, 0.15)",
                  color: "var(--primary-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                <i className="fa fa-user-check"></i>
              </div>
              <div>
                <div style={{ color: "var(--secondary)", fontWeight: "800", fontSize: "16px", fontFamily: "Nunito, sans-serif" }}>
                  Currently active as: <span style={{ color: "var(--primary-dark)" }}>{user.name}</span>
                </div>
                <div style={{ color: "var(--gray)", fontSize: "13px" }}>
                  Assigned Role: <strong style={{ textTransform: "uppercase", color: "var(--secondary)" }}>{userRole}</strong> • Email: {user.email}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate(`/admin/${getRoleDefaultTab(userRole)}`)}
                className="btn-restoran-primary"
              >
                <i className="fa fa-tachometer-alt"></i> Go to Operations Hub →
              </button>
              <button
                onClick={async () => {
                  await logout();
                  setError("");
                }}
                className="btn-restoran-secondary"
              >
                <i className="fa fa-sign-out-alt"></i> Sign Out
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.15fr", gap: "28px" }}>
          {/* Left Column: Direct Staff Authentication Form */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--light-gray)",
              borderTop: "4px solid var(--primary)",
              borderRadius: "var(--border-radius)",
              padding: "32px 28px",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontFamily: "Nunito, sans-serif", color: "var(--secondary)", fontSize: "20px", fontWeight: "800", margin: 0 }}>
                  Staff Sign In
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(212, 167, 74, 0.12)",
                    color: "var(--primary-dark)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    fontWeight: "800",
                    border: "1px solid rgba(212, 167, 74, 0.3)",
                  }}
                >
                  <i className="fa fa-lock" style={{ marginRight: "4px" }}></i> PostgreSQL & JWT
                </span>
              </div>

              <p style={{ color: "var(--gray)", fontSize: "13.5px", margin: "0 0 24px 0", lineHeight: "1.5" }}>
                Enter your authorized employee credentials. Authenticated against the PostgreSQL staff database.
              </p>

              <form onSubmit={handleAdminSubmit}>
                <div style={{ marginBottom: "18px" }}>
                  <label
                    htmlFor="staff-email"
                    className="restoran-label"
                  >
                    Staff Work Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="staff-email"
                      type="email"
                      required
                      placeholder="e.g. admin@jiwekee.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setActiveTabRole(null);
                      }}
                      className="restoran-input"
                      style={{ paddingLeft: "38px" }}
                    />
                    <i
                      className="fa fa-envelope"
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--gray)",
                        fontSize: "14px",
                      }}
                    ></i>
                  </div>
                </div>

                <div style={{ marginBottom: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label
                      htmlFor="staff-password"
                      className="restoran-label"
                      style={{ margin: 0 }}
                    >
                      Staff Access Key / Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="staff-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter assigned password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="restoran-input"
                      style={{ paddingLeft: "38px" }}
                    />
                    <i
                      className="fa fa-key"
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--gray)",
                        fontSize: "14px",
                      }}
                    ></i>
                  </div>
                  <div style={{ color: "var(--gray)", fontSize: "11.5px", marginTop: "6px" }}>
                    Standard seed password: <code>Admin123!</code> or <code>password123</code>
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#B91C1C",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      marginBottom: "20px",
                      lineHeight: "1.4",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <i className="fa fa-exclamation-circle"></i>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-restoran-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px" }}
                >
                  {loading ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i> Authenticating Staff...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-sign-in-alt"></i> Authenticate & Open Hub →
                    </>
                  )}
                </button>
              </form>
            </div>

            <div style={{ marginTop: "28px", paddingTop: "18px", borderTop: "1px solid var(--light-gray)", textAlign: "center" }}>
              <Link
                to="/login"
                style={{ color: "var(--gray)", fontSize: "13.5px", fontWeight: "600", textDecoration: "none" }}
              >
                ← Switch to Customer Ordering Portal
              </Link>
            </div>
          </div>

          {/* Right Column: Database-backed Staff Directory & Fast Access */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--light-gray)",
              borderTop: "4px solid var(--primary)",
              borderRadius: "var(--border-radius)",
              padding: "32px 28px",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontFamily: "Nunito, sans-serif", color: "var(--secondary)", fontSize: "20px", fontWeight: "800", margin: 0 }}>
                Role-Based Access Hierarchy
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  background: "rgba(46, 125, 50, 0.12)",
                  color: "var(--color-success)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  fontWeight: "800",
                  border: "1px solid rgba(46, 125, 50, 0.25)",
                }}
              >
                ● Live Database
              </span>
            </div>

            <p style={{ color: "var(--gray)", fontSize: "13px", margin: "0 0 18px 0", lineHeight: "1.5" }}>
              Click <strong>"Autofill"</strong> to populate credentials into the form, or <strong>"1-Click"</strong> to instantly sign in and test RBAC permissions:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
              {staffAccounts.map((acc) => (
                <div
                  key={acc.email}
                  style={{
                    background: activeTabRole === acc.role ? "rgba(212, 167, 74, 0.08)" : "var(--light-bg)",
                    border: `1.5px solid ${activeTabRole === acc.role ? "var(--primary)" : "var(--light-gray)"}`,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    transition: "var(--transition)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: "800", fontSize: "14.5px", color: "var(--secondary)" }}>
                          {acc.title}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            background: "#FFFFFF",
                            color: acc.badgeColor || "var(--primary-dark)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: "800",
                            border: "1px solid var(--light-gray)",
                          }}
                        >
                          {acc.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "2px" }}>
                        {acc.email}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleAutofill(acc)}
                        className="btn-restoran-secondary"
                        style={{ padding: "4px 10px", fontSize: "11.5px" }}
                        title="Fill into login form"
                      >
                        Autofill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoRole(acc.role)}
                        disabled={loading}
                        className="btn-restoran-primary"
                        style={{ padding: "4px 12px", fontSize: "11.5px" }}
                        title="Sign in immediately"
                      >
                        1-Click →
                      </button>
                    </div>
                  </div>

                  <p style={{ color: "var(--gray)", fontSize: "12px", margin: "6px 0 0 0", lineHeight: "1.4" }}>
                    {acc.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
