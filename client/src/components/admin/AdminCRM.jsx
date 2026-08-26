import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminCRM() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustData, setAdjustData] = useState({ points_delta: 50, reason: "VIP Customer Appreciation" });

  const fetchCRM = () => {
    setLoading(true);
    api
      .getCRM()
      .then((data) => {
        setCustomers(data.customers || []);
        setStats(data.stats || {});
      })
      .catch((err) => console.error("CRM error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCRM();
  }, []);

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      await api.adjustCustomerPoints(selectedUser.id, adjustData);
      setSelectedUser(null);
      fetchCRM();
    } catch (err) {
      alert(err.message || "Failed to adjust loyalty points.");
    }
  };

  return (
    <div>
      {/* Top CRM Summary Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Customer Accounts</div>
              <div className="metric-value">{stats.totalCustomers || 0}</div>
            </div>
            <div className="metric-icon-wrap">
              <i className="fa fa-users"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-address-book" style={{ color: "var(--primary)" }}></i> Registered diner database
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">VIP Segment</div>
              <div className="metric-value metric-highlight">{stats.vipCount || 0}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(212, 167, 74, 0.15)", color: "var(--primary-dark)" }}>
              <i className="fa fa-crown"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-award"></i> Spend &gt; KES 5,000 or 5+ visits
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Returning Patrons</div>
              <div className="metric-value metric-info">{stats.returningCount || 0}</div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(2, 132, 199, 0.12)", color: "var(--color-info)" }}>
              <i className="fa fa-redo"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-heart" style={{ color: "var(--color-info)" }}></i> Repeat order frequency
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div>
              <div className="metric-title">Total Diner Spend</div>
              <div className="metric-value metric-success">
                KES {Number(stats.totalCustomerSpend || 0).toFixed(2)}
              </div>
            </div>
            <div className="metric-icon-wrap" style={{ background: "rgba(46, 125, 50, 0.12)", color: "var(--color-success)" }}>
              <i className="fa fa-dollar-sign"></i>
            </div>
          </div>
          <div className="metric-subtitle">
            <i className="fa fa-shield-alt" style={{ color: "var(--color-success)" }}></i> Verified customer revenue
          </div>
        </div>
      </div>

      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-user-tag" style={{ color: "var(--primary)" }}></i>
            Customer Profiles, Loyalty & Spend History
          </h2>
          <p className="admin-card-desc">
            Manage customer relationships, view total spendings, and grant bonus rewards or loyalty points.
          </p>
        </div>
        <button onClick={fetchCRM} className="btn-restoran-secondary">
          <i className="fa fa-sync-alt"></i> Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading Customer Relations Data...</h4>
        </div>
      ) : customers.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-users-slash" style={{ fontSize: "36px", color: "var(--gray)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>No customer accounts registered yet</h4>
          <p style={{ color: "var(--gray)", fontSize: "13px", marginTop: "6px" }}>New customers will appear here when they register or place an order.</p>
        </div>
      ) : (
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Customer Info</th>
                <th>Phone</th>
                <th>Segment</th>
                <th>Loyalty Tier</th>
                <th>Points Balance</th>
                <th>Wallet Balance</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>{c.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--gray)" }}>{c.email}</div>
                  </td>
                  <td>
                    <span style={{ color: "var(--gray)", fontSize: "13px" }}>
                      <i className="fa fa-phone" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                      {c.phone || "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background:
                          c.segment === "VIP"
                            ? "rgba(212, 167, 74, 0.18)"
                            : c.segment === "Returning"
                            ? "rgba(2, 132, 199, 0.12)"
                            : "var(--light-bg)",
                        color:
                          c.segment === "VIP"
                            ? "var(--primary-dark)"
                            : c.segment === "Returning"
                            ? "var(--color-info)"
                            : "var(--gray)",
                        border:
                          c.segment === "VIP"
                            ? "1px solid rgba(212, 167, 74, 0.4)"
                            : "1px solid var(--light-gray)",
                        padding: "3px 9px",
                        borderRadius: "12px",
                        fontSize: "11.5px",
                        fontWeight: "800",
                      }}
                    >
                      {c.segment === "VIP" && <i className="fa fa-crown" style={{ marginRight: "4px" }}></i>}
                      {c.segment}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "var(--secondary)",
                        color: "var(--primary)",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontWeight: "800",
                        fontSize: "11.5px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {c.loyalty_tier || "Bronze"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: "900", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif" }}>
                      {c.loyalty_points} pts
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: "800", color: "var(--color-info)", fontFamily: "Nunito, sans-serif" }}>
                      KES {Number(c.wallet_balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ fontWeight: "700", color: "var(--secondary)" }}>{c.total_orders}</td>
                  <td>
                    <span style={{ fontWeight: "900", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>
                      KES {Number(c.total_spent || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedUser(c);
                        setAdjustData({ points_delta: 50, reason: "Patron Bonus Points" });
                      }}
                      className="btn-restoran-primary"
                      style={{ padding: "5px 12px", fontSize: "11.5px" }}
                    >
                      <i className="fa fa-coins"></i> ± Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Points Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa fa-coins" style={{ color: "var(--primary)", fontSize: "20px" }}></i>
                <h3 className="admin-modal-title">Adjust Loyalty Points</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ background: "var(--light-bg)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--light-gray)", marginBottom: "16px", fontSize: "13.5px", color: "var(--secondary)" }}>
              Customer: <strong>{selectedUser.name}</strong> (<span style={{ color: "var(--primary-dark)", fontWeight: "800" }}>{selectedUser.loyalty_points}</span> current points)
            </div>

            <form onSubmit={handleAdjustPoints}>
              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Points to Add / Deduct</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 or -20"
                  value={adjustData.points_delta}
                  onChange={(e) =>
                    setAdjustData({ ...adjustData, points_delta: Number(e.target.value) })
                  }
                  className="restoran-input"
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label className="restoran-label">Reason / Audit Trail Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Dinner Celebration Bonus"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="restoran-input"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="btn-restoran-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-restoran-primary">
                  <i className="fa fa-check"></i> Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
