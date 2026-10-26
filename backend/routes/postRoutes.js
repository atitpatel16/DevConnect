
import express from "express";

import {
  createPost,
  getPosts,
  deletePost,
  togglePostLike,
  addPostComment,
  deletePostComment,
} from "../controllers/postController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public feed
router.get("/", getPosts);

// Login required
router.post("/", authMiddleware, upload.single("image"), createPost);
router.delete("/:id", authMiddleware, deletePost);
router.post("/:id/like", authMiddleware, togglePostLike);
router.post("/:id/comments", authMiddleware, addPostComment);

router.delete(
  "/:id/comments/:commentId",
  authMiddleware,
  deletePostComment
);

export default router;
