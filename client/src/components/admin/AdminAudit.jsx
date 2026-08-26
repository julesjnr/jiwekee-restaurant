import { useState, useEffect } from "react";
import { api } from "../../api/client";

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = () => {
    setLoading(true);
    api
      .getAuditLogs({
        action: actionFilter,
        search,
      })
      .then((data) => setLogs(data.logs || []))
      .catch((err) => console.error("Audit log error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
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
          <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>System Audit Trail & Security Logs</h2>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
            Immutable activity trail for orders, status updates, inventory changes, and menu edits.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Search audit trail..."
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
        <div className="loading-notice">Loading audit trail...</div>
      ) : logs.length === 0 ? (
        <div className="no-items-card">No audit events recorded yet.</div>
      ) : (
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action Event</th>
                <th>Entity Affected</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "#888", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontWeight: "700", color: "#fff" }}>
                      {log.user_name || "System"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "rgba(255,204,0,0.12)",
                        color: "#ffcc00",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: "#00b4d8", fontSize: "12px" }}>
                    {log.entity} {log.entity_id ? `(#${log.entity_id})` : ""}
                  </td>
                  <td style={{ color: "#ccc", fontSize: "12px", maxWidth: "400px" }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
