import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);


dotenv.config();
connectDB();


const app = express();
const PORT = process.env.PORT || 5000;


app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/projects", projectRoutes);
app.use("/api/posts", postRoutes);


app.get("/", (req,res)=>{
    res.json("DevConnect API is running");
})

app.listen(PORT, ()=>{
    console.log(`server is running on PORT ${PORT}`);
})