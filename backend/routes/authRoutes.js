import express from "express";
import {login, 
    signup, 
    getProfile, 
    updateProfile, 
    toggleFollow, 
    getAllUsers, 
    getNotifications,  
    markNotificationAsRead,
    getUnreadNotificationsCount
     } from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

import {
  getFollowers,
  getFollowing,
} from "../controllers/userController.js";


const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.get("/profile", authMiddleware, getProfile);

// router.put("/profile", authMiddleware, updateProfile);
router.put(
  "/profile",
  authMiddleware,
  upload.single("profilePicture"),
  updateProfile
);

router.post("/follow/:userId", authMiddleware, toggleFollow);

router.get("/users", authMiddleware, getAllUsers);

router.get("/notifications", authMiddleware, getNotifications);

router.patch(
  "/notifications/:notificationId/read",
  authMiddleware,
  markNotificationAsRead
);

router.get(
  "/notifications/unread-count",
  authMiddleware,
  getUnreadNotificationsCount
);

router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;