import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;


    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required",
      });
    }



    if (username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({
        message: "Username must be 3 to 30 characters long",
      });
    }



    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }



    const existingUser = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { username: username.trim() },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

  
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        githubUrl: user.githubUrl,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// LOGIN CONTROLLER
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

  
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }


    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }


    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        githubUrl: user.githubUrl,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// get profile



export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password")
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// update profile

// export const updateProfile = async (req, res) => {
//   try {
//     const { bio, skills, profilePicture, githubUrl } = req.body;

//     const user = await User.findById(req.userId);

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     if (bio !== undefined) user.bio = bio;
//     if (skills !== undefined) user.skills = skills;
//     if (profilePicture !== undefined) {
//       user.profilePicture = profilePicture;
//     }
//     if (githubUrl !== undefined) user.githubUrl = githubUrl;

//     await user.save();

//     res.status(200).json({
//       message: "Profile updated successfully",
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         bio: user.bio,
//         skills: user.skills,
//         profilePicture: user.profilePicture,
//         githubUrl: user.githubUrl,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };




export const updateProfile = async (req, res) => {
  try {
    const { bio, skills, githubUrl } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (bio !== undefined) user.bio = bio;

    if (skills !== undefined) {
      user.skills =
        typeof skills === "string" ? JSON.parse(skills) : skills;
    }

    if (req.file) {
      user.profilePicture = `/uploads/projects/${req.file.filename}`;
    }

    if (githubUrl !== undefined) {
      user.githubUrl = githubUrl;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        githubUrl: user.githubUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// follow and unfollow profile

export const toggleFollow = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );

      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId
      );
   
} else {
  currentUser.following.push(targetUser._id);
  targetUser.followers.push(currentUser._id);

  targetUser.notifications.push({
    type: "follow",
    message: `${currentUser.username} started following you`,
    from: currentUser._id,
  });
}


    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: isFollowing
        ? "User unfollowed successfully"
        : "User followed successfully",
      following: currentUser.following,
      followers: targetUser.followers,
    });
//   } catch (error) {
//     res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

} catch (error) {
  console.error("Toggle Follow Error:", error);

  res.status(500).json({
    message: "Server error",
    error: error.message,
  });
};
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("username bio skills profilePicture githubUrl followers following");

    res.status(200).json({
      message: "Developers fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("notifications")
      .populate("notifications.from", "username profilePicture");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications: user.notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const notification = user.notifications.id(notificationId);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await user.save();

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};





export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("notifications");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const unreadCount = user.notifications.filter(
      (notification) => !notification.isRead
    ).length;

    res.status(200).json({
      message: "Unread notifications count fetched successfully",
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};




export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("followers")
      .populate("followers", "username profilePicture bio");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Followers fetched successfully",
      followers: user.followers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("following")
      .populate("following", "username profilePicture bio");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Following fetched successfully",
      following: user.following,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
