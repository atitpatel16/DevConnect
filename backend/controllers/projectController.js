
// import mongoose from "mongoose";
// import Project from "../models/projectModel.js";
// import fs from "fs/promises";
// import path from "path";

// const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// const validUrl = (value) => {
//   if (!value) return true;

//   try {
//     const parsed = new URL(value);
//     return ["http:", "https:"].includes(parsed.protocol);
//   } catch {
//     return false;
//   }
// };

// const removeLocalImage = async (imageUrl) => {
//   if (!imageUrl || !imageUrl.startsWith("/uploads/projects/")) return;

//   const filename = path.basename(imageUrl);
//   const filePath = path.resolve("uploads/projects", filename);

//   try {
//     await fs.unlink(filePath);
//   } catch (error) {
//     if (error.code !== "ENOENT") {
//       console.error("Image deletion error:", error.message);
//     }
//   }
// };

// // CREATE PROJECT
// export const createProject = async (req, res) => {
//   let savedImage = "";

//   try {
//     const {
//       title,
//       description,
//       liveUrl = "",
//       githubUrl = "",
//     } = req.body;

//     if (
//       typeof title !== "string" ||
//       !title.trim() ||
//       typeof description !== "string" ||
//       !description.trim()
//     ) {
//       return res.status(400).json({
//         message: "Title and description are required",
//       });
//     }

//     if (
//       typeof liveUrl !== "string" ||
//       typeof githubUrl !== "string" ||
//       !validUrl(liveUrl) ||
//       !validUrl(githubUrl)
//     ) {
//       return res.status(400).json({
//         message: "Please provide valid HTTP or HTTPS URLs",
//       });
//     }

//     let technologies = req.body.technologies ?? [];

//     if (typeof technologies === "string") {
//       try {
//         technologies = JSON.parse(technologies);
//       } catch {
//         technologies = technologies.split(",");
//       }
//     }

//     if (!Array.isArray(technologies)) {
//       return res.status(400).json({
//         message: "Technologies must be an array or comma-separated string",
//       });
//     }

//     technologies = [
//       ...new Set(
//         technologies
//           .filter((item) => typeof item === "string")
//           .map((item) => item.trim())
//           .filter(Boolean)
//       ),
//     ];

//     if (technologies.length > 20) {
//       return res.status(400).json({
//         message: "Maximum 20 technologies are allowed",
//       });
//     }

//     if (req.file) {
//       savedImage = `/uploads/projects/${req.file.filename}`;
//     }

//     const project = await Project.create({
//       title: title.trim(),
//       description: description.trim(),
//       liveUrl: liveUrl.trim(),
//       githubUrl: githubUrl.trim(),
//       technologies,
//       projectImage: savedImage,
//       owner: req.userId,
//     });

//     return res.status(201).json({
//       message: "Project created successfully",
//       project,
//     });
//   } catch (error) {
//     if (savedImage) await removeLocalImage(savedImage);

//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: error.message });
//     }

//     console.error("Create project error:", error);

//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

// // PROJECT FEED
// export const getProjectFeed = async (req, res) => {
//   try {
//     const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
//     const limit = Math.min(
//       50,
//       Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
//     );

//     const [projects, total] = await Promise.all([
//       Project.find()
//         .populate("owner", "username profilePicture bio")
//         .populate("likes", "username profilePicture")
//         .populate("comments.user", "username profilePicture")
//         .sort({ createdAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(limit),

//       Project.countDocuments(),
//     ]);

//     return res.status(200).json({
//       message: "Project feed fetched successfully",
//       projects,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Project feed error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // SINGLE PROJECT DETAILS
// export const getProjectById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!isValidId(id)) {
//       return res.status(400).json({ message: "Invalid project ID" });
//     }

//     const project = await Project.findById(id)
//       .populate("owner", "username profilePicture bio")
//       .populate("likes", "username profilePicture")
//       .populate("comments.user", "username profilePicture");

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     return res.status(200).json({
//       message: "Project fetched successfully",
//       project,
//     });
//   } catch (error) {
//     console.error("Get project error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // PROJECTS BY CURRENT USER
// export const getMyProjects = async (req, res) => {
//   try {
//     const projects = await Project.find({ owner: req.userId })
//       .populate("owner", "username profilePicture")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       message: "Your projects fetched successfully",
//       projects,
//     });
//   } catch (error) {
//     console.error("My projects error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // UPDATE PROJECT
// export const updateProject = async (req, res) => {
//   let newImage = "";
//   let oldImage = "";

//   try {
//     const { id } = req.params;

//     if (!isValidId(id)) {
//       return res.status(400).json({ message: "Invalid project ID" });
//     }

//     const project = await Project.findById(id);

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     if (project.owner.toString() !== req.userId) {
//       return res.status(403).json({
//         message: "You can update only your own projects",
//       });
//     }

//     const { title, description, liveUrl, githubUrl } = req.body;

//     if (title !== undefined) {
//       if (typeof title !== "string" || !title.trim()) {
//         return res.status(400).json({
//           message: "Title cannot be empty",
//         });
//       }

//       project.title = title.trim();
//     }

//     if (description !== undefined) {
//       if (typeof description !== "string" || !description.trim()) {
//         return res.status(400).json({
//           message: "Description cannot be empty",
//         });
//       }

//       project.description = description.trim();
//     }

//     if (liveUrl !== undefined) {
//       if (typeof liveUrl !== "string" || !validUrl(liveUrl)) {
//         return res.status(400).json({
//           message: "Invalid live URL",
//         });
//       }

//       project.liveUrl = liveUrl.trim();
//     }

//     if (githubUrl !== undefined) {
//       if (typeof githubUrl !== "string" || !validUrl(githubUrl)) {
//         return res.status(400).json({
//           message: "Invalid GitHub URL",
//         });
//       }

//       project.githubUrl = githubUrl.trim();
//     }

//     if (req.body.technologies !== undefined) {
//       let technologies = req.body.technologies;

//       if (typeof technologies === "string") {
//         try {
//           technologies = JSON.parse(technologies);
//         } catch {
//           technologies = technologies.split(",");
//         }
//       }

//       if (!Array.isArray(technologies)) {
//         return res.status(400).json({
//           message: "Technologies must be an array or comma-separated string",
//         });
//       }

//       technologies = [
//         ...new Set(
//           technologies
//             .filter((item) => typeof item === "string")
//             .map((item) => item.trim())
//             .filter(Boolean)
//         ),
//       ];

//       if (technologies.length > 20) {
//         return res.status(400).json({
//           message: "Maximum 20 technologies are allowed",
//         });
//       }

//       project.technologies = technologies;
//     }

//     // Preserve the old image path before replacing it
//     oldImage = project.projectImage;

//     if (req.file) {
//       newImage = `/uploads/projects/${req.file.filename}`;
//       project.projectImage = newImage;
//     }

//     await project.save();

//     // Delete old image only after the database save succeeds
//     if (newImage && oldImage) {
//       await removeLocalImage(oldImage);
//     }

//     return res.status(200).json({
//       message: "Project updated successfully",
//       project,
//     });
//   } catch (error) {
//     // If updating fails, clean up the newly uploaded image
//     if (newImage) await removeLocalImage(newImage);

//     console.error("Update project error:", error);

//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: error.message });
//     }

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // DELETE PROJECT
// export const deleteProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!isValidId(id)) {
//       return res.status(400).json({ message: "Invalid project ID" });
//     }

//     const project = await Project.findById(id);

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     if (project.owner.toString() !== req.userId) {
//       return res.status(403).json({
//         message: "You can delete only your own projects",
//       });
//     }

//     const imageUrl = project.projectImage;

//     await project.deleteOne();
//     await removeLocalImage(imageUrl);

//     return res.status(200).json({
//       message: "Project deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete project error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // LIKE / UNLIKE PROJECT
// export const toggleProjectLike = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!isValidId(id)) {
//       return res.status(400).json({ message: "Invalid project ID" });
//     }

//     const project = await Project.findById(id);

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     const alreadyLiked = project.likes.some(
//       (userId) => userId.toString() === req.userId
//     );

//     if (alreadyLiked) {
//       project.likes = project.likes.filter(
//         (userId) => userId.toString() !== req.userId
//       );
//     } else {
//       project.likes.push(req.userId);
//     }

//     await project.save();

//     return res.status(200).json({
//       message: alreadyLiked ? "Project unliked" : "Project liked",
//       liked: !alreadyLiked,
//       likesCount: project.likes.length,
//     });
//   } catch (error) {
//     console.error("Toggle like error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ADD COMMENT
// export const addProjectComment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { text } = req.body;

//     if (!isValidId(id)) {
//       return res.status(400).json({ message: "Invalid project ID" });
//     }

//     if (typeof text !== "string" || !text.trim()) {
//       return res.status(400).json({
//         message: "Comment text is required",
//       });
//     }

//     if (text.trim().length > 1000) {
//       return res.status(400).json({
//         message: "Comment cannot exceed 1000 characters",
//       });
//     }

//     const project = await Project.findById(id);

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     project.comments.push({
//       user: req.userId,
//       text: text.trim(),
//     });

//     await project.save();

//     const updatedProject = await Project.findById(id)
//       .populate("comments.user", "username profilePicture");

//     const comment =
//       updatedProject.comments[updatedProject.comments.length - 1];

//     return res.status(201).json({
//       message: "Comment added successfully",
//       comment,
//       commentsCount: updatedProject.comments.length,
//     });
//   } catch (error) {
//     console.error("Add comment error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // DELETE OWN COMMENT
// export const deleteProjectComment = async (req, res) => {
//   try {
//     const { id, commentId } = req.params;

//     if (!isValidId(id) || !isValidId(commentId)) {
//       return res.status(400).json({
//         message: "Invalid project ID or comment ID",
//       });
//     }

//     const project = await Project.findById(id);

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     const comment = project.comments.id(commentId);

//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     if (comment.user.toString() !== req.userId) {
//       return res.status(403).json({
//         message: "You can delete only your own comments",
//       });
//     }

//     comment.deleteOne();
//     await project.save();

//     return res.status(200).json({
//       message: "Comment deleted successfully",
//       commentsCount: project.comments.length,
//     });
//   } catch (error) {
//     console.error("Delete comment error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };








import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import User from "../models/userModel.js";
import fs from "fs/promises";
import path from "path";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const validUrl = (value) => {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const removeLocalImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith("/uploads/projects/")) return;

  const filename = path.basename(imageUrl);
  const filePath = path.resolve("uploads/projects", filename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Image deletion error:", error.message);
    }
  }
};

// CREATE NOTIFICATION FOR PROJECT OWNER
const notifyProjectOwner = async ({
  ownerId,
  actorId,
  type,
  actionText,
}) => {
  // Do not notify when users interact with their own project
  if (
    !ownerId ||
    !actorId ||
    ownerId.toString() === actorId.toString()
  ) {
    return;
  }

  try {
    const actor = await User.findById(actorId).select("username");

    if (!actor) return;

    await User.findByIdAndUpdate(ownerId, {
      $push: {
        notifications: {
          type,
          message: `${actor.username} ${actionText}`,
          from: actorId,
          isRead: false,
          createdAt: new Date(),
        },
      },
    });
  } catch (error) {
    // Notification failure should not break the like/comment request
    console.error("Project notification error:", error);
  }
};

// CREATE PROJECT
export const createProject = async (req, res) => {
  let savedImage = "";

  try {
    const {
      title,
      description,
      liveUrl = "",
      githubUrl = "",
        contactNo = "",
  contactEmail = "",
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    // if (
    //   typeof liveUrl !== "string" ||
    //   typeof githubUrl !== "string" ||
    //   !validUrl(liveUrl) ||
    //   !validUrl(githubUrl)
    // ) {
    //   return res.status(400).json({
    //     message: "Please provide valid HTTP or HTTPS URLs",
    //   });
    // }

    if (
  typeof liveUrl !== "string" ||
  typeof githubUrl !== "string" ||
  !validUrl(liveUrl) ||
  !validUrl(githubUrl) ||
  !liveUrl.trim() ||
  !githubUrl.trim()
) {
  return res.status(400).json({
    message: "Valid Project URL and GitHub URL are required",
  });
}


    //contact and email

    if (
  typeof contactNo !== "string" ||
  typeof contactEmail !== "string" ||
  contactNo.length > 20 ||
  contactEmail.length > 254
) {
  return res.status(400).json({
    message: "Invalid contact number or email",
  });
}

if (
  contactEmail.trim() &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
) {
  return res.status(400).json({
    message: "Please provide a valid contact email",
  });
}

    let technologies = req.body.technologies ?? [];

    if (typeof technologies === "string") {
      try {
        technologies = JSON.parse(technologies);
      } catch {
        technologies = technologies.split(",");
      }
    }

    if (!Array.isArray(technologies)) {
      return res.status(400).json({
        message: "Technologies must be an array or comma-separated string",
      });
    }

    technologies = [
      ...new Set(
        technologies
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];

    if (technologies.length > 20) {
      return res.status(400).json({
        message: "Maximum 20 technologies are allowed",
      });
    }

    if (req.file) {
      savedImage = `/uploads/projects/${req.file.filename}`;
    }



    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      liveUrl: liveUrl.trim(),
      githubUrl: githubUrl.trim(),
      technologies,
      projectImage: savedImage,
      contactNo: contactNo.trim(),
contactEmail: contactEmail.trim().toLowerCase(),
      owner: req.userId,
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    if (savedImage) await removeLocalImage(savedImage);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// PROJECT FEED
// export const getProjectFeed = async (req, res) => {
//   try {
//     const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

//     const limit = Math.min(
//       50,
//       Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
//     );

//     const [projects, total] = await Promise.all([
//       Project.find()
//         .populate("owner", "username profilePicture bio")
//         .populate("likes", "username profilePicture")
//         .populate("comments.user", "username profilePicture")
//         .sort({ createdAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(limit),

//       Project.countDocuments(),
//     ]);

//     return res.status(200).json({
//       message: "Project feed fetched successfully",
//       projects,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Project feed error:", error);

//     return res.status(500).json({ message: "Server error" });
//   }
// };



 // PROJECT FEED OR PROJECTS BY A SPECIFIC OWNER
export const getProjectFeed = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = {};

    if (req.query.owner) {
      if (!mongoose.Types.ObjectId.isValid(req.query.owner)) {
        return res.status(400).json({
          message: "Invalid owner ID",
        });
      }

      filter.owner = req.query.owner;
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("owner", "username profilePicture bio")
        .populate("likes", "username profilePicture")
        .populate("comments.user", "username profilePicture")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Project.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Project feed fetched successfully",
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Project feed error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};



// SINGLE PROJECT DETAILS
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(id)
      .populate("owner", "username profilePicture bio")
      .populate("likes", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({
      message: "Project fetched successfully",
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// PROJECTS BY CURRENT USER
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId })
      .populate("owner", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Your projects fetched successfully",
      projects,
    });
  } catch (error) {
    console.error("My projects error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// UPDATE PROJECT
export const updateProject = async (req, res) => {
  let newImage = "";
  let oldImage = "";

  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can update only your own projects",
      });
    }

    const { title, description, liveUrl, githubUrl,contactNo,contactEmail, } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Title cannot be empty",
        });
      }

      project.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          message: "Description cannot be empty",
        });
      }

      project.description = description.trim();
    }

    if (liveUrl !== undefined) {
      if (typeof liveUrl !== "string" || !validUrl(liveUrl)) {
        return res.status(400).json({
          message: "Invalid live URL",
        });
      }

      project.liveUrl = liveUrl.trim();
    }

    if (githubUrl !== undefined) {
      if (typeof githubUrl !== "string" || !validUrl(githubUrl)) {
        return res.status(400).json({
          message: "Invalid GitHub URL",
        });
      }

      project.githubUrl = githubUrl.trim();
    }

    if (contactNo !== undefined) {
  if (typeof contactNo !== "string" || contactNo.length > 20) {
    return res.status(400).json({
      message: "Invalid contact number",
    });
  }

  project.contactNo = contactNo.trim();
}

if (contactEmail !== undefined) {
  if (
    typeof contactEmail !== "string" ||
    contactEmail.length > 254 ||
    (contactEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()))
  ) {
    return res.status(400).json({
      message: "Invalid contact email",
    });
  }

  project.contactEmail = contactEmail.trim().toLowerCase();
}

    if (req.body.technologies !== undefined) {
      let technologies = req.body.technologies;

      if (typeof technologies === "string") {
        try {
          technologies = JSON.parse(technologies);
        } catch {
          technologies = technologies.split(",");
        }
      }

      if (!Array.isArray(technologies)) {
        return res.status(400).json({
          message: "Technologies must be an array or comma-separated string",
        });
      }

      technologies = [
        ...new Set(
          technologies
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        ),
      ];

      if (technologies.length > 20) {
        return res.status(400).json({
          message: "Maximum 20 technologies are allowed",
        });
      }

      project.technologies = technologies;
    }

    oldImage = project.projectImage;

    if (req.file) {
      newImage = `/uploads/projects/${req.file.filename}`;
      project.projectImage = newImage;
    }

    await project.save();

    if (newImage && oldImage) {
      await removeLocalImage(oldImage);
    }

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    if (newImage) await removeLocalImage(newImage);

    console.error("Update project error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE PROJECT
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can delete only your own projects",
      });
    }

    const imageUrl = project.projectImage;

    await project.deleteOne();
    await removeLocalImage(imageUrl);

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// LIKE / UNLIKE PROJECT + NOTIFICATION
export const toggleProjectLike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const alreadyLiked = project.likes.some(
      (userId) => userId.toString() === req.userId
    );

    if (alreadyLiked) {
      project.likes = project.likes.filter(
        (userId) => userId.toString() !== req.userId
      );
    } else {
      project.likes.push(req.userId);
    }

    await project.save();

    // Notify owner only for a new like, not for unlike
    if (!alreadyLiked) {
      await notifyProjectOwner({
        ownerId: project.owner,
        actorId: req.userId,
        type: "like",
        actionText: `liked your project "${project.title}"`,
      });
    }

    return res.status(200).json({
      message: alreadyLiked ? "Project unliked" : "Project liked",
      liked: !alreadyLiked,
      likesCount: project.likes.length,
    });
  } catch (error) {
    console.error("Toggle like error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// ADD COMMENT + NOTIFICATION
export const addProjectComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        message: "Comment cannot exceed 1000 characters",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.comments.push({
      user: req.userId,
      text: text.trim(),
    });

    await project.save();

    // Notify owner when someone comments on their project
    await notifyProjectOwner({
      ownerId: project.owner,
      actorId: req.userId,
      type: "comment",
      actionText: `commented on your project "${project.title}"`,
    });

    const updatedProject = await Project.findById(id)
      .populate("comments.user", "username profilePicture");

    const comment =
      updatedProject.comments[updatedProject.comments.length - 1];

    return res.status(201).json({
      message: "Comment added successfully",
      comment,
      commentsCount: updatedProject.comments.length,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE OWN COMMENT
export const deleteProjectComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    if (!isValidId(id) || !isValidId(commentId)) {
      return res.status(400).json({
        message: "Invalid project ID or comment ID",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const comment = project.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can delete only your own comments",
      });
    }

    comment.deleteOne();
    await project.save();

    return res.status(200).json({
      message: "Comment deleted successfully",
      commentsCount: project.comments.length,
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};
