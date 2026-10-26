
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./FollowersFollowing.css";

function FollowersFollowing({ userId, type, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(
    /\/api\/?$/,
    ""
  );

  function getImageUrl(image) {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("blob:")
    ) {
      return image;
    }

    return `${apiOrigin}${image.startsWith("/") ? "" : "/"}${image}`;
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        setLoading(true);
        setError("");
        setUsers([]);

       const response = await api.get(
  `/auth/${userId}/${type}`
);

        if (!cancelled) {
          setUsers(response.data[type] || []);
        }
      } catch (err) {
        console.error("Followers/Following API Error:", err);
        console.error("Status:", err.response?.status);
        console.error("Response:", err.response?.data);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load users. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (
      userId &&
      (type === "followers" || type === "following")
    ) {
      fetchUsers();
    } else {
      setError("Invalid user or list type.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [userId, type]);

  return (
    <div className="ff-overlay" onClick={onClose}>
      <div
        className="ff-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ff-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ff-header">
          <h2 id="ff-title">
            {type === "followers" ? "Followers" : "Following"}
          </h2>

          <button
            type="button"
            className="ff-close"
            onClick={onClose}
            aria-label="Close list"
          >
            ×
          </button>
        </div>

        {loading && (
          <p className="ff-message">Loading users...</p>
        )}

        {!loading && error && (
          <p className="ff-message ff-error">{error}</p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="ff-message">
            {type === "followers"
              ? "No followers yet."
              : "You are not following anyone yet."}
          </p>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="ff-list">
            {users.map((user) => (
              <div className="ff-user" key={user._id}>
                {user.profilePicture ? (
                  <img
                    className="ff-avatar"
                    src={getImageUrl(user.profilePicture)}
                    alt={`${user.username}'s profile`}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.classList.remove(
                        "ff-avatar-fallback-hidden"
                      );
                    }}
                  />
                ) : null}

                <div
                  className={`ff-avatar ff-avatar-fallback ${
                    user.profilePicture
                      ? "ff-avatar-fallback-hidden"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {user.username?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="ff-user-info">
                  <strong>{user.username}</strong>
                  <p>{user.bio || "No bio added yet."}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowersFollowing;


