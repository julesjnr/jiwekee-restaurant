import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminReconciliation() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchRecords = () => {
    setLoading(true);
    api
      .getReconciliation({
        method: methodFilter,
        status: statusFilter,
        search,
      })
      .then((data) => {
        setTransactions(data.transactions || []);
        setStats(data.stats || {});
      })
      .catch((err) => console.error("Reconciliation error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, [methodFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div>
      {/* Top Ledger Stats */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Total Reconciled Revenue</div>
          <div className="metric-value metric-highlight">
            KES {Number(stats.totalRevenue || 0).toFixed(2)}
          </div>
          <div className="metric-subtitle">{stats.totalTransactions || 0} Total Transactions</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">M-Pesa STK Gross</div>
          <div className="metric-value metric-success">
            KES {Number(stats.mpesaRevenue || 0).toFixed(2)}
          </div>
          <div className="metric-subtitle">Safaricom Daraja API</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Loyalty Wallet Settlements</div>
          <div className="metric-value metric-info">
            KES {Number(stats.walletRevenue || 0).toFixed(2)}
          </div>
          <div className="metric-subtitle">In-App Customer Credits</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Pending Payment Inquiries</div>
          <div className="metric-value">{stats.pendingCount || 0}</div>
          <div className="metric-subtitle">Awaiting webhook or customer PIN</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{
              background: "#222",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
            }}
          >
            <option value="">All Payment Channels</option>
            <option value="mpesa">M-Pesa STK Push</option>
            <option value="wallet">Loyalty Digital Wallet</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "#222",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
            }}
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed / Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Search M-Pesa receipt, phone, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="custom-input"
            style={{ width: "260px", margin: 0 }}
          />
          <button type="submit" className="btn-action-sm btn-action-primary">
            Filter
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-notice">Loading financial reconciliation ledger...</div>
      ) : transactions.length === 0 ? (
        <div className="no-items-card">No matching transaction records found.</div>
      ) : (
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>M-Pesa / Reference Receipt</th>
                <th>Checkout ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={idx}>
                  <td style={{ color: "#888", fontSize: "12px" }}>
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: "700", color: "#ffcc00" }}>#{t.order_id}</td>
                  <td>
                    <div style={{ fontWeight: "600", color: "#fff" }}>{t.customer_name}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{t.phone_number}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: t.payment_method === "mpesa" ? "rgba(56,176,0,0.15)" : "rgba(0,180,216,0.15)",
                        color: t.payment_method === "mpesa" ? "#38b000" : "#00b4d8",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {t.payment_method}
                    </span>
                  </td>
                  <td style={{ fontWeight: "800", color: "#fff" }}>
                    KES {Number(t.amount).toFixed(2)}
                  </td>
                  <td>
                    <code
                      style={{
                        background: "#1c1c1c",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        color: "#ffcc00",
                        fontSize: "12px",
                      }}
                    >
                      {t.mpesa_receipt}
                    </code>
                  </td>
                  <td style={{ fontSize: "11px", color: "#777", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.checkout_id}
                  </td>
                  <td>
                    <span className={`status-badge status-${t.status.toLowerCase()}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
