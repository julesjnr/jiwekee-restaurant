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
          <div className="metric-header">
            <div>
              <div className="metric-title">Today's Revenue</div>
              <div className="metric-value metric-highlight">KES {Number(todaySales).toFixed(2)}</div>
            </div>
            <div className="metric-icon-wrap">
              <i className="fa fa-dollar-sign"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-chart-line" style={{ color: "var(--primary)" }}></i> Lifetime: KES {Number(totalSales).toFixed(2)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Today's Orders</div>
              <div className="metric-value">{todayOrdersCount}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(2, 132, 199, 0.12)", color: "var(--color-info)" }}>
              <i className="fa fa-shopping-bag"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-clock"></i> Active restaurant operations
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">M-Pesa Collections</div>
              <div className="metric-value metric-success">KES {Number(mpesaRevenue).toFixed(2)}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(46, 125, 50, 0.12)", color: "var(--color-success)" }}>
              <i className="fa fa-mobile-alt"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-shield-alt" style={{ color: "var(--color-success)" }}></i> Safaricom Daraja STK Push
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Wallet Revenue</div>
              <div className="metric-value metric-info">KES {Number(walletRevenue).toFixed(2)}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(217, 119, 6, 0.12)", color: "var(--color-warning)" }}>
              <i className="fa fa-wallet"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-star" style={{ color: "var(--color-warning)" }}></i> Loyalty digital wallet
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Registered Diners</div>
              <div className="metric-value">{totalCustomers}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(107, 114, 128, 0.12)", color: "var(--gray)" }}>
              <i className="fa fa-users"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-award"></i> Club members & guest diner profiles
          </div>
        </div>
      </div>

      {/* Order Status Counters Banner */}
      <div
        className="admin-card"
        style={{
          background: "linear-gradient(135deg, #0F172B 0%, #1A2644 100%)",
          border: "1px solid #2A3B5C",
          borderTop: "4px solid var(--primary)",
          color: "#fff",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa fa-stream" style={{ color: "var(--primary)", fontSize: "18px" }}></i>
            <span style={{ fontFamily: "Nunito, sans-serif", fontSize: "17px", fontWeight: "800", color: "#fff" }}>
              Live Order Status Pipeline
            </span>
          </div>
          <button
            onClick={() => onNavigateTab("orders")}
            className="btn-restoran-primary"
            style={{ padding: "6px 14px", fontSize: "12.5px" }}
          >
            Manage All Orders →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(254, 243, 199, 0.2)", padding: "12px 10px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11.5px", color: "#FDE68A", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending</div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: "22px", fontWeight: "900", color: "#FDE68A", marginTop: "2px" }}>
              {statusCounts.pending || 0}
            </div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(186, 230, 253, 0.2)", padding: "12px 10px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11.5px", color: "#BAE6FD", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Confirmed</div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: "22px", fontWeight: "900", color: "#BAE6FD", marginTop: "2px" }}>
              {statusCounts.confirmed || 0}
            </div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(221, 214, 254, 0.2)", padding: "12px 10px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11.5px", color: "#DDD6FE", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Preparing</div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: "22px", fontWeight: "900", color: "#DDD6FE", marginTop: "2px" }}>
              {statusCounts.preparing || 0}
            </div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(165, 243, 252, 0.2)", padding: "12px 10px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11.5px", color: "#A5F3FC", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ready</div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: "22px", fontWeight: "900", color: "#A5F3FC", marginTop: "2px" }}>
              {statusCounts.ready || 0}
            </div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(187, 247, 208, 0.2)", padding: "12px 10px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11.5px", color: "#BBF7D0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Completed</div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: "22px", fontWeight: "900", color: "#BBF7D0", marginTop: "2px" }}>
              {statusCounts.completed || 0}
            </div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(254, 202, 202, 0.2)", padding: "12px 10px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11.5px", color: "#FECACA", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Cancelled</div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: "22px", fontWeight: "900", color: "#FECACA", marginTop: "2px" }}>
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
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <i className="fa fa-exclamation-triangle" style={{ color: "var(--color-warning)" }}></i>
              Low-Stock Ingredients
            </h3>
            <button
              onClick={() => onNavigateTab("inventory")}
              className="btn-restoran-secondary"
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              Inventory Desk
            </button>
          </div>
          {lowStockAlerts.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-success)", background: "rgba(46, 125, 50, 0.06)", borderRadius: "8px" }}>
              <i className="fa fa-check-circle" style={{ fontSize: "20px", marginBottom: "6px", display: "block" }}></i>
              All inventory ingredient levels are healthy.
            </div>
          ) : (
            <div>
              {lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--light-gray)",
                    fontSize: "13.5px",
                  }}
                >
                  <span style={{ color: "var(--secondary)", fontWeight: "600" }}>{item.name}</span>
                  <span className="status-badge status-cancelled">
                    {item.current_quantity} {item.unit} (Min: {item.min_stock_level})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Menu Items */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <i className="fa fa-fire" style={{ color: "var(--primary)" }}></i>
              Top Selling Dishes
            </h3>
            <button
              onClick={() => onNavigateTab("menu")}
              className="btn-restoran-secondary"
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              Menu Catalog
            </button>
          </div>
          {popularItems.length === 0 ? (
            <p style={{ color: "var(--gray)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
              No order data recorded yet.
            </p>
          ) : (
            <div>
              {popularItems.map((item, idx) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--light-gray)",
                    fontSize: "13.5px",
                  }}
                >
                  <span style={{ color: "var(--secondary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: idx === 0 ? "var(--primary)" : "var(--light-gray)",
                        color: idx === 0 ? "#fff" : "var(--secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                    >
                      {idx + 1}
                    </span>
                    {item.name}
                  </span>
                  <span style={{ color: "var(--primary-dark)", fontWeight: "800", fontFamily: "Nunito, sans-serif" }}>
                    {item.quantity} sold <span style={{ color: "var(--gray)", fontWeight: "normal", fontSize: "12px" }}>(KES {item.revenue.toFixed(2)})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <i className="fa fa-receipt" style={{ color: "var(--primary)" }}></i>
            Recent Orders & Guest Transactions
          </h3>
          <button
            onClick={() => onNavigateTab("reconciliation")}
            className="btn-restoran-secondary"
            style={{ padding: "6px 14px", fontSize: "12.5px" }}
          >
            <i className="fa fa-file-invoice-dollar"></i> Payment Reconciliation
          </button>
        </div>
        <div className="admin-data-table-container" style={{ margin: 0, boxShadow: "none", border: "none" }}>
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Type / Table</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Fulfillment</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: "800", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif" }}>
                    #{o.id}
                  </td>
                  <td style={{ fontWeight: "600", color: "var(--secondary)" }}>
                    {o.user_name || "Guest Customer"}
                  </td>
                  <td>
                    <span
                      style={{
                        background: "var(--light-bg)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--secondary)",
                        border: "1px solid var(--light-gray)",
                      }}
                    >
                      {o.table_number ? `Table ${o.table_number}` : o.order_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>
                    KES {Number(o.amount).toFixed(2)}
                  </td>
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
                  <td style={{ color: "var(--gray)", fontSize: "12.5px" }}>
                    {new Date(o.created_at).toLocaleDateString([], { month: "short", day: "numeric" })} • {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
