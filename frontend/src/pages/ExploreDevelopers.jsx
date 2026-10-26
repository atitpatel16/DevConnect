
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./ExploreDevelopers.css";

export default function ExploreDevelopers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUserId, setActionUserId] = useState("");

  const navigate = useNavigate();

  const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(
    /\/api\/?$/,
    ""
  );

  function getImageUrl(image) {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${apiOrigin}${image.startsWith("/") ? "" : "/"}${image}`;
  }

  function openDeveloperProfile(userId) {
    navigate(`/developers/${userId}`);
  }

  useEffect(() => {
    async function fetchDevelopers() {
      try {
        setLoading(true);
        setError("");

        const [usersResponse, profileResponse] = await Promise.all([
          api.get("/auth/users"),
          api.get("/auth/profile"),
        ]);

        setUsers(usersResponse.data.users || []);

        setCurrentUserId(
          String(profileResponse.data.user?._id || "")
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load developers. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDevelopers();
  }, []);

  async function handleFollow(userId) {
    try {
      setActionUserId(userId);
      setError("");

      const response = await api.post(`/auth/follow/${userId}`);

      const isNowFollowing =
        response.data.message === "User followed successfully";

      setUsers((previousUsers) =>
        previousUsers.map((user) => {
          if (String(user._id) !== userId) {
            return user;
          }

          const followers = user.followers || [];

          const alreadyFollows = followers.some(
            (id) => String(id?._id || id) === currentUserId
          );

          return {
            ...user,
            followers: isNowFollowing
              ? alreadyFollows
                ? followers
                : [...followers, currentUserId]
              : followers.filter(
                  (id) => String(id?._id || id) !== currentUserId
                ),
          };
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to follow this developer. Please try again."
      );
    } finally {
      setActionUserId("");
    }
  }

  const filteredUsers = users.filter((user) => {
    if (String(user._id) === currentUserId) return false;

    const searchText = search.toLowerCase().trim();
    const username = user.username || "";
    const bio = user.bio || "";

    const skills = Array.isArray(user.skills)
      ? user.skills.join(" ")
      : user.skills || "";

    return `${username} ${bio} ${skills}`
      .toLowerCase()
      .includes(searchText);
  });

  if (loading) {
    return (
      <div className="explore-page">
        <div className="explore-status">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Finding developers for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-page">
      <div className="explore-header">
        <div>
          <span className="explore-eyebrow">
            YOUR DEVELOPER COMMUNITY
          </span>
          <h1>Explore Developers</h1>
          <p>
            Discover developers, share knowledge, and grow together.
          </p>
        </div>

        <div className="explore-header-icon">
          <i className="bi bi-people"></i>
        </div>
      </div>

      <div className="explore-search">
        <i className="bi bi-search"></i>
        <input
          type="search"
          className="form-control"
          placeholder="Search by username, bio, or skills..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="explore-results-heading">
        <h2>Developers</h2>
        <span>{filteredUsers.length} found</span>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="explore-empty">
          <i className="bi bi-person-search"></i>
          <h3>No developers found</h3>
          <p>
            {search
              ? "Try another username or skill."
              : "Other developers will appear here when they join."}
          </p>
        </div>
      ) : (
        <div className="developer-grid">
          {filteredUsers.map((user) => {
            const userId = String(user._id);
            const followers = user.followers || [];

            const isFollowing = followers.some(
              (id) => String(id?._id || id) === currentUserId
            );

            const skills = Array.isArray(user.skills)
              ? user.skills
              : typeof user.skills === "string"
                ? user.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                : [];

            return (
              <article className="developer-card" key={userId}>
                <div className="developer-card-top">
                  <div
                    className="developer-avatar clickable-profile"
                    role="link"
                    tabIndex={0}
                    title={`View ${user.username}'s profile`}
                    onClick={() => openDeveloperProfile(userId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDeveloperProfile(userId);
                      }
                    }}
                  >
                    {user.profilePicture ? (
                      <img
                        src={getImageUrl(user.profilePicture)}
                        alt={`${user.username}'s profile`}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span>
                        {user.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>

                  <div className="developer-identity">
                    <h3>
                      <button
                        type="button"
                        className="developer-profile-link"
                        onClick={() => openDeveloperProfile(userId)}
                      >
                        {user.username}
                      </button>
                    </h3>

                    <span>
                      <i className="bi bi-person-check me-1"></i>
                      {followers.length} followers
                    </span>
                  </div>
                </div>

                <p className="developer-bio">
                  {user.bio || "This developer hasn't added a bio yet."}
                </p>

                <div className="developer-skills">
                  {skills.length > 0 ? (
                    skills.slice(0, 5).map((skill, index) => (
                      <span key={`${skill}-${index}`}>{skill}</span>
                    ))
                  ) : (
                    <span className="no-skills">No skills added</span>
                  )}
                </div>

                <div className="developer-card-bottom">
                  {user.githubUrl ? (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="developer-github"
                    >
                      <i className="bi bi-github"></i>
                      GitHub
                    </a>
                  ) : (
                    <span className="developer-github unavailable">
                      <i className="bi bi-github"></i>
                      No GitHub
                    </span>
                  )}

                  <button
                    type="button"
                    className={`developer-follow-btn ${
                      isFollowing ? "following" : ""
                    }`}
                    onClick={() => handleFollow(userId)}
                    disabled={actionUserId === userId}
                  >
                    {actionUserId === userId ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <>
                        <i
                          className={`bi ${
                            isFollowing
                              ? "bi-person-check-fill"
                              : "bi-person-plus"
                          }`}
                        ></i>
                        {isFollowing ? "Following" : "Follow"}
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
