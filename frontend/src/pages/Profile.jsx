
// import { useEffect, useState } from "react";
// import api from "../api/axios";
// import "./Profile.css";
// import { useState } from "react";


// export default function Profile() {
//   const [profile, setProfile] = useState(null);
//   const [bio, setBio] = useState("");
//   const [skills, setSkills] = useState("");
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState("");
//   const [githubUrl, setGithubUrl] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [message, setMessage] = useState("");


//   const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(
//     /\/api\/?$/,
//     ""
//   );

//   function getImageUrl(image) {
//     if (!image) return "";

//     if (
//       image.startsWith("blob:") ||
//       image.startsWith("http://") ||
//       image.startsWith("https://")
//     ) {
//       return image;
//     }

//     return `${apiOrigin}${image.startsWith("/") ? "" : "/"}${image}`;
//   }

//   useEffect(() => {
//     async function fetchProfile() {
//       try {
//         setLoading(true);
//         setError("");

//         const response = await api.get("/auth/profile");
//         const user = response.data.user;

//         setProfile(user);
//         setBio(user.bio || "");
//         setSkills(
//           Array.isArray(user.skills)
//             ? user.skills.join(", ")
//             : user.skills || ""
//         );
//         setImagePreview(user.profilePicture || "");
//         setGithubUrl(user.githubUrl || "");
//       } catch (err) {
//         setError(
//           err.response?.data?.message ||
//             "Unable to load your profile. Please try again."
//         );
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchProfile();
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (imagePreview.startsWith("blob:")) {
//         URL.revokeObjectURL(imagePreview);
//       }
//     };
//   }, [imagePreview]);

//   async function handleSubmit(event) {
//     event.preventDefault();

//     setError("");
//     setMessage("");

//     const skillList = skills
//       .split(",")
//       .map((skill) => skill.trim())
//       .filter(Boolean);

//     if (!bio.trim()) {
//       setError("Please enter your bio.");
//       return;
//     }

//     if (skillList.length === 0) {
//       setError("Please enter at least one skill.");
//       return;
//     }

//     if (!githubUrl.trim()) {
//       setError("Please enter your GitHub URL.");
//       return;
//     }

//     try {
//       new URL(githubUrl);

//       if (!["http:", "https:"].includes(new URL(githubUrl).protocol)) {
//         setError("Please enter a valid GitHub URL.");
//         return;
//       }
//     } catch {
//       setError("Please enter a valid GitHub URL.");
//       return;
//     }

//     setSaving(true);

//     try {
//       const formData = new FormData();

//       formData.append("bio", bio.trim());
//       formData.append("skills", JSON.stringify(skillList));
//       formData.append("githubUrl", githubUrl.trim());

//       if (selectedImage) {
//         formData.append("profilePicture", selectedImage);
//       }

//       const response = await api.put("/auth/profile", formData);
//       const updatedUser = response.data.user;

//       setProfile((previous) => ({
//         ...previous,
//         ...updatedUser,
//         followers: previous?.followers || [],
//         following: previous?.following || [],
//       }));

//       setImagePreview(updatedUser.profilePicture || "");
//       setSelectedImage(null);

//       const storedUser = JSON.parse(
//         localStorage.getItem("user") || "{}"
//       );

//       localStorage.setItem(
//         "user",
//         JSON.stringify({ ...storedUser, ...updatedUser })
//       );

//       setMessage("Profile updated successfully!");
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "Unable to update your profile. Please try again."
//       );
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className="profile-page">
//         <div className="profile-status">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p>Loading your profile...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error && !profile) {
//     return (
//       <div className="profile-page">
//         <div className="alert alert-danger" role="alert">
//           {error}
//         </div>
//       </div>
//     );
//   }

//   if (!profile) return null;

//   const skillList = Array.isArray(profile.skills)
//     ? profile.skills
//     : typeof profile.skills === "string"
//       ? profile.skills
//           .split(",")
//           .map((skill) => skill.trim())
//           .filter(Boolean)
//       : [];

//   return (
//     <div className="profile-page">
//       <section className="profile-header-card">
//         <div className="profile-cover"></div>

//         <div className="profile-header-content">
//           <div className="profile-avatar-large">
//             {imagePreview ? (
//               <img
//                 src={getImageUrl(imagePreview)}
//                 alt={`${profile.username}'s profile`}
//                 onError={(event) => {
//                   event.currentTarget.style.display = "none";
//                 }}
//               />
//             ) : (
//               <span>
//                 {profile.username?.charAt(0)?.toUpperCase() || "U"}
//               </span>
//             )}
//           </div>

//           <div className="profile-main-info">
//             <h1>{profile.username}</h1>
//             <p className="profile-email">{profile.email}</p>
//             <p className="profile-bio">
//               {profile.bio || "No bio added yet."}
//             </p>

//             <div className="profile-stats">
//               <div>
//                 <strong>{profile.followers?.length || 0}</strong>
//                 <span>Followers</span>
//               </div>

//               <div>
//                 <strong>{profile.following?.length || 0}</strong>
//                 <span>Following</span>
//               </div>
//             </div>

//             {profile.githubUrl && (
//               <a
//                 href={profile.githubUrl}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="profile-github-link"
//               >
//                 <i className="bi bi-github"></i>
//                 Visit GitHub Profile
//                 <i className="bi bi-box-arrow-up-right"></i>
//               </a>
//             )}
//           </div>
//         </div>
//       </section>

//       <section className="profile-details-grid">
//         <div className="profile-panel">
//           <div className="profile-panel-heading">
//             <div>
//               <h2>My Skills</h2>
//               <p>Technologies you work with</p>
//             </div>
//             <i className="bi bi-code-square"></i>
//           </div>

//           {skillList.length > 0 ? (
//             <div className="profile-skill-list">
//               {skillList.map((skill, index) => (
//                 <span
//                   className="profile-skill"
//                   key={`${skill}-${index}`}
//                 >
//                   {skill}
//                 </span>
//               ))}
//             </div>
//           ) : (
//             <p className="profile-empty">
//               No skills added yet. Add your skills using the form below.
//             </p>
//           )}
//         </div>

//         <div className="profile-panel profile-edit-panel">
//           <div className="profile-panel-heading">
//             <div>
//               <h2>Edit Profile</h2>
//               <p>Update your developer information.</p>
//             </div>
//             <i className="bi bi-pencil-square"></i>
//           </div>

//           <form onSubmit={handleSubmit} noValidate>
//             {error && (
//               <div className="alert alert-danger" role="alert">
//                 {error}
//               </div>
//             )}

//             {message && (
//               <div className="alert alert-success" role="alert">
//                 {message}
//               </div>
//             )}

//             <div className="profile-form-group">
//               <label htmlFor="profile-bio">Bio</label>
//               <textarea
//                 id="profile-bio"
//                 className="form-control"
//                 rows="3"
//                 maxLength={300}
//                 placeholder="Tell developers a little about yourself..."
//                 value={bio}
//                 onChange={(event) => setBio(event.target.value)}
//                 required
//               />
//             </div>

//             <div className="profile-form-group">
//               <label htmlFor="profile-skills">Skills</label>
//               <input
//                 id="profile-skills"
//                 className="form-control"
//                 type="text"
//                 placeholder="React, Node.js, MongoDB"
//                 value={skills}
//                 onChange={(event) => setSkills(event.target.value)}
//                 required
//               />
//               <small>Separate skills with commas.</small>
//             </div>

//             <div className="profile-form-group">
//               <label htmlFor="profile-picture">Profile Picture</label>
//               <input
//                 id="profile-picture"
//                 className="form-control"
//                 type="file"
//                 accept="image/jpeg,image/png,image/webp,image/gif"
//                 onChange={(event) => {
//                   const file = event.target.files?.[0];

//                   if (!file) return;

//                   if (file.size > 5 * 1024 * 1024) {
//                     setError("Image size must be 5 MB or less.");
//                     event.target.value = "";
//                     return;
//                   }

//                   setError("");
//                   setMessage("");
//                   setSelectedImage(file);
//                   setImagePreview(URL.createObjectURL(file));
//                 }}
//               />
//               <small>
//                 Choose JPG, PNG, WEBP or GIF. Maximum size: 5 MB.
//               </small>
//             </div>

//             <div className="profile-form-group">
//               <label htmlFor="profile-github">GitHub URL</label>
//               <input
//                 id="profile-github"
//                 className="form-control"
//                 type="url"
//                 placeholder="https://github.com/your-username"
//                 value={githubUrl}
//                 onChange={(event) => setGithubUrl(event.target.value)}
//                 required
//               />
//             </div>

//             <button
//               type="submit"
//               className="profile-save-button"
//               disabled={saving}
//             >
//               {saving ? (
//                 <>
//                   <span className="spinner-border spinner-border-sm me-2"></span>
//                   Saving...
//                 </>
//               ) : (
//                 <>
//                   <i className="bi bi-check2-circle me-2"></i>
//                   Save Changes
//                 </>
//               )}
//             </button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Profile.css";
import FollowersFollowing from "./FollowersFollowing";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [listType, setListType] = useState(null);

  const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(
    /\/api\/?$/,
    ""
  );

  function getImageUrl(image) {
    if (!image) return "";

    if (
      image.startsWith("blob:") ||
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${apiOrigin}${image.startsWith("/") ? "" : "/"}${image}`;
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/auth/profile");
        const user = response.data.user;

        setProfile(user);
        setBio(user.bio || "");
        setSkills(
          Array.isArray(user.skills)
            ? user.skills.join(", ")
            : user.skills || ""
        );
        setImagePreview(user.profilePicture || "");
        setGithubUrl(user.githubUrl || "");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const skillList = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (!bio.trim()) {
      setError("Please enter your bio.");
      return;
    }

    if (skillList.length === 0) {
      setError("Please enter at least one skill.");
      return;
    }

    if (!githubUrl.trim()) {
      setError("Please enter your GitHub URL.");
      return;
    }

    try {
      const parsedUrl = new URL(githubUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setError("Please enter a valid GitHub URL.");
        return;
      }
    } catch {
      setError("Please enter a valid GitHub URL.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("bio", bio.trim());
      formData.append("skills", JSON.stringify(skillList));
      formData.append("githubUrl", githubUrl.trim());

      if (selectedImage) {
        formData.append("profilePicture", selectedImage);
      }

      const response = await api.put("/auth/profile", formData);
      const updatedUser = response.data.user;

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
        followers: previous?.followers || [],
        following: previous?.following || [],
      }));

      setImagePreview(updatedUser.profilePicture || "");
      setSelectedImage(null);

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, ...updatedUser })
      );

      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-status">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const skillList = Array.isArray(profile.skills)
    ? profile.skills
    : typeof profile.skills === "string"
      ? profile.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="profile-page">
      <section className="profile-header-card">
        <div className="profile-cover"></div>

        <div className="profile-header-content">
          <div className="profile-avatar-large">
            {imagePreview ? (
              <img
                src={getImageUrl(imagePreview)}
                alt={`${profile.username}'s profile`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span>
                {profile.username?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          <div className="profile-main-info">
            <h1>{profile.username}</h1>
            <p className="profile-email">{profile.email}</p>
            <p className="profile-bio">
              {profile.bio || "No bio added yet."}
            </p>

         
<div className="profile-stats">
  <button
    type="button"
    className="profile-stat-btn"
    onClick={() => setListType("followers")}
    aria-label={`View ${profile.followers?.length || 0} followers`}
  >
    <strong>{profile.followers?.length || 0}</strong>
    <span>Followers</span>
    <i className="bi bi-people-fill"></i>
  </button>

  <button
    type="button"
    className="profile-stat-btn"
    onClick={() => setListType("following")}
    aria-label={`View ${profile.following?.length || 0} following`}
  >
    <strong>{profile.following?.length || 0}</strong>
    <span>Following</span>
    <i className="bi bi-person-check-fill"></i>
  </button>
</div>


            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="profile-github-link"
              >
                <i className="bi bi-github"></i>
                Visit GitHub Profile
                <i className="bi bi-box-arrow-up-right"></i>
              </a>
            )}
          </div>
        </div>
      </section>

      {listType && (
        <FollowersFollowing
          userId={profile._id}
          type={listType}
          onClose={() => setListType(null)}
        />
      )}

      <section className="profile-details-grid">
        <div className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <h2>My Skills</h2>
              <p>Technologies you work with</p>
            </div>
            <i className="bi bi-code-square"></i>
          </div>

          {skillList.length > 0 ? (
            <div className="profile-skill-list">
              {skillList.map((skill, index) => (
                <span
                  className="profile-skill"
                  key={`${skill}-${index}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="profile-empty">
              No skills added yet. Add your skills using the form below.
            </p>
          )}
        </div>

        <div className="profile-panel profile-edit-panel">
          <div className="profile-panel-heading">
            <div>
              <h2>Edit Profile</h2>
              <p>Update your developer information.</p>
            </div>
            <i className="bi bi-pencil-square"></i>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="alert alert-success" role="alert">
                {message}
              </div>
            )}

            <div className="profile-form-group">
              <label htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                className="form-control"
                rows="3"
                maxLength={300}
                placeholder="Tell developers a little about yourself..."
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-skills">Skills</label>
              <input
                id="profile-skills"
                className="form-control"
                type="text"
                placeholder="React, Node.js, MongoDB"
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                required
              />
              <small>Separate skills with commas.</small>
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-picture">Profile Picture</label>
              <input
                id="profile-picture"
                className="form-control"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (!file) return;

                  if (file.size > 5 * 1024 * 1024) {
                    setError("Image size must be 5 MB or less.");
                    event.target.value = "";
                    return;
                  }

                  setError("");
                  setMessage("");
                  setSelectedImage(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
              />
              <small>
                Choose JPG, PNG, WEBP or GIF. Maximum size: 5 MB.
              </small>
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-github">GitHub URL</label>
              <input
                id="profile-github"
                className="form-control"
                type="url"
                placeholder="https://github.com/your-username"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="profile-save-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
