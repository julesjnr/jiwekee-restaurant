import { useState, useEffect, useRef } from "react";
import { api } from "../../api/client";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifs = () => {
    api
      .getNotifications()
      .then(data => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    fetchNotifs();
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notif-btn"
      >
        <i className="fa fa-bell" style={{ color: "var(--primary)" }}></i>
        Alerts
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown-card">
          <div className="notif-dropdown-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa fa-bell" style={{ color: "var(--primary)" }}></i>
              <h5>Restaurant Live Alerts</h5>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--gray)", fontSize: "13.5px" }}>
                <i className="fa fa-check-circle" style={{ color: "var(--color-success)", fontSize: "24px", display: "block", marginBottom: "8px" }}></i>
                No active notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? "unread" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontWeight: "800", fontSize: "13.5px", color: "var(--secondary)", fontFamily: "Nunito, sans-serif" }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--gray)" }}>
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "var(--secondary)", margin: 0, opacity: 0.85 }}>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
