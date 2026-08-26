import { useState, useEffect } from "react";
import { api } from "../../api/client";

const ROLES_INFO = {
  owner: {
    title: "Restaurant Owner",
    permissions: "Full System Access, Financials, Staff, Menu, Inventory, Audits, Orders",
    color: "#ffcc00",
  },
  manager: {
    title: "Operations Manager",
    permissions: "Order Flow, Menu Editing, Table Management, Reservations, Stock, CRM, KDS",
    color: "#00b4d8",
  },
  kitchen: {
    title: "Kitchen Chef",
    permissions: "KDS Cook Queue, Order Status Advancement, Low Stock Ingredient Tracking",
    color: "#ff9900",
  },
  cashier: {
    title: "Front Cashier",
    permissions: "Take Orders, Settle Payments, View Tables, Search Receipts",
    color: "#38b000",
  },
  waiter: {
    title: "Service Waiter",
    permissions: "Floor Table Status, Seating Guests, Dine-in Order Placement",
    color: "#90e0ef",
  },
  accountant: {
    title: "Financial Auditor",
    permissions: "Payment Reconciliation, M-Pesa Logs, Financial Analytics, Audit Trail",
    color: "#e0aaff",
  },
};

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStaff()
      .then((data) => setStaffList(data.staff || []))
      .catch((err) => console.error("Staff list error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-user-shield" style={{ color: "var(--primary)" }}></i>
            Staff Directory & Role-Based Access Control (RBAC)
          </h2>
          <p className="admin-card-desc">
            Granular role permission policies protecting backend endpoints, cash registers, and restaurant operations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading Staff Directory from Database...</h4>
        </div>
      ) : (
        <div className="admin-data-table-container" style={{ marginBottom: "32px" }}>
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Admin Authority</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "var(--light-bg)",
                          border: "1.5px solid var(--primary)",
                          color: "var(--primary-dark)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "800",
                          fontSize: "14px",
                          fontFamily: "Nunito, sans-serif",
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>
                        {s.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: "var(--gray)", fontSize: "13px" }}>{s.email}</td>
                  <td>
                    <span
                      style={{
                        background: "var(--light-bg)",
                        color: "var(--secondary)",
                        border: "1px solid var(--light-gray)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "800",
                      }}
                    >
                      <i className="fa fa-id-badge" style={{ color: "var(--primary)", marginRight: "6px" }}></i>
                      {ROLES_INFO[s.role]?.title || s.role}
                    </span>
                  </td>
                  <td>
                    {s.is_admin ? (
                      <span className="status-badge status-pending" style={{ fontWeight: "800" }}>
                        <i className="fa fa-shield-alt"></i> Full Admin
                      </span>
                    ) : (
                      <span style={{ color: "var(--gray)", fontSize: "12.5px" }}>Standard Staff</span>
                    )}
                  </td>
                  <td style={{ color: "var(--gray)", fontSize: "12.5px" }}>
                    {new Date(s.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Permissions Matrix Guide */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <i className="fa fa-key" style={{ color: "var(--primary)" }}></i>
            Staff Roles & Capability Matrix
          </h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {Object.entries(ROLES_INFO).map(([key, info]) => (
            <div
              key={key}
              style={{
                background: "var(--light-bg)",
                border: "1px solid var(--light-gray)",
                borderLeft: "4px solid var(--primary)",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif", fontSize: "15px", marginBottom: "6px" }}>
                {info.title}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--gray)", lineHeight: "1.5" }}>
                {info.permissions}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
