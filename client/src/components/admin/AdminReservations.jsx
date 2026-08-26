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
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-calendar-check" style={{ color: "var(--primary)" }}></i>
            Online Table Reservations & Walk-ins Desk
          </h2>
          <p className="admin-card-desc">
            Manage advance guest reservations, dining schedules, party sizes, seating allocations, and arrival statuses.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="restoran-select"
            style={{ width: "auto", padding: "8px 14px", fontWeight: "700" }}
          >
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Seated">Seated</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-restoran-primary">
            <i className="fa fa-plus"></i> New Booking
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading Reservations from Database...</h4>
        </div>
      ) : reservations.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-calendar-times" style={{ fontSize: "36px", color: "var(--gray)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>No Reservations Found</h4>
          <p style={{ color: "var(--gray)", fontSize: "13px", marginTop: "6px" }}>No guest bookings recorded under the selected filter.</p>
        </div>
      ) : (
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Guest Name</th>
                <th>Phone</th>
                <th>Date & Time</th>
                <th>Party Size</th>
                <th>Assigned Table</th>
                <th>Special Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: "900", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif" }}>
                    #{r.id}
                  </td>
                  <td style={{ fontWeight: "700", color: "var(--secondary)" }}>{r.customer_name}</td>
                  <td>
                    <span style={{ color: "var(--gray)", fontSize: "13px" }}>
                      <i className="fa fa-phone" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                      {r.customer_phone || "—"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--secondary)" }}>
                      {new Date(r.reservation_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--primary-dark)", fontWeight: "800", marginTop: "2px" }}>
                      <i className="fa fa-clock" style={{ marginRight: "4px" }}></i>
                      {r.reservation_time}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "rgba(212, 167, 74, 0.15)",
                        color: "var(--primary-dark)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontWeight: "800",
                        fontSize: "12px",
                      }}
                    >
                      <i className="fa fa-user-friends" style={{ marginRight: "4px" }}></i>
                      {r.guest_count} Guests
                    </span>
                  </td>
                  <td>
                    <select
                      value={r.table_id || ""}
                      onChange={(e) =>
                        handleUpdateStatus(r.id, r.status, e.target.value ? Number(e.target.value) : null)
                      }
                      className="restoran-select"
                      style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        width: "auto",
                        fontWeight: "600",
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
                  <td style={{ maxWidth: "180px", fontSize: "12px", color: "var(--gray)" }}>
                    {r.special_requests || <span style={{ opacity: 0.5 }}>Standard seating</span>}
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
                          className="btn-restoran-primary"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                        >
                          <i className="fa fa-chair"></i> Seat
                        </button>
                      )}
                      {r.status === "Seated" && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, "Completed", r.table_id)}
                          className="btn-restoran-secondary"
                          style={{ padding: "4px 10px", fontSize: "11.5px" }}
                        >
                          <i className="fa fa-check"></i> Done
                        </button>
                      )}
                      {r.status !== "Cancelled" && r.status !== "Completed" && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, "Cancelled", r.table_id)}
                          className="btn-restoran-danger"
                          style={{ padding: "4px 8px", fontSize: "11.5px" }}
                          title="Cancel Reservation"
                        >
                          <i className="fa fa-times"></i>
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
        <div className="admin-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa fa-calendar-plus" style={{ color: "var(--primary)", fontSize: "20px" }}></i>
                <h3 className="admin-modal-title">New Guest Reservation / Walk-in</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReservation}>
              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grace Wanjiku"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="restoran-input"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="0712345678"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="restoran-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="restoran-label">Reservation Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                    className="restoran-input"
                  />
                </div>
                <div>
                  <label className="restoran-label">Reservation Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                    className="restoran-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="restoran-label">Number of Guests *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: Number(e.target.value) })}
                    className="restoran-input"
                  />
                </div>
                <div>
                  <label className="restoran-label">Assign Table</label>
                  <select
                    value={formData.table_id}
                    onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                    className="restoran-select"
                  >
                    <option value="">Auto-Assign / Open Seating</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label className="restoran-label">Special Occasion / Table Requests</label>
                <textarea
                  rows="2"
                  className="restoran-textarea"
                  placeholder="e.g. Birthday anniversary celebration, window booth preferred"
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-restoran-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-restoran-primary">
                  <i className="fa fa-check"></i> Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
