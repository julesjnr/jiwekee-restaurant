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

// Logically grouped modules for high restaurant operational efficiency
const MODULE_GROUPS = [
  {
    category: "OPERATIONS",
    label: "Operations",
    tabs: [
      { id: "overview", label: "Overview", icon: "fa-chart-pie", roles: ["owner", "manager"], aliases: ["dashboard"] },
      { id: "orders", label: "Orders & Fulfillment", icon: "fa-receipt", roles: ["owner", "manager", "cashier", "waiter"], aliases: [] },
      { id: "kds", label: "Kitchen KDS", icon: "fa-fire", roles: ["owner", "manager", "kitchen"], aliases: ["kitchen"] },
    ],
  },
  {
    category: "RESTAURANT",
    label: "Restaurant",
    tabs: [
      { id: "menu", label: "Menu Management", icon: "fa-utensils", roles: ["owner", "manager"], aliases: [] },
      { id: "tables", label: "Floor & Tables", icon: "fa-chair", roles: ["owner", "manager", "waiter"], aliases: [] },
      { id: "reservations", label: "Reservations Desk", icon: "fa-calendar-check", roles: ["owner", "manager", "waiter"], aliases: [] },
    ],
  },
  {
    category: "BUSINESS",
    label: "Business & Ledger",
    tabs: [
      { id: "crm", label: "Customers & Loyalty", icon: "fa-users", roles: ["owner", "manager"], aliases: ["customers", "loyalty"] },
      { id: "reconciliation", label: "Payments & Ledger", icon: "fa-file-invoice-dollar", roles: ["owner", "manager", "cashier", "accountant"], aliases: ["payments"] },
      { id: "inventory", label: "Stock & Inventory", icon: "fa-boxes", roles: ["owner", "manager"], aliases: [] },
      { id: "reports", label: "Reports & KPIs", icon: "fa-chart-line", roles: ["owner", "manager", "accountant"], aliases: [] },
    ],
  },
  {
    category: "ADMINISTRATION",
    label: "Administration",
    tabs: [
      { id: "staff", label: "Staff & Roles", icon: "fa-user-shield", roles: ["owner"], aliases: [] },
      { id: "audit", label: "Audit Trail", icon: "fa-history", roles: ["owner", "manager", "accountant"], aliases: ["activity", "settings"] },
    ],
  },
];

// Flat list for fallback resolution
const ALL_TABS = MODULE_GROUPS.flatMap((group) => group.tabs);

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userRole = (user?.role || (user?.is_admin ? "owner" : "customer")).toLowerCase();

  // Filter allowed groups & tabs based on role
  const allowedGroups = useMemo(() => {
    if (!user) return [];
    const isOwner = user.is_admin || userRole === "owner";

    return MODULE_GROUPS.map((group) => ({
      ...group,
      tabs: isOwner ? group.tabs : group.tabs.filter((t) => t.roles.includes(userRole)),
    })).filter((group) => group.tabs.length > 0);
  }, [user, userRole]);

  const allowedTabs = useMemo(() => {
    return allowedGroups.flatMap((g) => g.tabs);
  }, [allowedGroups]);

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

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    setIsMobileNavOpen(false);
    navigate(`/admin/${tabId}`);
  }

  const currentTabObj = ALL_TABS.find((t) => t.id === activeTab) || ALL_TABS[0];

  return (
    <div className="admin-page-container">
      {/* Top Header - Restoran Style */}
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="admin-mobile-nav-toggle"
            aria-label="Toggle Navigation Drawer"
            title="Open Module Navigation"
          >
            <i className={`fa ${isMobileNavOpen ? "fa-times" : "fa-bars"}`}></i>
          </button>

          {/* Brand Emblem */}
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "22px",
              boxShadow: "0 4px 15px rgba(212, 167, 74, 0.4)",
              flexShrink: 0,
            }}
          >
            <i className="fa fa-utensils"></i>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 className="admin-header-title">
                Jiwekee Operations Hub
              </h1>
              <span className="admin-role-badge">
                <i className="fa fa-shield-alt" style={{ marginRight: "4px" }}></i>
                {userRole}
              </span>
            </div>
            <p className="admin-header-subtitle">
              Active Staff: <strong>{user.name}</strong> • <span style={{ color: "var(--primary)" }}>● Live System ({currentTime})</span>
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <NotificationBell />
          <button
            onClick={() => navigate("/menu")}
            className="btn-restoran-secondary"
            style={{ background: "rgba(255, 255, 255, 0.1)", color: "#FFFFFF", borderColor: "rgba(255, 255, 255, 0.2)", padding: "7px 14px", fontSize: "13px" }}
          >
            <i className="fa fa-arrow-left"></i> <span className="hide-mobile-sm">Customer Menu</span>
          </button>
          <button
            onClick={async () => {
              if (logout) await logout();
              navigate("/admin-login");
            }}
            className="btn-restoran-secondary"
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#FCA5A5", borderColor: "rgba(239, 68, 68, 0.3)", padding: "7px 14px", fontSize: "13px" }}
            title="Sign out of staff session"
          >
            <i className="fa fa-sign-out-alt"></i> <span className="hide-mobile-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Layout Container: Sidebar + Content Area */}
      <div className={`admin-layout-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Desktop & Tablet Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <span className="sidebar-header-title">
              <i className="fa fa-th-large" style={{ color: "var(--primary)", marginRight: "8px" }}></i>
              Modules
            </span>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="sidebar-collapse-btn"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <i className={`fa ${isSidebarCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`}></i>
            </button>
          </div>

          <div className="admin-sidebar-nav">
            {allowedGroups.map((group) => (
              <div key={group.category} className="sidebar-group">
                <div className="sidebar-group-title">{group.label}</div>
                <div className="sidebar-group-items">
                  {group.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                        title={tab.label}
                      >
                        <i className={`fa ${tab.icon || "fa-circle"} nav-item-icon`}></i>
                        <span className="nav-item-label">{tab.label}</span>
                        {isActive && <i className="fa fa-chevron-right nav-active-arrow"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Mobile Slide-Out Drawer Navigation */}
        {isMobileNavOpen && (
          <>
            <div className="admin-mobile-backdrop" onClick={() => setIsMobileNavOpen(false)}></div>
            <div className="admin-mobile-drawer">
              <div className="admin-mobile-drawer-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>
                    <i className="fa fa-utensils"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: "#fff", fontSize: "16px", fontWeight: "800" }}>Operations Hub</h3>
                    <span style={{ fontSize: "11px", color: "var(--primary)", textTransform: "uppercase", fontWeight: "700" }}>{userRole} view</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer", padding: "4px" }}
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <div className="admin-mobile-drawer-body">
                {allowedGroups.map((group) => (
                  <div key={group.category} style={{ marginBottom: "18px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingLeft: "8px" }}>
                      {group.label}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {group.tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: "none",
                              background: isActive ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)" : "rgba(255, 255, 255, 0.05)",
                              color: isActive ? "#FFFFFF" : "#E2E8F0",
                              fontSize: "14px",
                              fontWeight: isActive ? "800" : "600",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <i className={`fa ${tab.icon || "fa-circle"}`} style={{ color: isActive ? "#FFFFFF" : "var(--primary)", width: "18px", textAlign: "center" }}></i>
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Main Content Workspace Panel */}
        <main className="admin-main-content">
          {/* Active Module Breadcrumb Banner (Mobile & Desktop) */}
          <div className="admin-module-breadcrumb">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className={`fa ${currentTabObj.icon || "fa-circle"}`} style={{ color: "var(--primary)" }}></i>
              <span className="breadcrumb-current">{currentTabObj.label}</span>
            </div>
            <div className="breadcrumb-meta">
              <span>Jiwekee Tavern & Grill</span> • <span style={{ color: "var(--primary-dark)", fontWeight: "700" }}>Live Operations</span>
            </div>
          </div>

          {/* Module Content Views */}
          <div className="admin-tab-content-pane">
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
        </main>
      </div>
    </div>
  );
}

