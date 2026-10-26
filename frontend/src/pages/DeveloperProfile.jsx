
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import "./DeveloperProfile.css";

const API_ROOT = (import.meta.env.VITE_API_URL || "").replace(
  /\/api\/?$/,
  ""
);

function getImageUrl(url) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_ROOT}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getId(value) {
  if (!value) return "";
  return String(typeof value === "object" ? value._id : value);
}

export default function DeveloperProfile() {
  const { userId } = useParams();

  const [developer, setDeveloper] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    let active = true;

    async function fetchDeveloperData() {
      setLoading(true);
      setError("");

      try {
        const [usersResponse, profileResponse] = await Promise.all([
          api.get("/auth/users"),
          api.get("/auth/profile"),
        ]);

        const users = usersResponse.data.users || [];
        const selectedDeveloper = users.find(
          (user) => getId(user) === userId
        );

        if (!active) return;

        setCurrentUserId(getId(profileResponse.data.user));

        if (!selectedDeveloper) {
          setDeveloper(null);
          setError("Developer not found.");
          return;
        }

        setDeveloper(selectedDeveloper);

        const [postsResponse, projectsResponse] = await Promise.all([
          api.get(`/posts?author=${encodeURIComponent(userId)}`),
          api.get(`/projects/feed?owner=${encodeURIComponent(userId)}`),
        ]);

        if (!active) return;

        setPosts(postsResponse.data.posts || []);
        setProjects(projectsResponse.data.projects || []);
      } catch (err) {
        if (active) {
          console.error("Developer profile error:", err);

          setError(
            err.response?.data?.message ||
              "Unable to load this developer's profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDeveloperData();

    return () => {
      active = false;
    };
  }, [userId]);

  async function handleLike(type, itemId) {
    const key = `${type}-${itemId}`;

    try {
      setActionError("");
      setActionLoading((previous) => ({
        ...previous,
        [key]: true,
      }));

      const response = await api.post(
        type === "post"
          ? `/posts/${itemId}/like`
          : `/projects/${itemId}/like`
      );

      const updateItems = (items) =>
        items.map((item) => {
          if (getId(item) !== itemId) return item;

          let likes = item.likes || [];

          if (response.data.liked) {
            const alreadyLiked = likes.some(
              (user) => getId(user) === currentUserId
            );

            if (!alreadyLiked) {
              likes = [...likes, currentUserId];
            }
          } else {
            likes = likes.filter(
              (user) => getId(user) !== currentUserId
            );
          }

          return { ...item, likes };
        });

      if (type === "post") {
        setPosts(updateItems);
      } else {
        setProjects(updateItems);
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to like this item. Please try again."
      );
    } finally {
      setActionLoading((previous) => ({
        ...previous,
        [key]: false,
      }));
    }
  }

  async function handleComment(type, itemId) {
    const key = `${type}-${itemId}`;
    const text = (commentInputs[key] || "").trim();

    if (!text) return;

    try {
      setActionError("");
      setActionLoading((previous) => ({
        ...previous,
        [key]: true,
      }));

      const response = await api.post(
        type === "post"
          ? `/posts/${itemId}/comments`
          : `/projects/${itemId}/comments`,
        { text }
      );

      const newComment = response.data.comment;

      const updateItems = (items) =>
        items.map((item) =>
          getId(item) === itemId
            ? {
                ...item,
                comments: [...(item.comments || []), newComment],
              }
            : item
        );

      if (type === "post") {
        setPosts(updateItems);
      } else {
        setProjects(updateItems);
      }

      setCommentInputs((previous) => ({
        ...previous,
        [key]: "",
      }));
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to add comment. Please try again."
      );
    } finally {
      setActionLoading((previous) => ({
        ...previous,
        [key]: false,
      }));
    }
  }

  function renderComments(item, type) {
  const itemId = getId(item);
  const key = `${type}-${itemId}`;
  const isExpanded = !!expandedComments[key];
  const comments = item.comments || [];

  return (
    <div className="developer-comments-section">
      <button
        type="button"
        className="developer-view-comments"
        onClick={() =>
          setExpandedComments((previous) => ({
            ...previous,
            [key]: !previous[key],
          }))
        }
      >
        <i
          className={`bi ${
            isExpanded ? "bi-chat-left-dots-fill" : "bi-chat-left-dots"
          }`}
        />
        {isExpanded ? "Hide comments" : "View comments"}
        {" "}({comments.length})
        <i
          className={`bi ${
            isExpanded ? "bi-chevron-up" : "bi-chevron-down"
          }`}
        />
      </button>

      {isExpanded && (
        <div className="developer-comments-list">
          {comments.length === 0 ? (
            <p className="developer-no-comments">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div className="developer-comment" key={comment._id}>
                <strong>
                  {comment.user?.username || "Developer"}
                </strong>
                <p>{comment.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


  function renderInteraction(item, type) {
    const itemId = getId(item);
    const key = `${type}-${itemId}`;

    const isLiked = item.likes?.some(
      (user) => getId(user) === currentUserId
    );

    return (
      <div className="developer-interactions">
        <div className="developer-content-stats">
          <button
            type="button"
            className="developer-like-button"
            disabled={!!actionLoading[key]}
            onClick={() => handleLike(type, itemId)}
          >
            <i
              className={`bi ${
                isLiked ? "bi-heart-fill text-danger" : "bi-heart"
              }`}
            />
            {" "}{item.likes?.length || 0} Likes
          </button>

          <span>
            <i className="bi bi-chat" />
            {" "}{item.comments?.length || 0} Comments
          </span>
        </div>

        {renderComments(item)}

        <form
          className="developer-comment-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleComment(type, itemId);
          }}
        >
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentInputs[key] || ""}
            onChange={(event) =>
              setCommentInputs((previous) => ({
                ...previous,
                [key]: event.target.value,
              }))
            }
            maxLength={1000}
            aria-label="Write a comment"
          />

          <button
            type="submit"
            disabled={
              !!actionLoading[key] ||
              !(commentInputs[key] || "").trim()
            }
          >
            {actionLoading[key] ? "Please wait..." : "Comment"}
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="developer-profile-page">
        <p>Loading developer profile...</p>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="developer-profile-page">
        <p>{error || "Developer not found."}</p>
        <Link to="/explore">Back to Explore Developers</Link>
      </div>
    );
  }

  const skills = Array.isArray(developer.skills)
    ? developer.skills
    : typeof developer.skills === "string"
      ? developer.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [];

  return (
    <div className="developer-profile-page">
      <Link to="/explore" className="developer-back-link">
        <i className="bi bi-arrow-left" /> Explore Developers
      </Link>

      {error && <div className="alert alert-danger">{error}</div>}

      {actionError && (
        <div className="alert alert-danger">{actionError}</div>
      )}

      <section className="developer-profile-card">
        <div className="developer-profile-avatar">
          {developer.profilePicture ? (
            <img
              src={getImageUrl(developer.profilePicture)}
              alt={`${developer.username}'s profile`}
            />
          ) : (
            <span>
              {developer.username?.charAt(0)?.toUpperCase() || "D"}
            </span>
          )}
        </div>

        <div className="developer-profile-info">
          <h1>{developer.username || "Developer"}</h1>

          <p>
            {developer.bio || "This developer hasn't added a bio yet."}
          </p>

          <div className="developer-profile-stats">
            <span>
              <strong>{developer.followers?.length || 0}</strong> Followers
            </span>
            <span>
              <strong>{posts.length}</strong> Posts
            </span>
            <span>
              <strong>{projects.length}</strong> Projects
            </span>
          </div>

          {skills.length > 0 && (
            <div className="developer-profile-skills">
              {skills.map((skill, index) => (
                <span key={`${skill}-${index}`}>{skill}</span>
              ))}
            </div>
          )}

          {developer.githubUrl && (
            <a
              href={developer.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="developer-profile-github"
            >
              <i className="bi bi-github" /> GitHub Profile
            </a>
          )}
        </div>
      </section>

      <div className="developer-profile-tabs">
        <button
          type="button"
          className={activeTab === "posts" ? "active" : ""}
          onClick={() => setActiveTab("posts")}
        >
          <i className="bi bi-chat-square-text" /> Posts ({posts.length})
        </button>

        <button
          type="button"
          className={activeTab === "projects" ? "active" : ""}
          onClick={() => setActiveTab("projects")}
        >
          <i className="bi bi-folder2-open" /> Projects ({projects.length})
        </button>
      </div>

      {activeTab === "posts" && (
        <section className="developer-profile-feed">
          {posts.length === 0 ? (
            <div className="developer-profile-empty">
              <i className="bi bi-chat-square-text" />
              <h3>No posts yet</h3>
              <p>This developer hasn't shared any posts.</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                className="developer-content-card"
                key={post._id}
              >
                <div className="developer-content-date">
                  <i className="bi bi-clock" />{" "}
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : ""}
                </div>

                <p className="developer-post-text">{post.text}</p>

                {post.image && (
                  <img
                    className="developer-post-image"
                    src={getImageUrl(post.image)}
                    alt="Post attachment"
                  />
                )}

                {renderInteraction(post, "post")}
              </article>
            ))
          )}
        </section>
      )}

      {activeTab === "projects" && (
        <section className="developer-project-grid">
          {projects.length === 0 ? (
            <div className="developer-profile-empty">
              <i className="bi bi-folder2-open" />
              <h3>No projects yet</h3>
              <p>This developer hasn't shared any projects.</p>
            </div>
          ) : (
            projects.map((project) => (
              <article
                className="developer-project-card"
                key={project._id}
              >
                {project.projectImage && (
                  <img
                    className="developer-project-image"
                    src={getImageUrl(project.projectImage)}
                    alt={project.title}
                  />
                )}

                <div className="developer-project-body">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>

                  {project.technologies?.length > 0 && (
                    <div className="developer-profile-skills">
                      {project.technologies.map((technology, index) => (
                        <span key={`${technology}-${index}`}>
                          {technology}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="developer-project-links">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="bi bi-github" /> Source Code
                      </a>
                    )}

                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="bi bi-box-arrow-up-right" /> Live Demo
                      </a>
                    )}
                  </div>

                  {renderInteraction(project, "project")}
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}
