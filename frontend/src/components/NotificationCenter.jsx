import { useState, useEffect } from "react";
import { fetchNotifications, markNotificationAsRead } from "../api/notifications";

const BellIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function NotificationCenter({ onSelect }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); 
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const handleToggle = () => setIsOpen(!isOpen);

  const handleRead = async (id, relatedId, type) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    if (onSelect) onSelect(relatedId, type);
    setIsOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={styles.container}>
      <button onClick={handleToggle} style={styles.bellBtn}>
        <BellIcon color={unreadCount > 0 ? "#6366f1" : "#94a3b8"} />
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>Notifications</div>
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>No new updates</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    ...styles.item,
                    backgroundColor: n.isRead ? "transparent" : "#f8fafc",
                  }}
                  onClick={() => handleRead(n._id, n.relatedId, n.type)}
                >
                  <div style={styles.itemContent}>{n.content}</div>
                  <div style={styles.itemTime}>
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { position: "relative", display: "inline-block" },
  bellBtn: {
    background: "transparent",
    border: "none",
    padding: "8px",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
  },
  badge: {
    position: "absolute",
    top: "2px",
    right: "2px",
    background: "#f43f5e",
    color: "white",
    borderRadius: "6px",
    padding: "2px 5px",
    fontSize: "9px",
    fontWeight: "850",
    boxShadow: "0 2px 4px rgba(244,63,94,0.3)",
  },
  dropdown: {
    position: "absolute",
    top: "48px",
    right: "0",
    width: "320px",
    maxHeight: "450px",
    background: "white",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    zIndex: 1000,
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: "800",
    fontSize: "12px",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  list: { padding: "0" },
  item: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  itemContent: { fontSize: "13px", color: "#334155", lineHeight: "1.5", marginBottom: "6px" },
  itemTime: { fontSize: "11px", color: "#94a3b8", fontWeight: "600" },
  empty: { padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" },
};
