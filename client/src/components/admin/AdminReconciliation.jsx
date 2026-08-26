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
          <div className="metric-header">
            <div>
              <div className="metric-title">Total Reconciled Revenue</div>
              <div className="metric-value metric-highlight">
                KES {Number(stats.totalRevenue || 0).toFixed(2)}
              </div>
            </div>
            <div className="metric-icon-wrap">
              <i className="fa fa-dollar-sign"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-receipt" style={{ color: "var(--primary)" }}></i> {stats.totalTransactions || 0} Total Transactions
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">M-Pesa STK Gross</div>
              <div className="metric-value metric-success">
                KES {Number(stats.mpesaRevenue || 0).toFixed(2)}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(46, 125, 50, 0.12)", color: "var(--color-success)" }}>
              <i className="fa fa-mobile-alt"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-shield-alt" style={{ color: "var(--color-success)" }}></i> Safaricom Daraja STK
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Wallet Settlements</div>
              <div className="metric-value metric-info">
                KES {Number(stats.walletRevenue || 0).toFixed(2)}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(2, 132, 199, 0.12)", color: "var(--color-info)" }}>
              <i className="fa fa-wallet"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-star" style={{ color: "var(--color-info)" }}></i> In-App Customer Credits
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Pending Settlements</div>
              <div className="metric-value" style={{ color: stats.pendingCount ? "var(--color-warning)" : "var(--secondary)" }}>
                {stats.pendingCount || 0}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(217, 119, 6, 0.12)", color: "var(--color-warning)" }}>
              <i className="fa fa-clock"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-hourglass-half"></i> Awaiting webhook verification
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar">
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="restoran-select"
            style={{ width: "auto", padding: "8px 14px", fontWeight: "700" }}
          >
            <option value="">All Payment Channels</option>
            <option value="mpesa">M-Pesa STK Push</option>
            <option value="wallet">Loyalty Digital Wallet</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="restoran-select"
            style={{ width: "auto", padding: "8px 14px", fontWeight: "700" }}
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed / Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="admin-search-wrap">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Search M-Pesa receipt, phone, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
            style={{ width: "260px" }}
          />
          <button
            type="submit"
            className="btn-restoran-primary"
            style={{ marginLeft: "8px", padding: "8px 16px" }}
          >
            Filter
          </button>
        </form>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading Financial Reconciliation Ledger...</h4>
        </div>
      ) : transactions.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-file-invoice-dollar" style={{ fontSize: "36px", color: "var(--gray)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>No matching transaction records found</h4>
          <p style={{ color: "var(--gray)", fontSize: "13px", marginTop: "6px" }}>Try choosing different filter criteria or clearing your search term.</p>
        </div>
      ) : (
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Order #</th>
                <th>Customer Details</th>
                <th>Channel</th>
                <th>Settled Amount</th>
                <th>M-Pesa / Reference Receipt</th>
                <th>Checkout ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={idx}>
                  <td style={{ color: "var(--gray)", fontSize: "12.5px" }}>
                    {new Date(t.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <span style={{ fontWeight: "900", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif" }}>
                      #{t.order_id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--secondary)" }}>{t.customer_name || "Guest Diner"}</div>
                    <div style={{ fontSize: "12px", color: "var(--gray)" }}>
                      <i className="fa fa-phone" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                      {t.phone_number || "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: t.payment_method === "mpesa" ? "rgba(46, 125, 50, 0.12)" : "rgba(2, 132, 199, 0.12)",
                        color: t.payment_method === "mpesa" ? "var(--color-success)" : "var(--color-info)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                      }}
                    >
                      {t.payment_method}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: "900", color: "var(--secondary)", fontFamily: "Nunito, sans-serif", fontSize: "14.5px" }}>
                      KES {Number(t.amount).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <code
                      style={{
                        background: "var(--light-bg)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        color: "var(--primary-dark)",
                        fontSize: "12.5px",
                        fontWeight: "800",
                        border: "1px solid var(--light-gray)",
                      }}
                    >
                      {t.mpesa_receipt || "—"}
                    </code>
                  </td>
                  <td style={{ fontSize: "11.5px", color: "var(--gray)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.checkout_id || "—"}
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
