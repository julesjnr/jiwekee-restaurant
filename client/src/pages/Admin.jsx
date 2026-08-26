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
  { id: "overview", label: "Overview", roles: ["owner", "manager"], aliases: ["dashboard"] },
  { id: "orders", label: "Orders & Fulfillment", roles: ["owner", "manager", "cashier", "waiter"], aliases: [] },
  { id: "kds", label: "Kitchen KDS", roles: ["owner", "manager", "kitchen"], aliases: ["kitchen"] },
  { id: "menu", label: "Menu Management", roles: ["owner", "manager"], aliases: [] },
  { id: "tables", label: "Floor & Tables", roles: ["owner", "manager", "waiter"], aliases: [] },
  { id: "reservations", label: "Reservations Desk", roles: ["owner", "manager", "waiter"], aliases: [] },
  { id: "inventory", label: "Stock & Inventory", roles: ["owner", "manager"], aliases: [] },
  { id: "crm", label: "CRM & Loyalty", roles: ["owner", "manager"], aliases: ["customers", "loyalty"] },
  { id: "reconciliation", label: "Payments & Reconciliation", roles: ["owner", "manager", "cashier", "accountant"], aliases: ["payments"] },
  { id: "reports", label: "Reports & KPIs", roles: ["owner", "manager", "accountant"], aliases: [] },
  { id: "staff", label: "Staff & Roles", roles: ["owner"], aliases: [] },
  { id: "audit", label: "Audit Trail", roles: ["owner", "manager", "accountant"], aliases: ["activity"] },
];

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

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
    return <div className="loading-notice">Verifying administrative credentials...</div>;
  }

  function handleTabClick(tabId) {
    setActiveTab(tabId);
    navigate(`/admin/${tabId}`);
  }

  return (
    <div className="admin-page-container">
      {/* Top Header */}
      <div className="admin-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "800" }}>
              Jiwekee Operations Hub
            </h1>
            <span
              style={{
                background: "linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)",
                color: "#111",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              {userRole}
            </span>
          </div>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>
            Logged in as <strong>{user.name}</strong> ({user.email})
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <NotificationBell />
          <button
            onClick={() => navigate("/menu")}
            className="btn-action-sm btn-action-dark"
          >
            ← View Customer Menu
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Role-Filtered) */}
      <div className="admin-tabs-nav">
        {allowedTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`admin-tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
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
