import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("stock"); // 'stock' | 'logs'

  const [formData, setFormData] = useState({
    name: "",
    category: "Meat & Poultry",
    unit: "kg",
    current_quantity: 10,
    min_stock_level: 5,
    cost_per_unit: 500,
  });

  const [adjustData, setAdjustData] = useState({
    quantity_delta: 5,
    action_type: "Restock",
    reason: "Supplier delivery",
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.getInventory(), api.getInventoryLogs()])
      .then(([invData, logData]) => {
        setItems(invData.items || []);
        setLogs(logData.logs || []);
      })
      .catch((err) => console.error("Error loading inventory:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.createInventoryItem(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        category: "Meat & Poultry",
        unit: "kg",
        current_quantity: 10,
        min_stock_level: 5,
        cost_per_unit: 500,
      });
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to add inventory item.");
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      const delta =
        adjustData.action_type === "Waste / Spoilage" || adjustData.action_type === "Manual Correction" && Number(adjustData.quantity_delta) < 0
          ? -Math.abs(Number(adjustData.quantity_delta))
          : Number(adjustData.quantity_delta);

      await api.adjustStock(adjustingItem.id, {
        quantity_delta: delta,
        action_type: adjustData.action_type,
        reason: adjustData.reason,
      });
      setAdjustingItem(null);
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to adjust stock.");
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
          <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>Inventory & Stock Control</h2>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
            Track raw ingredients, automatic order deductions, supplier restocks, and wastage.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "#1c1c1c", borderRadius: "8px", padding: "4px" }}>
            <button
              onClick={() => setActiveSubTab("stock")}
              className={`btn-action-sm ${activeSubTab === "stock" ? "btn-action-primary" : "btn-action-dark"}`}
              style={{ border: "none" }}
            >
              Stock Items ({items.length})
            </button>
            <button
              onClick={() => setActiveSubTab("logs")}
              className={`btn-action-sm ${activeSubTab === "logs" ? "btn-action-primary" : "btn-action-dark"}`}
              style={{ border: "none" }}
            >
              Movement Logs ({logs.length})
            </button>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-action-sm btn-action-primary">
            + Add Ingredient
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-notice">Loading inventory data...</div>
      ) : activeSubTab === "stock" ? (
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Ingredient / Item</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Threshold</th>
                <th>Cost / Unit</th>
                <th>Stock Health</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = Number(item.current_quantity) <= Number(item.min_stock_level);
                return (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: "700", color: "#fff" }}>{item.name}</span>
                    </td>
                    <td>
                      <span style={{ background: "#222", padding: "3px 8px", borderRadius: "4px", fontSize: "12px" }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "800",
                          fontSize: "14px",
                          color: isLow ? "#ff4d4d" : "#38b000",
                        }}
                      >
                        {Number(item.current_quantity).toFixed(1)} {item.unit}
                      </span>
                    </td>
                    <td style={{ color: "#aaa" }}>
                      {item.min_stock_level} {item.unit}
                    </td>
                    <td style={{ color: "#ffcc00" }}>KES {Number(item.cost_per_unit).toFixed(2)}</td>
                    <td>
                      {isLow ? (
                        <span className="status-badge status-failed" style={{ fontSize: "11px" }}>
                          Low Stock
                        </span>
                      ) : (
                        <span className="status-badge status-paid" style={{ fontSize: "11px" }}>
                          ✓ Healthy
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustData({ quantity_delta: 10, action_type: "Restock", reason: "Supplier Restock" });
                        }}
                        className="btn-action-sm btn-action-dark"
                      >
                        Adjust / Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Inventory Audit Movement Logs */
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Item</th>
                <th>Action Type</th>
                <th>Change</th>
                <th>Remaining</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "#888", fontSize: "12px" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: "700", color: "#fff" }}>{log.item_name}</td>
                  <td>
                    <span
                      style={{
                        background: log.action_type === "Restock" ? "rgba(56,176,0,0.15)" : "rgba(255,77,77,0.15)",
                        color: log.action_type === "Restock" ? "#38b000" : "#ff4d4d",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {log.action_type}
                    </span>
                  </td>
                  <td
                    style={{
                      fontWeight: "800",
                      color: Number(log.quantity_delta) >= 0 ? "#38b000" : "#ff4d4d",
                    }}
                  >
                    {Number(log.quantity_delta) > 0 ? `+${log.quantity_delta}` : log.quantity_delta}
                  </td>
                  <td style={{ color: "#ffcc00" }}>{Number(log.resulting_quantity || 0).toFixed(1)}</td>
                  <td style={{ color: "#aaa", fontSize: "12px" }}>{log.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="modal-backdrop" onClick={() => setAdjustingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Adjust Stock: {adjustingItem.name}</h2>
            <div style={{ color: "#bbb", fontSize: "13px", marginBottom: "16px" }}>
              Current stock: <strong>{adjustingItem.current_quantity} {adjustingItem.unit}</strong>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="form-input-group">
                <label>Action Type</label>
                <select
                  value={adjustData.action_type}
                  onChange={(e) => setAdjustData({ ...adjustData, action_type: e.target.value })}
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
                  <option value="Restock">Restock (Add stock)</option>
                  <option value="Waste / Spoilage">Waste / Spoilage (Subtract stock)</option>
                  <option value="Manual Correction">Manual Physical Count Correction</option>
                </select>
              </div>

              <div className="form-input-group">
                <label>Quantity ({adjustingItem.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustData.quantity_delta}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity_delta: e.target.value })}
                />
              </div>

              <div className="form-input-group">
                <label>Reason / Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Farmers Market shipment"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="btn-action-sm btn-action-dark"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-sm btn-action-primary">
                  Submit Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Inventory Ingredient</h2>
            <form onSubmit={handleCreateItem}>
              <div className="form-input-group">
                <label>Ingredient / Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-input-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Produce & Veggies">Produce & Veggies</option>
                    <option value="Dairy & Cheese">Dairy & Cheese</option>
                    <option value="Grains & Flour">Grains & Flour</option>
                    <option value="Spices & Condiments">Spices & Condiments</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div className="form-input-group">
                  <label>Measurement Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, liters, pcs"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-input-group">
                  <label>Current Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({ ...formData, current_quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-input-group">
                  <label>Min Alert Level</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-input-group">
                <label>Cost Per Unit (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: Number(e.target.value) })}
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
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
