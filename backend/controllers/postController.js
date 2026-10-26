
import mongoose from "mongoose";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import fs from "fs/promises";
import path from "path";

// Reusable function: author and comment users ki details fetch karna
const populatePost = (query) =>
  query
    .populate("author", "username profilePicture")
    .populate("likes", "username profilePicture")
    .populate("comments.user", "username profilePicture");

// Optional uploaded image delete karna
const removePostImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith("/uploads/projects/")) return;

  try {
    await fs.unlink(
      path.resolve("uploads/projects", path.basename(imageUrl))
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Post image deletion error:", error.message);
    }
  }
};

// CREATE POST
export const createPost = async (req, res) => {
  let image = "";

  try {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        message: "Post text is required",
      });
    }

    if (text.trim().length > 2000) {
      return res.status(400).json({
        message: "Post cannot exceed 2000 characters",
      });
    }

    if (req.file) {
      image = `/uploads/projects/${req.file.filename}`;
    }

    const post = await Post.create({
      text: text.trim(),
      image,
      author: req.userId,
    });

    const populatedPost = await populatePost(
      Post.findById(post._id)
    );

    return res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    if (image) await removePostImage(image);

    console.error("Create post error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// GET ALL POSTS
// export const getPosts = async (req, res) => {
//   try {
//     const page = Math.max(
//       1,
//       Number.parseInt(req.query.page, 10) || 1
//     );

//     const limit = Math.min(
//       50,
//       Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
//     );

//     const [posts, total] = await Promise.all([
//       populatePost(
//         Post.find()
//           .sort({ createdAt: -1 })
//           .skip((page - 1) * limit)
//           .limit(limit)
//       ),
//       Post.countDocuments(),
//     ]);

//     return res.status(200).json({
//       message: "Posts fetched successfully",
//       posts,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get posts error:", error);

//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };



 // GET ALL POSTS OR POSTS BY A SPECIFIC AUTHOR
export const getPosts = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    // Agar author ID di hai, toh sirf usi user ki posts fetch hongi
    const filter = {};

    if (req.query.author) {
      if (!mongoose.Types.ObjectId.isValid(req.query.author)) {
        return res.status(400).json({
          message: "Invalid author ID",
        });
      }

      filter.author = req.query.author;
    }

    const [posts, total] = await Promise.all([
      populatePost(
        Post.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
      ),
      Post.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};




// DELETE OWN POST
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can delete only your own posts",
      });
    }

    await post.deleteOne();
    await removePostImage(post.image);

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// LIKE / UNLIKE POST
export const togglePostLike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (userId) => userId.toString() === req.userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.userId
      );
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    return res.status(200).json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Toggle post like error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// ADD COMMENT
export const addPostComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
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

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.userId,
      text: text.trim(),
    });

    await post.save();

    const updatedPost = await populatePost(
      Post.findById(post._id)
    );

    const comment =
      updatedPost.comments[updatedPost.comments.length - 1];

    return res.status(201).json({
      message: "Comment added successfully",
      comment,
      commentsCount: updatedPost.comments.length,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE OWN COMMENT
export const deletePostComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return res.status(400).json({
        message: "Invalid post ID or comment ID",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can delete only your own comments",
      });
    }

    comment.deleteOne();
    await post.save();

    return res.status(200).json({
      message: "Comment deleted successfully",
      commentsCount: post.comments.length,
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};
