
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./api/axios";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ExploreDevelopers from "./pages/ExploreDevelopers";
import Notifications from "./pages/Notifications";
import Posts from "./pages/Posts";
import DeveloperProfile from "./pages/DeveloperProfile";
import Projects from "./pages/Projects";
import "./App.css";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}


function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    function syncAuth() {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }

      setToken(localStorage.getItem("token"));
    }

    window.addEventListener("auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };


  }, []);

  
useEffect(() => {
  if (!token) {
    setUnreadCount(0);
    return;
  }

  let active = true;

  async function fetchUnreadCount() {
    try {
      const response = await api.get(
        "/auth/notifications/unread-count"
      );

      if (active) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Unread count error:", error);
    }
  }

  fetchUnreadCount();

  const intervalId = setInterval(fetchUnreadCount, 30000);

  return () => {
    active = false;
    clearInterval(intervalId);
  };
}, [token]);


  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");

    setUser(null);
    setToken(null);

    window.location.href = "/login";
  }

  return (
    <header className="top-navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">
          <i className="bi bi-code-slash"></i>
        </span>
        <span>DevConnect</span>
      </Link>

      <div className="navbar-right">
        {token && user ? (
          <>
           
<Link
  to="/notifications"
  className="nav-icon-link notification-bell"
  aria-label={`Notifications, ${unreadCount} unread`}
>
  <i className="bi bi-bell"></i>

  {unreadCount > 0 && (
    <span className="notification-badge">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</Link>


            <Link to="/profile" className="navbar-user">
              <span className="avatar">
                {user.username?.charAt(0)?.toUpperCase() || "U"}
              </span>
              <span className="navbar-username">
                {user.username || "My Profile"}
              </span>
            </Link>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline-primary btn-sm">
              Login
            </Link>

            <Link to="/signup" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}


function Sidebar() {
  return (
    <aside className="sidebar">
      <p className="sidebar-heading">MENU</p>

      <NavLink to="/" end className="sidebar-link">
        <i className="bi bi-house-door"></i>
        <span>Home</span>
      </NavLink>

      <NavLink to="/explore" className="sidebar-link">
        <i className="bi bi-people"></i>
        <span>Explore Developers</span>
      </NavLink>

      <NavLink to="/projects" className="sidebar-link">
        <i className="bi bi-folder2-open"></i>
        <span>Projects</span>
      </NavLink>
      <NavLink to="/posts" className="sidebar-link">
  <span>📝</span>
  <span>Posts</span>
</NavLink>

      <NavLink to="/notifications" className="sidebar-link">
        <i className="bi bi-bell"></i>
        <span>Notifications</span>
      </NavLink>

      <NavLink to="/profile" className="sidebar-link">
        <i className="bi bi-person"></i>
        <span>My Profile</span>
      </NavLink>

      <div className="sidebar-bottom">
        <div className="sidebar-help-icon">
          <i className="bi bi-lightbulb"></i>
        </div>
        <strong>Keep building!</strong>
        <p>Share your work and connect with developers.</p>
      </div>
    </aside>
  );
}

function ProtectedPage({ children }) {
  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Home() {
  const user = getCurrentUser();

  return (
    <div className="home-page">
      <section className="welcome-banner">
        <div>
          <span className="welcome-label">YOUR DEVELOPER COMMUNITY</span>
          <h1>
            Welcome back{user?.username ? `, ${user.username}` : ""}! 👋
          </h1>
          <p>
            Discover developers, share your projects, and grow together.
          </p>
          <Link to="/projects" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Explore Projects
          </Link>
        </div>
        <div className="welcome-art">
          <i className="bi bi-braces"></i>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>Get started</h2>
          <p>Make the most of your DevConnect account.</p>
        </div>
      </div>

      <div className="feature-grid">
        <FeatureCard
          icon="bi-people"
          title="Explore Developers"
          description="Find other developers and connect with people who share your interests."
          link="/explore"
          linkText="Find developers"
        />

        <FeatureCard
          icon="bi-folder2-open"
          title="Discover Projects"
          description="Explore projects, learn from others, and share what you build."
          link="/projects"
          linkText="View projects"
        />

        <FeatureCard
          icon="bi-person-circle"
          title="Complete Your Profile"
          description="Show your skills, bio, GitHub profile, and developer interests."
          link="/profile"
          linkText="View profile"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, link, linkText }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={link}>
        {linkText} <i className="bi bi-arrow-right ms-1"></i>
      </Link>
    </article>
  );
}

function Placeholder({ title, description }) {
  return (
    <section className="placeholder-page">
      <div className="placeholder-icon">
        <i className="bi bi-tools"></i>
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to="/" className="btn btn-primary">
        Back to Home
      </Link>
    </section>
  );
}

function AppLayout() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/"
          element={
            <ProtectedPage>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <Home />
                </main>
              </div>
            </ProtectedPage>
          }
        />

        {/* <Route
          path="/explore"
          element={
            <ProtectedPage>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <Placeholder
                    title="Explore Developers"
                    description="This page will display developers and the follow feature."
                  />
                </main>
              </div>
            </ProtectedPage>
          }
        /> */}


<Route
  path="/posts"
  element={
    <ProtectedPage>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Posts />
        </main>
      </div>
    </ProtectedPage>
  }
/>

        <Route
  path="/explore"
  element={
    <ProtectedPage>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <ExploreDevelopers />
        </main>
      </div>
    </ProtectedPage>
  }
/>

<Route
  path="/developers/:userId"
  element={
    <ProtectedPage>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <DeveloperProfile />
        </main>
      </div>
    </ProtectedPage>
  }
/>

      <Route
  path="/projects"
  element={
    <ProtectedPage>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Projects />
        </main>
      </div>
    </ProtectedPage>
  }
/>

        {/* <Route
          path="/notifications"
          element={
            <ProtectedPage>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <Placeholder
                    title="Notifications"
                    description="Your follow, like, and comment notifications will appear here."
                  />
                </main>
              </div>
            </ProtectedPage>
          }
        /> */}


        
<Route
  path="/notifications"
  element={
    <ProtectedPage>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Notifications />
        </main>
      </div>
    </ProtectedPage>
  }
/>


        <Route
          path="/profile"
          element={
            <ProtectedPage>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                 <Profile />
                </main>
              </div>
            </ProtectedPage>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
