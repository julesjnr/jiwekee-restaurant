import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminOverview({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Stats load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-notice">Aggregating live restaurant operational metrics...</div>;
  }

  if (!stats) {
    return <div className="no-items-card">Unable to load dashboard metrics.</div>;
  }

  const {
    todaySales,
    todayOrdersCount,
    totalSales,
    mpesaRevenue,
    walletRevenue,
    totalCustomers,
    statusCounts = {},
    lowStockAlerts = [],
    popularItems = [],
    recentOrders = [],
  } = stats;

  return (
    <div>
      {/* Top Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Today's Revenue</div>
          <div className="metric-value metric-highlight">KES {Number(todaySales).toFixed(2)}</div>
          <div className="metric-subtitle">Lifetime: KES {Number(totalSales).toFixed(2)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Today's Orders</div>
          <div className="metric-value">{todayOrdersCount}</div>
          <div className="metric-subtitle">Active operations</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">M-Pesa Collections</div>
          <div className="metric-value metric-success">KES {Number(mpesaRevenue).toFixed(2)}</div>
          <div className="metric-subtitle">Daraja STK Push</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Wallet Revenue</div>
          <div className="metric-value metric-info">KES {Number(walletRevenue).toFixed(2)}</div>
          <div className="metric-subtitle">Loyalty digital wallet</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Registered Customers</div>
          <div className="metric-value">{totalCustomers}</div>
          <div className="metric-subtitle">Club members & diners</div>
        </div>
      </div>

      {/* Order Status Counters Banner */}
      <div
        style={{
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>
            Live Order Status Pipeline
          </span>
          <button
            onClick={() => onNavigateTab("orders")}
            className="btn-action-sm btn-action-primary"
          >
            Manage Orders →
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ background: "#222", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#ffcc00" }}>Pending</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffcc00" }}>
              {statusCounts.pending || 0}
            </div>
          </div>
          <div style={{ background: "#222", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#ffaa00" }}>Confirmed</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffaa00" }}>
              {statusCounts.confirmed || 0}
            </div>
          </div>
          <div style={{ background: "#222", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#00b4d8" }}>Preparing</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#00b4d8" }}>
              {statusCounts.preparing || 0}
            </div>
          </div>
          <div style={{ background: "#222", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#90e0ef" }}>Ready</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#90e0ef" }}>
              {statusCounts.ready || 0}
            </div>
          </div>
          <div style={{ background: "#222", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#38b000" }}>Completed</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#38b000" }}>
              {statusCounts.completed || 0}
            </div>
          </div>
          <div style={{ background: "#222", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#ff4d4d" }}>Cancelled</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#ff4d4d" }}>
              {statusCounts.cancelled || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Low Stock + Popular Dishes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "24px",
          marginBottom: "28px",
        }}
      >
        {/* Low Stock Alerts */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <h3 style={{ fontSize: "16px", color: "#fff" }}>Low-Stock Alerts</h3>
            <button
              onClick={() => onNavigateTab("inventory")}
              className="btn-action-sm btn-action-dark"
            >
              View Inventory
            </button>
          </div>
          {lowStockAlerts.length === 0 ? (
            <p style={{ color: "#38b000", fontSize: "13px" }}>
              ✓ All inventory ingredient levels are healthy.
            </p>
          ) : (
            <div>
              {lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#eee" }}>{item.name}</span>
                  <span style={{ color: "#ff4d4d", fontWeight: "700" }}>
                    {item.current_quantity} {item.unit} (Min: {item.min_stock_level})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Menu Items */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <h3 style={{ fontSize: "16px", color: "#fff" }}>Popular Menu Items</h3>
            <button
              onClick={() => onNavigateTab("menu")}
              className="btn-action-sm btn-action-dark"
            >
              Manage Menu
            </button>
          </div>
          {popularItems.length === 0 ? (
            <p style={{ color: "#888", fontSize: "13px" }}>No order data yet.</p>
          ) : (
            <div>
              {popularItems.map((item, idx) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#eee" }}>
                    #{idx + 1} {item.name}
                  </span>
                  <span style={{ color: "#ffcc00", fontWeight: "700" }}>
                    {item.quantity} sold (KES {item.revenue.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="data-table-container" style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ fontSize: "16px", color: "#fff" }}>Recent Orders & Transactions</h3>
          <button
            onClick={() => onNavigateTab("reconciliation")}
            className="btn-action-sm btn-action-dark"
          >
            Payment Reconciliation
          </button>
        </div>
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Type / Table</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: "700", color: "#ffcc00" }}>#{o.id}</td>
                <td>{o.user_name || "Customer"}</td>
                <td>{o.table_number ? `Table ${o.table_number}` : o.order_type}</td>
                <td style={{ fontWeight: "700" }}>KES {Number(o.amount).toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${o.status.toLowerCase()}`}>
                    {o.status} ({o.payment_method})
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge status-${(o.fulfillment_status || "confirmed").toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {o.fulfillment_status || "Confirmed"}
                  </span>
                </td>
                <td style={{ color: "#888" }}>
                  {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
