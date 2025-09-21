import express from "express";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * PROJECT ROUTES
 * Handles CRUD operations for projects
 * Features: Create, read, update, delete, invite members
 */

// Create Project
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    const project = await Project.create({
      title,
      description,
      deadline,
      owner: req.user.id,
      members: [req.user.id]
    });
    
    // Populate the owner field before sending response
    await project.populate("owner", "name email");
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get My Projects
router.get("/", protect, async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user.id
    }).populate("owner", "name email");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


  
// Update Project (owner only)
router.put("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    Object.assign(project, req.body);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Project (owner only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await project.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard Data (must come before /:id route)
router.get("/dashboard", protect, async (req, res) => {
  try {
    // Get user's projects (consistent with main projects endpoint)
    const projects = await Project.find({
      members: req.user.id
    }).populate("owner", "name email");

    // Get all tasks from user's projects
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({
      project: { $in: projectIds }
    }).populate("project", "title");

    // Count tasks by status
    const statusCounts = {
      ToDo: tasks.filter(t => t.status === "ToDo").length,
      InProgress: tasks.filter(t => t.status === "InProgress").length,
      Done: tasks.filter(t => t.status === "Done").length,
    };

    res.json({
      projects,
      tasks,
      statusCounts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Single Project
router.get("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email")
      .populate("members", "name email");
    
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Check if user is owner or member
    const isOwner = project.owner._id.toString() === req.user.id;
    const isMember = project.members.some(member => member._id.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Not authorized to view this project" });
    }
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Invite Member
router.post("/invite", protect, async (req, res) => {
  try {
    const { projectId, email } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only project owner can invite members" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user is already a member
    if (project.members.includes(user._id)) {
      return res.status(400).json({ message: "User is already a member of this project" });
    }

    // Create notification
    const notification = await Notification.create({
      recipient: user._id,
      sender: req.user.id,
      project: project._id,
      type: "invitation",
      title: "Project Invitation",
      message: `You have been invited to join the project "${project.title}" by ${req.user.name}`,
      actionRequired: true,
      invitationStatus: "pending"
    });

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('notification', {
        type: 'invitation',
        notification: notification,
        message: `You have been invited to join the project "${project.title}"`
      });
    }

    res.json({ 
      message: "Invitation sent successfully", 
      notification: notification 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept/Decline Invitation
router.post("/invitation/:notificationId", protect, async (req, res) => {
  try {
    const { action } = req.body; // "accept" or "decline"
    const notification = await Notification.findById(req.params.notificationId)
      .populate("project")
      .populate("sender", "name");
    
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    if (notification.type !== "invitation") {
      return res.status(400).json({ message: "Not an invitation notification" });
    }
    
    if (action === "accept") {
      // Add user to project members
      const project = await Project.findById(notification.project._id);
      if (!project.members.includes(req.user.id)) {
        project.members.push(req.user.id);
      await project.save();
    }

      notification.invitationStatus = "accepted";
      notification.isRead = true;
      await notification.save();
      
      res.json({ message: "Invitation accepted successfully" });
    } else if (action === "decline") {
      notification.invitationStatus = "declined";
      notification.isRead = true;
      await notification.save();
      
      res.json({ message: "Invitation declined" });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
