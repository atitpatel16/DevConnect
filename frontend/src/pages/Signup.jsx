
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/signup", {
        username,
        email,
        password,
      });

      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
   localStorage.setItem("userId", data.user._id);

window.dispatchEvent(new Event("auth-changed"));
navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page signup-page">
      <div className="auth-decoration signup-decoration-one"></div>
      <div className="auth-decoration signup-decoration-two"></div>

      <section className="auth-card signup-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">
            <i className="bi bi-code-slash"></i>
          </span>
          DevConnect
        </Link>

        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>
            Join the community, showcase your projects, and meet developers.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger auth-alert" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-username">Username</label>
            <div className="auth-input-wrap">
              <i className="bi bi-person"></i>
              <input
                id="signup-username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                minLength={3}
                maxLength={30}
                required
              />
            </div>
            <small className="signup-hint">
              Use between 3 and 30 characters.
            </small>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email address</label>
            <div className="auth-input-wrap">
              <i className="bi bi-envelope"></i>
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <div className="auth-input-wrap">
              <i className="bi bi-lock"></i>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <small className="signup-hint">
              Password must contain at least 6 characters.
            </small>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <i className="bi bi-arrow-right"></i>}
          </button>
        </form>

        <div className="auth-divider">
          <span>START BUILDING YOUR NETWORK</span>
        </div>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <p className="auth-terms">
          Create an account to discover developers and share your projects.
        </p>
      </section>
    </main>
  );
}
