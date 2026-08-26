import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableData, setNewTableData] = useState({
    table_number: "",
    capacity: 4,
    section: "Main Dining",
    status: "Available",
  });

  const fetchTables = () => {
    setLoading(true);
    api
      .getTables()
      .then((data) => setTables(data.tables || []))
      .catch((err) => console.error("Fetch tables error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await api.updateTableStatus(tableId, newStatus);
      fetchTables();
    } catch (err) {
      alert(err.message || "Failed to update table status.");
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      await api.createTable(newTableData);
      setIsAddModalOpen(false);
      setNewTableData({ table_number: "", capacity: 4, section: "Main Dining", status: "Available" });
      fetchTables();
    } catch (err) {
      alert(err.message || "Failed to add table.");
    }
  };

  const handleDelete = async (id, tableNum) => {
    if (!window.confirm(`Delete Table ${tableNum}?`)) return;
    try {
      await api.deleteTable(id);
      fetchTables();
    } catch (err) {
      alert(err.message || "Failed to delete table.");
    }
  };

  return (
    <div>
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-chair" style={{ color: "var(--primary)" }}></i>
            Dining Floor & Table Capacity Management
          </h2>
          <p className="admin-card-desc">
            Monitor real-time table statuses, assign dining sections, guest capacity, and track live seated dining tickets.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-restoran-primary">
          <i className="fa fa-plus"></i> Add Table
        </button>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading Floor & Dining Tables...</h4>
        </div>
      ) : (
        <div className="floor-tables-grid">
          {tables.map((t) => {
            const statusLower = t.status.toLowerCase();
            return (
              <div
                key={t.id}
                className={`table-status-card table-${statusLower}`}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontFamily: "Nunito, sans-serif", fontSize: "22px", fontWeight: "900", color: "var(--secondary)" }}>
                      {t.table_number}
                    </span>
                    <span className={`status-badge status-${statusLower === "occupied" ? "cancelled" : statusLower === "reserved" ? "pending" : "completed"}`}>
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: "var(--gray)", marginBottom: "6px" }}>
                    <i className="fa fa-map-pin" style={{ color: "var(--primary)", marginRight: "6px" }}></i>
                    <strong>Section:</strong> <span style={{ color: "var(--secondary)", fontWeight: "600" }}>{t.section}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--gray)", marginBottom: "14px" }}>
                    <i className="fa fa-user-friends" style={{ color: "var(--primary)", marginRight: "6px" }}></i>
                    <strong>Capacity:</strong> <span style={{ color: "var(--secondary)", fontWeight: "600" }}>{t.capacity} Guests</span>
                  </div>

                  {t.activeOrder ? (
                    <div
                      style={{
                        background: "rgba(2, 132, 199, 0.08)",
                        border: "1px solid rgba(2, 132, 199, 0.25)",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        marginBottom: "16px",
                        fontSize: "12.5px",
                      }}
                    >
                      <div style={{ color: "var(--color-info)", fontWeight: "800", fontFamily: "Nunito, sans-serif" }}>
                        <i className="fa fa-receipt" style={{ marginRight: "4px" }}></i> Active Order #{t.activeOrder.id}
                      </div>
                      <div style={{ color: "var(--secondary)", fontWeight: "600", marginTop: "2px" }}>
                        {t.activeOrder.user_name} • KES {Number(t.activeOrder.amount).toFixed(2)}
                      </div>
                      <div style={{ color: "var(--gray)", fontSize: "11px", marginTop: "2px" }}>
                        Status: <span className="status-badge status-preparing" style={{ padding: "1px 6px", fontSize: "10px" }}>{t.activeOrder.fulfillment_status}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "var(--light-bg)",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        marginBottom: "16px",
                        fontSize: "12px",
                        color: "var(--gray)",
                        border: "1px dashed var(--light-gray)",
                      }}
                    >
                      <i className="fa fa-check-circle" style={{ color: "var(--color-success)", marginRight: "4px" }}></i>
                      Table ready for guest seating
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className="restoran-select"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      fontSize: "12.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                  <button
                    onClick={() => handleDelete(t.id, t.table_number)}
                    className="btn-restoran-danger"
                    style={{ padding: "7px 10px" }}
                    title="Delete Table"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa fa-chair" style={{ color: "var(--primary)", fontSize: "20px" }}></i>
                <h3 className="admin-modal-title">Add Restaurant Dining Table</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTable}>
              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Table Number / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 07 or VIP-01"
                  value={newTableData.table_number}
                  onChange={(e) =>
                    setNewTableData({ ...newTableData, table_number: e.target.value })
                  }
                  className="restoran-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="restoran-label">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={newTableData.capacity}
                    onChange={(e) =>
                      setNewTableData({ ...newTableData, capacity: e.target.value })
                    }
                    className="restoran-input"
                  />
                </div>

                <div>
                  <label className="restoran-label">Floor Section</label>
                  <select
                    value={newTableData.section}
                    onChange={(e) =>
                      setNewTableData({ ...newTableData, section: e.target.value })
                    }
                    className="restoran-select"
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Terrace Garden">Terrace Garden</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="Balcony">Balcony</option>
                    <option value="Bar & High Tables">Bar & High Tables</option>
                  </select>
                </div>
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
                  <i className="fa fa-save"></i> Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
