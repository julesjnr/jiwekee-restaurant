import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import NotificationBell from "../components/admin/NotificationBell";
import AdminOverview from "../components/admin/AdminOverview";
import AdminOrders from "../components/admin/AdminOrders";
import AdminKDS from "../components/admin/AdminKDS";
import AdminMenu from "../components/admin/AdminMenu";
import AdminTables from "../components/admin/AdminTables";
import AdminReservations from "../components/admin/AdminReservations";
import AdminInventory from "../components/admin/AdminInventory";
import AdminCRM from "../components/admin/AdminCRM";
import AdminReconciliation from "../components/admin/AdminReconciliation";
import AdminReports from "../components/admin/AdminReports";
import AdminStaff from "../components/admin/AdminStaff";
import AdminAudit from "../components/admin/AdminAudit";

const ALL_TABS = [
  { id: "overview", label: "Overview", icon: "fa-chart-pie", roles: ["owner", "manager"], aliases: ["dashboard"] },
  { id: "orders", label: "Orders & Fulfillment", icon: "fa-receipt", roles: ["owner", "manager", "cashier", "waiter"], aliases: [] },
  { id: "kds", label: "Kitchen KDS", icon: "fa-fire", roles: ["owner", "manager", "kitchen"], aliases: ["kitchen"] },
  { id: "menu", label: "Menu Management", icon: "fa-utensils", roles: ["owner", "manager"], aliases: [] },
  { id: "tables", label: "Floor & Tables", icon: "fa-chair", roles: ["owner", "manager", "waiter"], aliases: [] },
  { id: "reservations", label: "Reservations Desk", icon: "fa-calendar-check", roles: ["owner", "manager", "waiter"], aliases: [] },
  { id: "inventory", label: "Stock & Inventory", icon: "fa-boxes", roles: ["owner", "manager"], aliases: [] },
  { id: "crm", label: "CRM & Loyalty", icon: "fa-users", roles: ["owner", "manager"], aliases: ["customers", "loyalty"] },
  { id: "reconciliation", label: "Payments & Ledger", icon: "fa-file-invoice-dollar", roles: ["owner", "manager", "cashier", "accountant"], aliases: ["payments"] },
  { id: "reports", label: "Reports & KPIs", icon: "fa-chart-line", roles: ["owner", "manager", "accountant"], aliases: [] },
  { id: "staff", label: "Staff & Roles", icon: "fa-user-shield", roles: ["owner"], aliases: [] },
  { id: "audit", label: "Audit Trail", icon: "fa-history", roles: ["owner", "manager", "accountant"], aliases: ["activity"] },
];

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userRole = (user?.role || (user?.is_admin ? "owner" : "customer")).toLowerCase();

  // Determine allowed tabs for current user
  const allowedTabs = useMemo(() => {
    if (!user) return [];
    if (user.is_admin || userRole === "owner") return ALL_TABS;
    return ALL_TABS.filter((t) => t.roles.includes(userRole));
  }, [user, userRole]);

  // Resolve requested tab from URL path param or query string
  const requestedTabKey = (params.tab || searchParams.get("tab") || "overview").toLowerCase();
  
  // Find matching tab definition
  const matchingTab = ALL_TABS.find(
    (t) => t.id === requestedTabKey || t.aliases.includes(requestedTabKey)
  );

  const initialTabId = useMemo(() => {
    if (matchingTab && allowedTabs.some((t) => t.id === matchingTab.id)) {
      return matchingTab.id;
    }
    return allowedTabs.length > 0 ? allowedTabs[0].id : "overview";
  }, [matchingTab, allowedTabs]);

  const [activeTab, setActiveTab] = useState(initialTabId);

  // Sync state if initialTabId changes
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.some((t) => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id);
    } else if (matchingTab && allowedTabs.some((t) => t.id === matchingTab.id)) {
      setActiveTab(matchingTab.id);
    }
  }, [allowedTabs, matchingTab, activeTab]);

  // Redirect if non-staff
  useEffect(() => {
    if (user && !user.is_admin && (!user.role || user.role === "customer")) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="admin-page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "36px", color: "var(--primary)", marginBottom: "16px" }}>
          <i className="fa fa-spinner fa-spin"></i>
        </div>
        <h3 style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, color: "var(--secondary)" }}>
          Authenticating Administrative Credentials...
        </h3>
      </div>
    );
  }

  function handleTabClick(tabId) {
    setActiveTab(tabId);
    navigate(`/admin/${tabId}`);
  }

  return (
    <div className="admin-page-container">
      {/* Top Header - Restoran Style */}
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "24px",
              boxShadow: "0 4px 15px rgba(212, 167, 74, 0.4)",
            }}
          >
            <i className="fa fa-utensils"></i>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 className="admin-header-title">
                Jiwekee Operations Hub
              </h1>
              <span className="admin-role-badge">
                <i className="fa fa-shield-alt" style={{ marginRight: "4px" }}></i>
                {userRole}
              </span>
            </div>
            <p className="admin-header-subtitle">
              Active Staff: <strong>{user.name}</strong> ({user.email}) • <span style={{ color: "var(--primary)" }}>● Live System ({currentTime})</span>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <NotificationBell />
          <button
            onClick={() => navigate("/menu")}
            className="btn-restoran-secondary"
            style={{ background: "rgba(255, 255, 255, 0.1)", color: "#FFFFFF", borderColor: "rgba(255, 255, 255, 0.2)" }}
          >
            <i className="fa fa-arrow-left"></i> Customer Menu
          </button>
          <button
            onClick={async () => {
              if (logout) await logout();
              navigate("/admin-login");
            }}
            className="btn-restoran-secondary"
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#FCA5A5", borderColor: "rgba(239, 68, 68, 0.3)" }}
            title="Sign out of staff session"
          >
            <i className="fa fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Role-Filtered with Icons) */}
      <div className="admin-tabs-nav">
        {allowedTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`admin-tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            <i className={`fa ${tab.icon || "fa-circle"}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && <AdminOverview onNavigateTab={handleTabClick} />}
      {activeTab === "orders" && <AdminOrders />}
      {activeTab === "kds" && <AdminKDS />}
      {activeTab === "menu" && <AdminMenu />}
      {activeTab === "tables" && <AdminTables />}
      {activeTab === "reservations" && <AdminReservations />}
      {activeTab === "inventory" && <AdminInventory />}
      {activeTab === "crm" && <AdminCRM />}
      {activeTab === "reconciliation" && <AdminReconciliation />}
      {activeTab === "reports" && <AdminReports />}
      {activeTab === "staff" && <AdminStaff />}
      {activeTab === "audit" && <AdminAudit />}
    </div>
  );
}
