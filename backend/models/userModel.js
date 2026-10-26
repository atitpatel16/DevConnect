import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },

    skills: {
      type: [String],
      default: [],
    },

    profilePicture: {
      type: String,
      default: "",
    },

    githubUrl: {
      type: String,
      default: "",
    },

    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    // ✅ Notifications is now inside the main schema object
    notifications: [
      {
        type: {
          type: String,
          default: "follow",
        },
        message: {
          type: String,
          required: true,
        },
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;