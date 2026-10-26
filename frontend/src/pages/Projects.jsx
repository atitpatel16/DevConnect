import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Projects.css";

function getId(value) {
  if (!value) return "";
  return String(typeof value === "object" ? value._id : value);
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(
    localStorage.getItem("userId") || ""
  );

  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    liveUrl: "",
    githubUrl: "",
    contactNo: "",
    contactEmail: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsResponse, profileResponse] = await Promise.all([
          api.get("/projects/feed?limit=50"),
          api.get("/auth/profile"),
        ]);

        setProjects(projectsResponse.data.projects || []);

        const userId = getId(profileResponse.data.user);

        if (userId) {
          setCurrentUserId(userId);
          localStorage.setItem("userId", userId);
        }
      } catch (err) {
        console.error("Load projects error:", err);
        setError(
          err.response?.data?.message || "Unable to load projects."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function validateProjectForm() {
    if (!form.title.trim()) {
      setError("Please enter your project name.");
      return false;
    }

    if (!form.description.trim()) {
      setError("Please enter your project description.");
      return false;
    }

    if (!form.liveUrl.trim()) {
      setError("Please enter your project URL.");
      return false;
    }

    if (!form.githubUrl.trim()) {
      setError("Please enter your GitHub URL.");
      return false;
    }

    try {
      const projectUrl = new URL(form.liveUrl.trim());

      if (!["http:", "https:"].includes(projectUrl.protocol)) {
        setError("Please enter a valid project URL starting with https://");
        return false;
      }
    } catch {
      setError("Please enter a valid project URL starting with https://");
      return false;
    }

    try {
      const githubUrl = new URL(form.githubUrl.trim());

      if (
        !["http:", "https:"].includes(githubUrl.protocol) ||
        githubUrl.hostname.toLowerCase() !== "github.com"
      ) {
        setError("Please enter a valid GitHub URL, such as https://github.com/username/project");
        return false;
      }
    } catch {
      setError("Please enter a valid GitHub URL, such as https://github.com/username/project");
      return false;
    }

    return true;
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validateProjectForm()) {
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      liveUrl: form.liveUrl.trim(),
      githubUrl: form.githubUrl.trim(),
      contactNo: form.contactNo.trim(),
      contactEmail: form.contactEmail.trim(),
    };

    try {
      setCreating(true);

      const response = await api.post("/projects", payload);

      const feedResponse = await api.get("/projects/feed?limit=50");
      setProjects(feedResponse.data.projects || []);

      setForm({
        title: "",
        description: "",
        liveUrl: "",
        githubUrl: "",
        contactNo: "",
        contactEmail: "",
      });

      setShowForm(false);

      setSuccess(
        response.data.message || "Project created successfully."
      );
    } catch (err) {
      console.error("Create project error:", err);
      setError(
        err.response?.data?.message || "Unable to create project."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleLike(project) {
    const projectId = getId(project);
    const key = `like-${projectId}`;

    if (busy[key]) return;

    setError("");

    try {
      setBusy((previous) => ({ ...previous, [key]: true }));

      const response = await api.post(`/projects/${projectId}/like`);

      setProjects((previous) =>
        previous.map((item) => {
          if (getId(item) !== projectId) return item;

          const likes = item.likes || [];

          const updatedLikes = response.data.liked
            ? [
                ...likes.filter(
                  (user) => getId(user) !== currentUserId
                ),
                currentUserId,
              ]
            : likes.filter(
                (user) => getId(user) !== currentUserId
              );

          return { ...item, likes: updatedLikes };
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update like."
      );
    } finally {
      setBusy((previous) => ({ ...previous, [key]: false }));
    }
  }

  async function handleComment(project) {
    const projectId = getId(project);
    const key = `comment-${projectId}`;
    const text = (commentInputs[projectId] || "").trim();

    if (!text || busy[key]) return;

    setError("");

    try {
      setBusy((previous) => ({ ...previous, [key]: true }));

      const response = await api.post(
        `/projects/${projectId}/comments`,
        { text }
      );

      setProjects((previous) =>
        previous.map((item) =>
          getId(item) === projectId
            ? {
                ...item,
                comments: [
                  ...(item.comments || []),
                  response.data.comment,
                ],
              }
            : item
        )
      );

      setCommentInputs((previous) => ({
        ...previous,
        [projectId]: "",
      }));

      setExpandedComments((previous) => ({
        ...previous,
        [projectId]: true,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to add comment."
      );
    } finally {
      setBusy((previous) => ({ ...previous, [key]: false }));
    }
  }

  async function handleDeleteProject(project) {
    const projectId = getId(project);

    if (
      !window.confirm(
        `Are you sure you want to delete "${project.title}"?`
      )
    ) {
      return;
    }

    const key = `delete-${projectId}`;

    setError("");
    setSuccess("");

    try {
      setBusy((previous) => ({ ...previous, [key]: true }));

      const response = await api.delete(`/projects/${projectId}`);

      setProjects((previous) =>
        previous.filter((item) => getId(item) !== projectId)
      );

      setSuccess(
        response.data.message || "Project deleted successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete project."
      );
    } finally {
      setBusy((previous) => ({ ...previous, [key]: false }));
    }
  }

  function renderComments(project) {
    const projectId = getId(project);
    const comments = project.comments || [];
    const isExpanded = !!expandedComments[projectId];

    return (
      <div className="project-comments-section">
        <button
          type="button"
          className="project-view-comments"
          onClick={() =>
            setExpandedComments((previous) => ({
              ...previous,
              [projectId]: !previous[projectId],
            }))
          }
        >
          <i className="bi bi-chat-left-dots" />
          {isExpanded ? "Hide comments" : "View comments"} (
          {comments.length})
          <i
            className={`bi ${
              isExpanded ? "bi-chevron-up" : "bi-chevron-down"
            }`}
          />
        </button>

        {isExpanded && (
          <div className="project-comments-list">
            {comments.length === 0 ? (
              <p className="project-no-comments">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div className="project-comment" key={comment._id}>
                  <strong>
                    {comment.user?.username || "Developer"}
                  </strong>
                  <p>{comment.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        <form
          className="project-comment-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handleComment(project);
          }}
        >
          <input
            type="text"
            value={commentInputs[projectId] || ""}
            onChange={(event) =>
              setCommentInputs((previous) => ({
                ...previous,
                [projectId]: event.target.value,
              }))
            }
            placeholder="Write a comment..."
            maxLength={1000}
            aria-label="Write a project comment"
          />

          <button
            type="submit"
            disabled={
              !!busy[`comment-${projectId}`] ||
              !(commentInputs[projectId] || "").trim()
            }
          >
            {busy[`comment-${projectId}`] ? "Sending..." : "Comment"}
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div className="projects-page">Loading projects...</div>;
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Explore Projects</h1>
          <p>
            Share your work and discover what developers are building.
          </p>
        </div>

        <button
          type="button"
          className="projects-create-button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
            setSuccess("");
          }}
        >
          <i className="bi bi-plus-lg" />
          {showForm ? "Cancel" : "Create Project"}
        </button>
      </div>

      {error && <div className="projects-alert error">{error}</div>}
      {success && <div className="projects-alert success">{success}</div>}

      {showForm && (
        <form
          className="project-create-form"
          noValidate
          onSubmit={handleCreateProject}
        >
          <h2>Share a Project</h2>

          <label htmlFor="project-title">Project Name *</label>
          <input
            id="project-title"
            type="text"
            name="title"
            value={form.title}
            onChange={handleFormChange}
            placeholder="e.g. DevConnect"
            maxLength={100}
          />

          <label htmlFor="project-description">Description *</label>
          <textarea
            id="project-description"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            placeholder="Describe what your project does..."
            maxLength={3000}
            rows={4}
          />

          <label htmlFor="project-live-url">Project URL *</label>
          <input
            id="project-live-url"
            type="text"
            name="liveUrl"
            value={form.liveUrl}
            onChange={handleFormChange}
            placeholder="https://your-project.com"
          />

          <label htmlFor="project-github-url">GitHub URL *</label>
          <input
            id="project-github-url"
            type="text"
            name="githubUrl"
            value={form.githubUrl}
            onChange={handleFormChange}
            placeholder="https://github.com/username/project"
          />

          <div className="project-form-row">
            <div>
              <label htmlFor="project-contact-no">Contact Number</label>
              <input
                id="project-contact-no"
                type="tel"
                name="contactNo"
                value={form.contactNo}
                onChange={handleFormChange}
                maxLength={20}
                placeholder="Your contact number (optional)"
              />
            </div>

            <div>
              <label htmlFor="project-contact-email">Contact Email</label>
              <input
                id="project-contact-email"
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleFormChange}
                maxLength={254}
                placeholder="you@example.com (optional)"
              />
            </div>
          </div>

          <button
            type="submit"
            className="projects-create-button"
            disabled={creating}
          >
            {creating ? "Publishing..." : "Publish Project"}
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="projects-empty">
          <i className="bi bi-folder2-open" />
          <h2>No projects yet</h2>
          <p>
            Create the first project and share it with developers.
          </p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const projectId = getId(project);
            const ownerId = getId(project.owner);
            const isOwner = ownerId === currentUserId;

            const isLiked = (project.likes || []).some(
              (user) => getId(user) === currentUserId
            );

            return (
              <article className="project-card" key={projectId}>
                <div className="project-card-body">
                  <div className="project-card-top">
                    <span className="project-label">
                      <i className="bi bi-folder2-open" /> Project
                    </span>

                    {isOwner && (
                      <button
                        type="button"
                        className="project-delete-button"
                        disabled={!!busy[`delete-${projectId}`]}
                        onClick={() => handleDeleteProject(project)}
                        aria-label="Delete project"
                        title="Delete project"
                      >
                        <i className="bi bi-trash3" />
                        Delete
                      </button>
                    )}
                  </div>

                  <h2>{project.title}</h2>

                  <p className="project-description">
                    {project.description}
                  </p>

                  <div className="project-owner">
                    <i className="bi bi-person-circle" />
                    {project.owner?.username || "Developer"}
                    <span>
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>

                  <div className="project-contact-details">
                    {project.contactNo && (
                      <p>
                        <i className="bi bi-telephone" />{" "}
                        <a href={`tel:${project.contactNo}`}>
                          {project.contactNo}
                        </a>
                      </p>
                    )}

                    {project.contactEmail && (
                      <p>
                        <i className="bi bi-envelope" />{" "}
                        <a href={`mailto:${project.contactEmail}`}>
                          {project.contactEmail}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="project-card-links">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="bi bi-box-arrow-up-right" />
                        Project URL
                      </a>
                    )}

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="bi bi-github" /> GitHub
                      </a>
                    )}
                  </div>

                  <div className="project-interactions">
                    <button
                      type="button"
                      className={`project-like-button ${
                        isLiked ? "liked" : ""
                      }`}
                      disabled={!!busy[`like-${projectId}`]}
                      onClick={() => handleLike(project)}
                    >
                      <i
                        className={`bi ${
                          isLiked ? "bi-heart-fill" : "bi-heart"
                        }`}
                      />
                      {project.likes?.length || 0} Likes
                    </button>

                    <span className="project-comment-count">
                      <i className="bi bi-chat" />{" "}
                      {project.comments?.length || 0} Comments
                    </span>
                  </div>

                  {renderComments(project)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
                    }