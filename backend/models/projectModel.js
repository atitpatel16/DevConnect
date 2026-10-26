
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      maxlength: 3000,
    },
    projectImage: {
      type: String,
      default: "",
    },
    liveUrl: {
      type: String,
      default: "",
      trim: true,
    },
    githubUrl: {
      type: String,
      default: "",
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: {
      type: [commentSchema],
      default: [],
    },

  contactNo: {
  type: String,
  default: "",
  trim: true,
  maxlength: 20,
},

contactEmail: {
  type: String,
  default: "",
  trim: true,
  lowercase: true,
  maxlength: 254,
},
  },
  
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
