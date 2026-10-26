
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/auth/notifications");

      setNotifications(response.data.notifications || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      await api.patch(
        `/auth/notifications/${notificationId}/read`
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read"
      );
    }
  }

  if (loading) {
    return <div className="notifications-page">Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your developer activity.</p>
        </div>

        <span className="notification-count">
          {notifications.filter((item) => !item.isRead).length} unread
        </span>
      </div>

      {error && <p className="notification-error">{error}</p>}

      {notifications.length === 0 ? (
        <div className="empty-notifications">
          <h3>No notifications yet</h3>
          <p>When someone follows you, their activity will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-card ${
                notification.isRead ? "read" : "unread"
              }`}
            >
              <div className="notification-avatar">
                {notification.from?.profilePicture ? (
                //   <img
                //     src={notification.from.profilePicture}
                //     alt={notification.from.username || "Developer"}
                //   />
                <img
  src={
    notification.from.profilePicture?.startsWith("http")
      ? notification.from.profilePicture
      : `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "")}${notification.from.profilePicture}`
  }
  alt={notification.from.username || "Developer"}
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>
                ) : (
                  <span>
                    {notification.from?.username
                      ?.charAt(0)
                      .toUpperCase() || "D"}
                  </span>
                )}
              </div>

              <div className="notification-content">
                <p>
                  <strong>
                    {notification.from?.username || "A developer"}
                  </strong>{" "}
                  {notification.message || "sent you a notification."}
                </p>

                <span className="notification-type">
                  {notification.type || "Activity"}
                </span>
              </div>

              {!notification.isRead && (
                <button
                  className="mark-read-button"
                  onClick={() =>
                    handleMarkAsRead(notification._id)
                  }
                >
                  Mark as read
                </button>
              )}

              {!notification.isRead && (
                <span className="unread-dot" title="Unread" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
