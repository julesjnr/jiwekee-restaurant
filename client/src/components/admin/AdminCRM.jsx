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
          <div className="metric-title">Total Customer Accounts</div>
          <div className="metric-value">{stats.totalCustomers || 0}</div>
          <div className="metric-subtitle">Registered diner database</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">VIP Segment</div>
          <div className="metric-value metric-highlight">{stats.vipCount || 0}</div>
          <div className="metric-subtitle">Spend &gt; KES 5,000 or 5+ orders</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Returning Diners</div>
          <div className="metric-value metric-info">{stats.returningCount || 0}</div>
          <div className="metric-subtitle">Repeat order frequency</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Total Registered Spend</div>
          <div className="metric-value metric-success">
            KES {Number(stats.totalCustomerSpend || 0).toFixed(2)}
          </div>
          <div className="metric-subtitle">Verified customer revenue</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ fontSize: "18px", color: "#fff", margin: 0 }}>
          Customer Profiles, Loyalty & Spend History
        </h2>
        <button onClick={fetchCRM} className="btn-action-sm btn-action-dark">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-notice">Loading CRM data...</div>
      ) : customers.length === 0 ? (
        <div className="no-items-card">No customer accounts registered yet.</div>
      ) : (
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Segment</th>
                <th>Loyalty Tier</th>
                <th>Points Balance</th>
                <th>Wallet Credit</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: "700", color: "#fff" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{c.email}</div>
                  </td>
                  <td style={{ color: "#aaa" }}>{c.phone}</td>
                  <td>
                    <span
                      style={{
                        background:
                          c.segment === "VIP"
                            ? "rgba(255,204,0,0.2)"
                            : c.segment === "Returning"
                            ? "rgba(0,180,216,0.2)"
                            : "rgba(255,255,255,0.06)",
                        color:
                          c.segment === "VIP"
                            ? "#ffcc00"
                            : c.segment === "Returning"
                            ? "#00b4d8"
                            : "#aaa",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {c.segment}
                    </span>
                  </td>
                  <td>
                    <span className="loyalty-tier-badge" style={{ marginLeft: 0 }}>
                      {c.loyalty_tier}
                    </span>
                  </td>
                  <td style={{ fontWeight: "800", color: "#ffcc00" }}>
                    {c.loyalty_points} pts
                  </td>
                  <td style={{ color: "#00b4d8", fontWeight: "700" }}>
                    KES {c.wallet_balance.toFixed(2)}
                  </td>
                  <td style={{ fontWeight: "600" }}>{c.total_orders}</td>
                  <td style={{ fontWeight: "800", color: "#fff" }}>
                    KES {c.total_spent.toFixed(2)}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedUser(c);
                        setAdjustData({ points_delta: 50, reason: "Patron Bonus Points" });
                      }}
                      className="btn-action-sm btn-action-primary"
                      style={{ fontSize: "11px" }}
                    >
                      ± Points
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
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Adjust Loyalty Points</h2>
            <p style={{ color: "#bbb", fontSize: "13px", marginBottom: "16px" }}>
              Customer: <strong>{selectedUser.name}</strong> ({selectedUser.loyalty_points} current points)
            </p>
            <form onSubmit={handleAdjustPoints}>
              <div className="form-input-group">
                <label>Points to Add / Subtract</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 or -20"
                  value={adjustData.points_delta}
                  onChange={(e) =>
                    setAdjustData({ ...adjustData, points_delta: Number(e.target.value) })
                  }
                />
              </div>

              <div className="form-input-group">
                <label>Reason / Audit Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Dinner Celebration Bonus"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="btn-action-sm btn-action-dark"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-sm btn-action-primary">
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
