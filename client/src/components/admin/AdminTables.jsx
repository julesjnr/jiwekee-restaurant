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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>Floor & Table Management</h2>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
            Track real-time table statuses, capacity, and active diner orders.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-action-sm btn-action-primary">
          + Add Table
        </button>
      </div>

      {loading ? (
        <div className="loading-notice">Loading dining room tables...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {tables.map((t) => {
            const statusClass = t.status.toLowerCase();
            return (
              <div
                key={t.id}
                style={{
                  background: "#181818",
                  border: `2px solid ${
                    t.status === "Occupied"
                      ? "#ff6b6b"
                      : t.status === "Reserved"
                      ? "#ffcc00"
                      : t.status === "Available"
                      ? "#38b000"
                      : "#555"
                  }`,
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "#fff" }}>
                      {t.table_number}
                    </span>
                    <span className={`status-badge status-${statusClass}`}>
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: "#bbb", marginBottom: "6px" }}>
                    <strong>Section:</strong> {t.section}
                  </div>
                  <div style={{ fontSize: "13px", color: "#bbb", marginBottom: "12px" }}>
                    <strong>Capacity:</strong> {t.capacity} Guests
                  </div>

                  {t.activeOrder ? (
                    <div
                      style={{
                        background: "rgba(0,180,216,0.1)",
                        border: "1px solid rgba(0,180,216,0.25)",
                        borderRadius: "8px",
                        padding: "10px",
                        marginBottom: "14px",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ color: "#00b4d8", fontWeight: "700" }}>
                        Active Order #{t.activeOrder.id}
                      </div>
                      <div style={{ color: "#eee" }}>
                        {t.activeOrder.user_name} • KES {Number(t.activeOrder.amount).toFixed(2)}
                      </div>
                      <div style={{ color: "#888", marginTop: "2px" }}>
                        Status: {t.activeOrder.fulfillment_status}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "8px",
                        padding: "10px",
                        marginBottom: "14px",
                        fontSize: "12px",
                        color: "#777",
                      }}
                    >
                      No active ticket
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    style={{
                      flex: 1,
                      background: "#222",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      fontSize: "12px",
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
                    className="btn-action-sm btn-action-red"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Restaurant Table</h2>
            <form onSubmit={handleAddTable}>
              <div className="form-input-group">
                <label>Table Number / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-07 or VIP-01"
                  value={newTableData.table_number}
                  onChange={(e) =>
                    setNewTableData({ ...newTableData, table_number: e.target.value })
                  }
                />
              </div>

              <div className="form-input-group">
                <label>Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={newTableData.capacity}
                  onChange={(e) =>
                    setNewTableData({ ...newTableData, capacity: e.target.value })
                  }
                />
              </div>

              <div className="form-input-group">
                <label>Floor Section</label>
                <select
                  value={newTableData.section}
                  onChange={(e) =>
                    setNewTableData({ ...newTableData, section: e.target.value })
                  }
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
                  <option value="Main Dining">Main Dining</option>
                  <option value="Terrace Garden">Terrace Garden</option>
                  <option value="VIP Lounge">VIP Lounge</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Bar & High Tables">Bar & High Tables</option>
                </select>
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
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
