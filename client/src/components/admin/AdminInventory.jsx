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
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-boxes" style={{ color: "var(--primary)" }}></i>
            Kitchen Inventory & Stock Control
          </h2>
          <p className="admin-card-desc">
            Monitor raw food ingredients, auto-deductions from kitchen orders, supplier deliveries, and waste tracking.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="admin-pill-group">
            <button
              onClick={() => setActiveSubTab("stock")}
              className={`admin-pill-btn ${activeSubTab === "stock" ? "active" : ""}`}
            >
              <i className="fa fa-warehouse" style={{ marginRight: "4px" }}></i>
              Stock Items ({items.length})
            </button>
            <button
              onClick={() => setActiveSubTab("logs")}
              className={`admin-pill-btn ${activeSubTab === "logs" ? "active" : ""}`}
            >
              <i className="fa fa-history" style={{ marginRight: "4px" }}></i>
              Movement Logs ({logs.length})
            </button>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-restoran-primary">
            <i className="fa fa-plus"></i> Add Ingredient
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading Inventory from PostgreSQL...</h4>
        </div>
      ) : activeSubTab === "stock" ? (
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Ingredient / Material</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Alert Threshold</th>
                <th>Cost / Unit</th>
                <th>Health Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = Number(item.current_quantity) <= Number(item.min_stock_level);
                return (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>
                        {item.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: "var(--light-bg)", border: "1px solid var(--light-gray)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", color: "var(--secondary)" }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "900",
                          fontSize: "15px",
                          fontFamily: "Nunito, sans-serif",
                          color: isLow ? "var(--color-danger)" : "var(--color-success)",
                        }}
                      >
                        {Number(item.current_quantity).toFixed(1)} {item.unit}
                      </span>
                    </td>
                    <td style={{ color: "var(--gray)", fontSize: "13px" }}>
                      {item.min_stock_level} {item.unit}
                    </td>
                    <td style={{ fontWeight: "800", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif" }}>
                      KES {Number(item.cost_per_unit).toFixed(2)}
                    </td>
                    <td>
                      {isLow ? (
                        <span className="status-badge status-cancelled">
                          <i className="fa fa-exclamation-triangle"></i> Low Stock
                        </span>
                      ) : (
                        <span className="status-badge status-completed">
                          <i className="fa fa-check"></i> Healthy
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustData({ quantity_delta: 10, action_type: "Restock", reason: "Supplier Restock" });
                        }}
                        className="btn-restoran-secondary"
                        style={{ padding: "5px 12px", fontSize: "12px" }}
                      >
                        <i className="fa fa-sliders-h"></i> Adjust Stock
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
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Item</th>
                <th>Action Type</th>
                <th>Delta Change</th>
                <th>Remaining Quantity</th>
                <th>Reason / Supplier</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "var(--gray)", fontSize: "12.5px" }}>
                    {new Date(log.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ fontWeight: "700", color: "var(--secondary)" }}>{log.item_name}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        log.action_type === "Restock" ? "status-completed" : "status-cancelled"
                      }`}
                    >
                      {log.action_type}
                    </span>
                  </td>
                  <td
                    style={{
                      fontWeight: "900",
                      fontFamily: "Nunito, sans-serif",
                      color: Number(log.quantity_delta) >= 0 ? "var(--color-success)" : "var(--color-danger)",
                    }}
                  >
                    {Number(log.quantity_delta) > 0 ? `+${log.quantity_delta}` : log.quantity_delta}
                  </td>
                  <td style={{ fontWeight: "800", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif" }}>
                    {Number(log.resulting_quantity || 0).toFixed(1)}
                  </td>
                  <td style={{ color: "var(--gray)", fontSize: "12.5px" }}>{log.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="admin-modal-overlay" onClick={() => setAdjustingItem(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa fa-boxes" style={{ color: "var(--primary)", fontSize: "20px" }}></i>
                <h3 className="admin-modal-title">Adjust Stock: {adjustingItem.name}</h3>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>

            <div style={{ background: "var(--light-bg)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--light-gray)", marginBottom: "16px", fontSize: "13.5px", color: "var(--secondary)" }}>
              Current stock level: <strong>{adjustingItem.current_quantity} {adjustingItem.unit}</strong>
            </div>

            <form onSubmit={handleAdjustStock}>
              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Action Type</label>
                <select
                  value={adjustData.action_type}
                  onChange={(e) => setAdjustData({ ...adjustData, action_type: e.target.value })}
                  className="restoran-select"
                >
                  <option value="Restock">Restock (Add stock)</option>
                  <option value="Waste / Spoilage">Waste / Spoilage (Subtract stock)</option>
                  <option value="Manual Correction">Manual Physical Count Correction</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Quantity ({adjustingItem.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustData.quantity_delta}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity_delta: e.target.value })}
                  className="restoran-input"
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label className="restoran-label">Reason / Delivery Ref</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly wholesale market delivery"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="restoran-input"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="btn-restoran-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-restoran-primary">
                  <i className="fa fa-check"></i> Submit Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa fa-plus-circle" style={{ color: "var(--primary)", fontSize: "20px" }}></i>
                <h3 className="admin-modal-title">Add Inventory Ingredient</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem}>
              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Ingredient / Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="restoran-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="restoran-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="restoran-select"
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
                <div>
                  <label className="restoran-label">Measurement Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, liters, pcs"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="restoran-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="restoran-label">Current Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({ ...formData, current_quantity: Number(e.target.value) })}
                    className="restoran-input"
                  />
                </div>
                <div>
                  <label className="restoran-label">Min Alert Level</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                    className="restoran-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label className="restoran-label">Cost Per Unit (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: Number(e.target.value) })}
                  className="restoran-input"
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
                  <i className="fa fa-save"></i> Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
