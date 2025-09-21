// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/project.js";
import projectUpdateRoutes from "./routes/projectUpdate.js";
import taskRoutes from "./routes/task.js";
import notificationRoutes from "./routes/notification.js";

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", projectUpdateRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // Use environment variable for CORS
  },
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  // Join user-specific room for notifications
  socket.on("joinUser", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });

  // Join project room
  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
    console.log(`User joined project ${projectId}`);
  });

  // Leave project room
  socket.on("leaveProject", (projectId) => {
    socket.leave(projectId);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available in routes
app.set("io", io);

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


