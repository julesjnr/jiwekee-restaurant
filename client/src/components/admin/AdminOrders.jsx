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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {STAGES.map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`category-pill ${stageFilter === st ? "active" : ""}`}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Search order #, customer, table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="custom-input"
            style={{ width: "240px", margin: 0 }}
          />
          <button type="submit" className="btn-action-sm btn-action-primary">
            Filter
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-notice">Loading active restaurant orders...</div>
      ) : orders.length === 0 ? (
        <div className="no-items-card">No orders found matching the filter.</div>
      ) : (
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer & Phone</th>
                <th>Type & Location</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Fulfillment Lifecycle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontWeight: "800", color: "#ffcc00" }}>#{o.id}</span>
                    <div style={{ fontSize: "11px", color: "#777" }}>
                      {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", color: "#fff" }}>{o.user_name || "Customer"}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{o.phone_number || "—"}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "#222",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {o.order_type}
                    </span>
                    {o.table_number && (
                      <div style={{ fontSize: "12px", color: "#ffcc00", marginTop: "3px" }}>
                        Table {o.table_number}
                      </div>
                    )}
                    {o.delivery_address && (
                      <div style={{ fontSize: "11px", color: "#aaa", marginTop: "3px", maxWidth: "200px" }}>
                        {o.delivery_address}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: "700", color: "#fff" }}>
                    KES {Number(o.amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-badge status-${o.status.toLowerCase()}`}>
                      {o.status} ({o.payment_method})
                    </span>
                    {o.mpesa_receipt && (
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                        Ref: {o.mpesa_receipt}
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      value={o.fulfillment_status || "Confirmed"}
                      onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                      style={{
                        background: "#222",
                        color: "#ffcc00",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: "600",
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
                      className="btn-action-sm btn-action-dark"
                    >
                      View Items ({o.items?.length || 1})
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
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2>Order #{selectedOrder.id} Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: "none", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "16px", fontSize: "13px", color: "#bbb" }}>
              <div><strong>Customer:</strong> {selectedOrder.user_name} ({selectedOrder.phone_number || "No phone"})</div>
              <div><strong>Order Type:</strong> {selectedOrder.order_type} {selectedOrder.table_number ? `(Table ${selectedOrder.table_number})` : ""}</div>
              {selectedOrder.delivery_address && <div><strong>Address:</strong> {selectedOrder.delivery_address}</div>}
              {selectedOrder.notes && <div><strong>Special Cooking Notes:</strong> <span style={{ color: "#ffcc00" }}>"{selectedOrder.notes}"</span></div>}
              <div><strong>Payment:</strong> {selectedOrder.payment_method} ({selectedOrder.status})</div>
            </div>

            <h3 style={{ fontSize: "14px", color: "#fff", marginBottom: "8px" }}>Ordered Dishes:</h3>
            <div style={{ background: "#222", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      fontSize: "13px",
                    }}
                  >
                    <span>
                      <strong style={{ color: "#ffcc00" }}>{item.quantity}x</strong> {item.name}
                    </span>
                    <span>KES {(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#888", fontSize: "12px" }}>Meal item details recorded.</p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                  fontWeight: "800",
                  color: "#ffcc00",
                  fontSize: "15px",
                }}
              >
                <span>Total Amount</span>
                <span>KES {Number(selectedOrder.amount).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              {selectedOrder.fulfillment_status !== "Completed" && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "Completed", "Paid")}
                  className="btn-action-sm btn-action-green"
                >
                  Mark Completed & Paid
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-action-sm btn-action-dark"
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
