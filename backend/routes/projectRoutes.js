
import express from "express";
import {
  createProject,
  getProjectFeed,
  getProjectById,
  getMyProjects,
  updateProject,
  deleteProject,
  toggleProjectLike,
  addProjectComment,
  deleteProjectComment,
} from "../controllers/projectController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public feed and project details
router.get("/feed", getProjectFeed);

// Protected routes
router.get("/mine", authMiddleware, getMyProjects);
router.post("/", authMiddleware, upload.single("projectImage"), createProject);
router.put("/:id", authMiddleware, upload.single("projectImage"), updateProject);
router.delete("/:id", authMiddleware, deleteProject);

router.post("/:id/like", authMiddleware, toggleProjectLike);
router.post("/:id/comments", authMiddleware, addProjectComment);
router.delete(
  "/:id/comments/:commentId",
  authMiddleware,
  deleteProjectComment
);

// Keep this route after /feed and /mine
router.get("/:id", getProjectById);

export default router;
