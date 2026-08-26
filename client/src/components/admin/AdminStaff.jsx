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
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>
          Staff Directory & Role-Based Access Control (RBAC)
        </h2>
        <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
          Granular role permission policies protecting backend APIs and operational views.
        </p>
      </div>

      {loading ? (
        <div className="loading-notice">Loading staff directory...</div>
      ) : (
        <div className="data-table-container" style={{ marginBottom: "28px" }}>
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Email</th>
                <th>Assigned Role</th>
                <th>Admin Authority</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: "700", color: "#fff" }}>{s.name}</div>
                  </td>
                  <td style={{ color: "#aaa" }}>{s.email}</td>
                  <td>
                    <span
                      style={{
                        background: `${ROLES_INFO[s.role]?.color || "#fff"}22`,
                        color: ROLES_INFO[s.role]?.color || "#fff",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {ROLES_INFO[s.role]?.title || s.role}
                    </span>
                  </td>
                  <td>
                    {s.is_admin ? (
                      <span style={{ color: "#ffcc00", fontWeight: "700" }}>✓ Full Admin</span>
                    ) : (
                      <span style={{ color: "#888" }}>Standard Staff</span>
                    )}
                  </td>
                  <td style={{ color: "#888", fontSize: "12px" }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Permissions Matrix Guide */}
      <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: "16px" }}>
        Staff Roles & Capability Matrix
      </h3>
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
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${info.color}33`,
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ fontWeight: "800", color: info.color, marginBottom: "6px" }}>
              {info.title}
            </div>
            <div style={{ fontSize: "12px", color: "#bbb", lineHeight: "1.4" }}>
              {info.permissions}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
