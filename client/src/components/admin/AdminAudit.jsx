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
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-history" style={{ color: "var(--primary)" }}></i>
            System Audit Trail & Security Logs
          </h2>
          <p className="admin-card-desc">
            Immutable activity log recording order workflows, payment reconciliations, stock alterations, and menu changes.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="admin-search-wrap">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Search audit trail logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
            style={{ width: "240px" }}
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
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading System Audit Trail...</h4>
        </div>
      ) : logs.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-shield-alt" style={{ fontSize: "36px", color: "var(--gray)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>No audit events found</h4>
          <p style={{ color: "var(--gray)", fontSize: "13px", marginTop: "6px" }}>Activity and security events will be logged here automatically.</p>
        </div>
      ) : (
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor / User</th>
                <th>Action Event</th>
                <th>Entity Affected</th>
                <th>Activity Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "var(--gray)", fontSize: "12.5px", whiteSpace: "nowrap" }}>
                    {new Date(log.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td>
                    <span style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>
                      <i className="fa fa-user-circle" style={{ color: "var(--primary)", marginRight: "6px" }}></i>
                      {log.user_name || "System"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "rgba(212, 167, 74, 0.15)",
                        color: "var(--primary-dark)",
                        border: "1px solid rgba(212, 167, 74, 0.3)",
                        padding: "3px 9px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: "800",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--color-info)", fontWeight: "700", fontSize: "12.5px" }}>
                      {log.entity} {log.entity_id ? `(#${log.entity_id})` : ""}
                    </span>
                  </td>
                  <td style={{ color: "var(--secondary)", fontSize: "12.5px", maxWidth: "420px" }}>
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
