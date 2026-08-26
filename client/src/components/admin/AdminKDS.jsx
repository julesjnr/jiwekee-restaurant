import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminKDS() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = () => {
    api
      .getKitchenTickets()
      .then((data) => setTickets(data.orders || []))
      .catch((err) => console.error("KDS error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async (orderId) => {
    try {
      await api.advanceKitchenTicket(orderId);
      fetchTickets();
    } catch (err) {
      alert(err.message || "Failed to advance kitchen ticket.");
    }
  };

  const getMinutesAgo = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return mins <= 0 ? "Just now" : `${mins}m ago`;
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>Kitchen Display System (KDS)</h2>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
            Live cook tickets in real-time. Click button to progress stage.
          </p>
        </div>
        <button onClick={fetchTickets} className="btn-action-sm btn-action-dark">
          Refresh Screen
        </button>
      </div>

      {loading ? (
        <div className="loading-notice">Loading kitchen queue...</div>
      ) : tickets.length === 0 ? (
        <div className="no-items-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h3 style={{ color: "#fff", marginBottom: "8px" }}>Kitchen Queue Clear</h3>
          <p style={{ color: "#888", fontSize: "14px" }}>No active tickets awaiting preparation.</p>
        </div>
      ) : (
        <div className="kds-board-grid">
          {tickets.map((t) => {
            const statusClass = (t.fulfillment_status || "confirmed").toLowerCase();
            return (
              <div key={t.id} className={`kds-ticket-card ${statusClass}`}>
                <div className="kds-ticket-header">
                  <div>
                    <div className="kds-order-num">#{t.id}</div>
                    <div style={{ fontSize: "12px", color: "#bbb", fontWeight: "600" }}>
                      {t.table_number ? `Table ${t.table_number}` : t.order_type}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="kds-timer">{getMinutesAgo(t.created_at)}</div>
                    <span
                      className={`status-badge status-${statusClass}`}
                      style={{ fontSize: "10px", marginTop: "4px" }}
                    >
                      {t.fulfillment_status}
                    </span>
                  </div>
                </div>

                {t.notes && (
                  <div
                    style={{
                      background: "rgba(255,204,0,0.1)",
                      border: "1px solid rgba(255,204,0,0.2)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "#ffcc00",
                      marginBottom: "12px",
                    }}
                  >
                    Note: {t.notes}
                  </div>
                )}

                <ul className="kds-items-list">
                  {t.items && t.items.length > 0 ? (
                    t.items.map((item, idx) => (
                      <li key={idx} className="kds-item-row">
                        <span>
                          <span className="kds-item-qty">{item.quantity}x</span>
                          <strong style={{ color: "#fff" }}>{item.name}</strong>
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="kds-item-row">
                      <span style={{ color: "#aaa" }}>Kitchen ticket dishes</span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleAdvance(t.id)}
                  className="btn-kds-advance"
                  style={{
                    background:
                      t.fulfillment_status === "Confirmed" || t.fulfillment_status === "Pending"
                        ? "linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)"
                        : t.fulfillment_status === "Preparing"
                        ? "linear-gradient(135deg, #38b000 0%, #007200 100%)"
                        : "#333",
                    color: "#fff",
                  }}
                >
                  {t.fulfillment_status === "Confirmed" || t.fulfillment_status === "Pending"
                    ? "Start Preparing"
                    : t.fulfillment_status === "Preparing"
                    ? "Mark Dish READY"
                    : "Ready for Pickup"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
