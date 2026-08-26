import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    reservation_date: new Date().toISOString().split("T")[0],
    reservation_time: "19:00",
    guest_count: 2,
    special_requests: "",
    table_id: "",
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getAllReservations({ status: statusFilter }),
      api.getTables(),
    ])
      .then(([resData, tableData]) => {
        setReservations(resData.reservations || []);
        setTables(tableData.tables || []);
      })
      .catch((err) => console.error("Error loading reservations:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status, table_id) => {
    try {
      await api.updateReservationStatus(id, { status, table_id });
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to update reservation.");
    }
  };

  const handleAddReservation = async (e) => {
    e.preventDefault();
    try {
      await api.bookReservation(formData);
      setIsAddModalOpen(false);
      setFormData({
        customer_name: "",
        customer_phone: "",
        reservation_date: new Date().toISOString().split("T")[0],
        reservation_time: "19:00",
        guest_count: 2,
        special_requests: "",
        table_id: "",
      });
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to book reservation.");
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
        <div>
          <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>Reservations Desk</h2>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
            Manage table bookings, guest counts, seating assignments, and walk-ins.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "#222",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Seated">Seated</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-action-sm btn-action-primary">
            + New Booking
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-notice">Loading reservations list...</div>
      ) : reservations.length === 0 ? (
        <div className="no-items-card">No reservations found.</div>
      ) : (
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Guest</th>
                <th>Phone</th>
                <th>Date & Time</th>
                <th>Guests</th>
                <th>Assigned Table</th>
                <th>Special Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: "700", color: "#ffcc00" }}>#{r.id}</td>
                  <td style={{ fontWeight: "600", color: "#fff" }}>{r.customer_name}</td>
                  <td>{r.customer_phone || "—"}</td>
                  <td>
                    <div>{r.reservation_date}</div>
                    <div style={{ fontSize: "12px", color: "#ffcc00" }}>{r.reservation_time}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: "700" }}>{r.guest_count}</span> Pax
                  </td>
                  <td>
                    <select
                      value={r.table_id || ""}
                      onChange={(e) =>
                        handleUpdateStatus(r.id, r.status, e.target.value ? Number(e.target.value) : null)
                      }
                      style={{
                        background: "#222",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "12px",
                      }}
                    >
                      <option value="">-- Assign Table --</option>
                      {tables.map((tbl) => (
                        <option key={tbl.id} value={tbl.id}>
                          {tbl.table_number} ({tbl.section})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ maxWidth: "200px", fontSize: "12px", color: "#aaa" }}>
                    {r.special_requests || "None"}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${r.status.toLowerCase()}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {r.status === "Confirmed" && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, "Seated", r.table_id)}
                          className="btn-action-sm btn-action-green"
                        >
                          Seat Guests
                        </button>
                      )}
                      {r.status === "Seated" && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, "Completed", r.table_id)}
                          className="btn-action-sm btn-action-blue"
                        >
                          Complete
                        </button>
                      )}
                      {r.status !== "Cancelled" && r.status !== "Completed" && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, "Cancelled", r.table_id)}
                          className="btn-action-sm btn-action-red"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Booking Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>New Table Booking / Walk-in</h2>
            <form onSubmit={handleAddReservation}>
              <div className="form-input-group">
                <label>Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grace Wanjiku"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div className="form-input-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="0712345678"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-input-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                  />
                </div>
                <div className="form-input-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-input-group">
                  <label>Number of Guests *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: Number(e.target.value) })}
                  />
                </div>
                <div className="form-input-group">
                  <label>Assign Table</label>
                  <select
                    value={formData.table_id}
                    onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">Auto-Assign / Open</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-input-group">
                <label>Special Requests / Occasion</label>
                <textarea
                  rows="2"
                  className="custom-textarea"
                  placeholder="e.g. Birthday anniversary, window booth preferred"
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-action-sm btn-action-dark"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-sm btn-action-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
