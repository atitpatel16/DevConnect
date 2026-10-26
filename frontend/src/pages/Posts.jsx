
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import "./Posts.css";

const API_ROOT = (import.meta.env.VITE_API_URL || "")
  .replace(/\/api\/?$/, "");

const getImageUrl = (url) => {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_ROOT}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getId = (value) => {
  if (!value) return "";

  return typeof value === "object" ? value._id : value;
};

function Posts() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  // Fetch all posts
  const fetchPosts = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/posts");
      setPosts(response.data.posts || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load posts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Create a new post
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Please write something before posting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();

      formData.append("text", text.trim());

      if (image) {
        formData.append("image", image);
      }

      const response = await api.post("/posts", formData);

      setPosts((current) => [
        response.data.post,
        ...current,
      ]);

      setText("");
      setImage(null);

      const fileInput = document.getElementById("post-image");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create post."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Like or unlike a post
  const handleLike = async (post) => {
    try {
      setError("");

      const response = await api.post(
        `/posts/${post._id}/like`
      );

      setPosts((current) =>
        current.map((item) => {
          if (item._id !== post._id) {
            return item;
          }

          let likes = item.likes || [];

          if (response.data.liked) {
            const alreadyPresent = likes.some(
              (user) => getId(user) === userId
            );

            if (!alreadyPresent) {
              likes = [...likes, userId];
            }
          } else {
            likes = likes.filter(
              (user) => getId(user) !== userId
            );
          }

          return { ...item, likes };
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update like."
      );
    }
  };

  // Add a comment
  const handleComment = async (e, postId) => {
    e.preventDefault();

    const commentText = (commentTexts[postId] || "").trim();

    if (!commentText) return;

    try {
      setError("");

      await api.post(`/posts/${postId}/comments`, {
        text: commentText,
      });

      setCommentTexts((current) => ({
        ...current,
        [postId]: "",
      }));

      await fetchPosts();

      // Keep comments open after submitting
      setExpandedComments((current) => ({
        ...current,
        [postId]: true,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not add comment."
      );
    }
  };

  // Delete own post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      setError("");

      await api.delete(`/posts/${postId}`);

      setPosts((current) =>
        current.filter((post) => post._id !== postId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete post."
      );
    }
  };

  // Delete own comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      setError("");

      await api.delete(
        `/posts/${postId}/comments/${commentId}`
      );

      await fetchPosts();

      setExpandedComments((current) => ({
        ...current,
        [postId]: true,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete comment."
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="posts-page">
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="posts-page">
      <div className="posts-heading">
        <div>
          <h1>Developer Feed</h1>
          <p>
            What's happening in tech? Share your thoughts,
            ideas, questions, and industry updates.
          </p>
        </div>
      </div>

      {error && (
        <div className="posts-error" role="alert">
          {error}
        </div>
      )}

      {/* Create Post */}
      <form
        className="create-post-card"
        onSubmit={handleCreatePost}
      >
        <h2>Create a post</h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's happening in tech? Share your thoughts on AI, web development, industry trends, or anything you'd like to discuss with fellow developers..."
          maxLength={2000}
          rows={4}
        />

        <div className="create-post-footer">
          <label
            className="post-image-label"
            htmlFor="post-image"
          >
            Add image
          </label>

          <input
            id="post-image"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(e.target.files?.[0] || null)
            }
          />

          <span className="post-char-count">
            {text.length}/2000
          </span>

          <button
            type="submit"
            disabled={submitting || !text.trim()}
          >
            {submitting ? "Posting..." : "Publish Post"}
          </button>
        </div>

        {image && (
          <p className="selected-image-name">
            Selected: {image.name}
          </p>
        )}
      </form>

      {/* Posts Feed */}
      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="posts-empty">
            <h2>No posts yet</h2>
            <p>
              Start a conversation! Share your thoughts
              about technology with fellow developers.
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const author = post.author || {};

            const liked = (post.likes || []).some(
              (user) => getId(user) === userId
            );

            const commentsOpen =
              Boolean(expandedComments[post._id]);

            const commentsCount =
              post.comments?.length || 0;

            return (
              <article className="post-card" key={post._id}>
                {/* Author */}
                <div className="post-author-row">
                  {author.profilePicture ? (
                    <img
                      className="post-avatar"
                      src={getImageUrl(author.profilePicture)}
                      alt=""
                    />
                  ) : (
                    <div className="post-avatar post-avatar-fallback">
                      {(author.username || "D")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="post-author-info">
                    <strong>
                      {author.username || "Developer"}
                    </strong>

                    <span>
                      {post.createdAt
                        ? new Date(
                            post.createdAt
                          ).toLocaleString()
                        : ""}
                    </span>
                  </div>

                  {getId(post.author) === userId && (
                    <button
                      className="post-delete-button"
                      type="button"
                      onClick={() =>
                        handleDeletePost(post._id)
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Post text */}
                <p className="post-text">{post.text}</p>

                {/* Optional post image */}
                {post.image && (
                  <img
                    className="post-image"
                    src={getImageUrl(post.image)}
                    alt="Post attachment"
                  />
                )}

                {/* Post statistics */}
                <div className="post-stats">
                  <span>
                    {post.likes?.length || 0} likes
                  </span>

                  <span>
                    {commentsCount} comments
                  </span>
                </div>

                {/* Like and Comment buttons */}
                <div className="post-actions">
                  <button
                    type="button"
                    className={
                      liked
                        ? "post-action liked"
                        : "post-action"
                    }
                    onClick={() => handleLike(post)}
                  >
                    {liked ? "♥ Liked" : "♡ Like"}
                  </button>

                  <button
                    type="button"
                    className="post-action"
                    onClick={() =>
                      setExpandedComments((current) => ({
                        ...current,
                        [post._id]: !current[post._id],
                      }))
                    }
                  >
                    {commentsOpen
                      ? "Hide comments"
                      : `💬 View comments (${commentsCount})`}
                  </button>
                </div>

                {/* Comments hidden until user clicks */}
                {commentsOpen && (
                  <div className="post-comments">
                    {commentsCount === 0 ? (
                      <p className="no-comments">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      (post.comments || []).map((comment) => (
                        <div
                          className="post-comment"
                          key={comment._id}
                        >
                          <div className="post-comment-content">
                            <strong>
                              {comment.user?.username ||
                                "Developer"}
                            </strong>

                            <p>{comment.text}</p>
                          </div>

                          {getId(comment.user) === userId && (
                            <button
                              type="button"
                              className="comment-delete-button"
                              onClick={() =>
                                handleDeleteComment(
                                  post._id,
                                  comment._id
                                )
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))
                    )}

                    {/* Add comment */}
                    <form
                      className="comment-form"
                      onSubmit={(e) =>
                        handleComment(e, post._id)
                      }
                    >
                      <input
                        id={`comment-${post._id}`}
                        type="text"
                        value={commentTexts[post._id] || ""}
                        onChange={(e) =>
                          setCommentTexts((current) => ({
                            ...current,
                            [post._id]: e.target.value,
                          }))
                        }
                        placeholder="Write a comment..."
                        maxLength={1000}
                      />

                      <button type="submit">Send</button>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Posts;
