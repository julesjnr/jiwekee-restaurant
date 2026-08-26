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
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-fire" style={{ color: "var(--primary)" }}></i>
            Kitchen Display System (KDS Station)
          </h2>
          <p className="admin-card-desc">
            Live order queue for line cooks and executive chefs. Advance orders as dishes move from queue to preparation and pickup.
          </p>
        </div>
        <button onClick={fetchTickets} className="btn-restoran-secondary">
          <i className="fa fa-sync-alt"></i> Refresh Screen
        </button>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Syncing Kitchen Display Queue...</h4>
        </div>
      ) : tickets.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "70px 20px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(46, 125, 50, 0.12)",
              color: "var(--color-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 16px",
            }}
          >
            <i className="fa fa-check"></i>
          </div>
          <h3 style={{ fontFamily: "Nunito, sans-serif", fontWeight: "900", color: "var(--secondary)", margin: "0 0 6px 0" }}>
            Kitchen Queue Clear
          </h3>
          <p style={{ color: "var(--gray)", fontSize: "14px", margin: 0 }}>
            All incoming orders are prepped and ready for guest delivery.
          </p>
        </div>
      ) : (
        <div className="kds-board-grid">
          {tickets.map((t) => {
            const statusClass = (t.fulfillment_status || "confirmed").toLowerCase();
            return (
              <div key={t.id} className={`kds-ticket-card ${statusClass}`}>
                <div>
                  <div className="kds-ticket-header">
                    <div>
                      <div className="kds-order-num">
                        Order #{t.id}
                      </div>
                      <div style={{ fontSize: "12.5px", color: "var(--primary-dark)", fontWeight: "700", marginTop: "2px" }}>
                        <i className="fa fa-chair" style={{ marginRight: "4px" }}></i>
                        {t.table_number ? `Dining Table ${t.table_number}` : t.order_type}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="kds-timer">
                        <i className="fa fa-stopwatch" style={{ color: "var(--primary)" }}></i>
                        {getMinutesAgo(t.created_at)}
                      </div>
                      <div style={{ marginTop: "4px" }}>
                        <span className={`status-badge status-${statusClass}`}>
                          {t.fulfillment_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {t.notes && (
                    <div
                      style={{
                        background: "rgba(212, 167, 74, 0.12)",
                        border: "1px solid rgba(212, 167, 74, 0.3)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "12.5px",
                        color: "var(--secondary)",
                        marginBottom: "14px",
                      }}
                    >
                      <strong style={{ color: "var(--primary-dark)" }}>Chef Instructions:</strong> {t.notes}
                    </div>
                  )}

                  <ul className="kds-items-list">
                    {t.items && t.items.length > 0 ? (
                      t.items.map((item, idx) => (
                        <li key={idx} className="kds-item-row">
                          <span className="kds-item-qty">{item.quantity}x</span>
                          <strong style={{ color: "var(--secondary)", fontSize: "14.5px" }}>{item.name}</strong>
                        </li>
                      ))
                    ) : (
                      <li className="kds-item-row">
                        <span style={{ color: "var(--gray)" }}>Kitchen ticket dishes</span>
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => handleAdvance(t.id)}
                  className="btn-kds-advance"
                  style={{
                    background:
                      t.fulfillment_status === "Confirmed" || t.fulfillment_status === "Pending"
                        ? "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)"
                        : t.fulfillment_status === "Preparing"
                        ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)"
                        : "linear-gradient(135deg, #15803D 0%, #166534 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {t.fulfillment_status === "Confirmed" || t.fulfillment_status === "Pending" ? (
                    <>
                      <i className="fa fa-utensils"></i> Start Cooking
                    </>
                  ) : t.fulfillment_status === "Preparing" ? (
                    <>
                      <i className="fa fa-bell"></i> Mark Dish READY
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check"></i> Ready for Pickup
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
