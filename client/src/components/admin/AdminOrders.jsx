import { useState, useEffect } from "react";
import { api } from "../../api/client";

const STAGES = [
  "All",
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Completed",
  "Cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    api
      .getAllOrders({
        fulfillment: stageFilter === "All" ? "" : stageFilter,
        search,
      })
      .then((data) => setOrders(data.orders || []))
      .catch((err) => console.error("Error fetching orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [stageFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newFulfillment, newPayment) => {
    try {
      await api.updateOrderFulfillment(orderId, {
        fulfillment_status: newFulfillment,
        status: newPayment,
      });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          fulfillment_status: newFulfillment || prev.fulfillment_status,
          status: newPayment || prev.status,
        }));
      }
    } catch (err) {
      alert(err.message || "Failed to update order status.");
    }
  };

  return (
    <div>
      {/* Filters and Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-pill-group">
          {STAGES.map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`admin-pill-btn ${stageFilter === st ? "active" : ""}`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="admin-search-wrap">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Search order #, customer, table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
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
        <div className="admin-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "28px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading active restaurant orders...</h4>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <i className="fa fa-inbox" style={{ fontSize: "36px", color: "var(--gray)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>No orders found matching "{stageFilter}"</h4>
          <p style={{ color: "var(--gray)", fontSize: "13px", marginTop: "6px" }}>Try selecting another filter stage or clear the search field.</p>
        </div>
      ) : (
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer & Phone</th>
                <th>Type & Location</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Fulfillment Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontWeight: "900", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif", fontSize: "15px" }}>
                      #{o.id}
                    </span>
                    <div style={{ fontSize: "11px", color: "var(--gray)", marginTop: "2px" }}>
                      {new Date(o.created_at).toLocaleDateString([], { month: "short", day: "numeric" })} • {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--secondary)" }}>{o.user_name || "Guest Customer"}</div>
                    <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: "2px" }}>
                      <i className="fa fa-phone" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                      {o.phone_number || "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "var(--light-bg)",
                        padding: "3px 9px",
                        borderRadius: "4px",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        color: "var(--secondary)",
                        border: "1px solid var(--light-gray)",
                      }}
                    >
                      {o.order_type}
                    </span>
                    {o.table_number && (
                      <div style={{ fontSize: "12px", color: "var(--primary-dark)", fontWeight: "700", marginTop: "4px" }}>
                        <i className="fa fa-chair" style={{ marginRight: "4px" }}></i> Table {o.table_number}
                      </div>
                    )}
                    {o.delivery_address && (
                      <div style={{ fontSize: "11.5px", color: "var(--gray)", marginTop: "4px", maxWidth: "200px" }}>
                        <i className="fa fa-map-marker-alt" style={{ marginRight: "4px" }}></i>
                        {o.delivery_address}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif", fontSize: "15px" }}>
                    KES {Number(o.amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-badge status-${o.status.toLowerCase()}`}>
                      {o.status} ({o.payment_method})
                    </span>
                    {o.mpesa_receipt && (
                      <div style={{ fontSize: "11px", color: "var(--gray)", marginTop: "3px" }}>
                        Ref: <strong>{o.mpesa_receipt}</strong>
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      value={o.fulfillment_status || "Confirmed"}
                      onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                      className="restoran-select"
                      style={{
                        padding: "5px 10px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        width: "auto",
                        cursor: "pointer",
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="btn-restoran-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      <i className="fa fa-eye"></i> Items ({o.items?.length || 1})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Item Details Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa fa-receipt" style={{ color: "var(--primary)", fontSize: "22px" }}></i>
                <h3 className="admin-modal-title">Order #{selectedOrder.id} Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "20px", fontSize: "13.5px", color: "var(--secondary)", background: "var(--light-bg)", padding: "16px", borderRadius: "10px", border: "1px solid var(--light-gray)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div><strong>Customer:</strong> {selectedOrder.user_name || "Guest"}</div>
                <div><strong>Phone:</strong> {selectedOrder.phone_number || "—"}</div>
                <div><strong>Order Type:</strong> {selectedOrder.order_type} {selectedOrder.table_number ? `(Table ${selectedOrder.table_number})` : ""}</div>
                <div><strong>Payment:</strong> <span className={`status-badge status-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status} ({selectedOrder.payment_method})</span></div>
              </div>
              {selectedOrder.delivery_address && <div style={{ marginTop: "8px" }}><strong>Delivery Address:</strong> {selectedOrder.delivery_address}</div>}
              {selectedOrder.notes && (
                <div style={{ marginTop: "8px", background: "rgba(212, 167, 74, 0.12)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(212, 167, 74, 0.3)" }}>
                  <strong style={{ color: "var(--primary-dark)" }}>Chef Cooking Notes:</strong> "{selectedOrder.notes}"
                </div>
              )}
            </div>

            <h4 style={{ fontFamily: "Nunito, sans-serif", fontSize: "16px", fontWeight: "800", color: "var(--secondary)", marginBottom: "10px" }}>
              Ordered Items:
            </h4>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--light-gray)", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--light-gray)",
                      fontSize: "13.5px",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "rgba(212, 167, 74, 0.15)",
                          color: "var(--primary-dark)",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {item.quantity}x
                      </span>
                      <strong style={{ color: "var(--secondary)" }}>{item.name}</strong>
                    </span>
                    <span style={{ fontWeight: "700", color: "var(--secondary)" }}>
                      KES {(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--gray)", fontSize: "13px", margin: 0 }}>Recorded order items</p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "12px",
                  paddingTop: "10px",
                  fontWeight: "900",
                  color: "var(--primary-dark)",
                  fontSize: "17px",
                  fontFamily: "Nunito, sans-serif",
                }}
              >
                <span>Total Amount</span>
                <span>KES {Number(selectedOrder.amount).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              {selectedOrder.fulfillment_status !== "Completed" && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "Completed", "Paid")}
                  className="btn-restoran-primary"
                >
                  <i className="fa fa-check"></i> Mark Completed & Paid
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-restoran-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
