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
    <div style={{ maxWidth: "1020px", margin: "40px auto", padding: "0 20px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(180deg, #1f1a14 0%, #141414 100%)",
          border: "1px solid #33281c",
          borderRadius: "16px",
          padding: "36px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.7)",
          marginBottom: "24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#fff", fontSize: "30px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
            Jiwekee Operations & Staff Gateway
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "15px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            Dedicated internal authentication for restaurant operations, floor staff, kitchen display system, and financial administration.
          </p>
        </div>

        {/* Existing session indicator if user already logged in */}
        {isAlreadyStaff && (
          <div
            style={{
              background: "rgba(255, 204, 0, 0.08)",
              border: "1px solid #ffcc0044",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>
                  Currently active as: <span style={{ color: "#ffcc00" }}>{user.name}</span>
                </div>
                <div style={{ color: "#888", fontSize: "13px" }}>
                  Role: <strong style={{ textTransform: "uppercase", color: "#ccc" }}>{userRole}</strong> • Email: {user.email}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate(`/admin/${getRoleDefaultTab(userRole)}`)}
                style={{
                  background: "linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)",
                  color: "#111",
                  border: "none",
                  fontWeight: "700",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Go to Operations Hub →
              </button>
              <button
                onClick={async () => {
                  await logout();
                  setError("");
                }}
                style={{
                  background: "#222",
                  color: "#aaa",
                  border: "1px solid #444",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.15fr", gap: "32px" }}>
          {/* Left Column: Direct Staff Authentication Form */}
          <div
            style={{
              background: "#181818",
              border: "1px solid #2a2a2a",
              borderRadius: "14px",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  Staff Sign In
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    background: "#282828",
                    color: "#888",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: "1px solid #383838",
                  }}
                >
                  PostgreSQL & JWT Secured
                </span>
              </div>

              <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px 0", lineHeight: "1.5" }}>
                Enter your authorized employee credentials. Authenticated against PostgreSQL database users table.
              </p>

              <form onSubmit={handleAdminSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    htmlFor="staff-email"
                    style={{ display: "block", color: "#bbb", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}
                  >
                    Staff Work Email
                  </label>
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
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#101010",
                      border: "1px solid #3d3d3d",
                      color: "#fff",
                      padding: "11px 14px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#ffcc00")}
                    onBlur={(e) => (e.target.style.borderColor = "#3d3d3d")}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label
                      htmlFor="staff-password"
                      style={{ color: "#bbb", fontSize: "13px", fontWeight: "600" }}
                    >
                      Staff Access Key / Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ffcc00",
                        fontSize: "12px",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id="staff-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter assigned password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#101010",
                      border: "1px solid #3d3d3d",
                      color: "#fff",
                      padding: "11px 14px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#ffcc00")}
                    onBlur={(e) => (e.target.style.borderColor = "#3d3d3d")}
                  />
                  <div style={{ color: "#666", fontSize: "11px", marginTop: "4px" }}>
                    Password: <code>Admin123!</code> or <code>password123</code>
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid #ef4444",
                      color: "#fca5a5",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      marginBottom: "18px",
                      lineHeight: "1.4",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)",
                    color: "#111",
                    fontWeight: "800",
                    padding: "13px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "15px",
                    boxShadow: "0 4px 14px rgba(255, 204, 0, 0.25)",
                    transition: "transform 0.1s ease",
                  }}
                >
                  {loading ? "Authenticating Staff..." : "Authenticate & Open Hub →"}
                </button>
              </form>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #282828", textAlign: "center" }}>
              <Link to="/login" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>
                ← Switch to Customer Ordering Portal
              </Link>
            </div>
          </div>

          {/* Right Column: Database-backed Staff Directory & Fast Access */}
          <div
            style={{
              background: "#181818",
              border: "1px solid #2a2a2a",
              borderRadius: "14px",
              padding: "26px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                Role-Based Access Hierarchy
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  background: "rgba(255,204,0,0.12)",
                  color: "#ffcc00",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  border: "1px solid #ffcc0033",
                }}
              >
                Database Driven
              </span>
            </div>

            <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              Click <strong>"Autofill"</strong> to populate credentials into the form, or <strong>"1-Click"</strong> to instantly sign in and test RBAC permissions:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "440px", overflowY: "auto", paddingRight: "4px" }}>
              {staffAccounts.map((acc) => (
                <div
                  key={acc.email}
                  style={{
                    background: activeTabRole === acc.role ? "#25221b" : "#1f1f1f",
                    border: `1px solid ${activeTabRole === acc.role ? "#ffcc00" : "#303030"}`,
                    borderRadius: "10px",
                    padding: "12px 14px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "700", fontSize: "14px", color: "#fff" }}>
                          {acc.title}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            background: "#2a2a2a",
                            color: acc.badgeColor,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "700",
                          }}
                        >
                          {acc.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>
                        {acc.email}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleAutofill(acc)}
                        style={{
                          background: "#2d2d2d",
                          color: "#ccc",
                          border: "1px solid #444",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                        title="Fill into login form"
                      >
                        Autofill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoRole(acc.role)}
                        disabled={loading}
                        style={{
                          background: "linear-gradient(135deg, #ffcc00 0%, #ff8800 100%)",
                          color: "#111",
                          border: "none",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          fontSize: "11px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "800",
                        }}
                        title="Sign in immediately"
                      >
                        1-Click →
                      </button>
                    </div>
                  </div>

                  <p style={{ color: "#777", fontSize: "11.5px", margin: "4px 0 0 0", lineHeight: "1.4" }}>
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
