import express from "express";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Task
router.post("/", protect, async (req, res) => {
    try {
        const { projectId, title, description, assignee, status, priority, dueDate } = req.body;
        
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });
        if (!project.members.includes(req.user.id))
      return res.status(403).json({ message: "Not authorized" });

    const task = await Task.create({
      project: projectId,
      title,
      description,
      assignee,
      status,
      priority,
      dueDate,
    });

    // Create notifications for all project members
    const projectMembers = [project.owner, ...project.members];
    const notifications = [];
    
    for (const memberId of projectMembers) {
      if (memberId.toString() !== req.user.id) { // Don't notify the creator
        const notification = await Notification.create({
          recipient: memberId,
          sender: req.user.id,
          project: projectId,
          type: "task_assigned",
          title: "New Task Created",
          message: `A new task "${title}" has been created in project "${project.title}"`,
          actionRequired: false
        });
        notifications.push(notification);
      }
    }

    // Emit real-time update
    const io = req.app.get("io");
    io.to(projectId).emit("taskCreated", task);
    
    // Emit notifications to all project members
    for (const memberId of projectMembers) {
      if (memberId.toString() !== req.user.id) {
        io.to(memberId.toString()).emit('notification', {
          type: 'task_created',
          message: `New task "${title}" created in project "${project.title}"`
        });
      }
    }

    res.json(task);
} catch (err) {
    res.status(500).json({ message: err.message });
}
});

// Search Tasks
router.get("/search", protect, async (req, res) => {
  try {
    const { q, status, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    console.log('Search request:', { q, status, priority, sortBy, sortOrder, userId: req.user.id });
    
    // Build search query
    let query = {};
    
    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Priority filter
    if (priority) {
      query.priority = priority;
    }
    
    // Get user's projects first
    const userProjects = await Project.find({ members: req.user.id });
    const projectIds = userProjects.map(p => p._id);
    console.log('User projects:', projectIds);
    
    // Only search tasks from user's projects
    query.project = { $in: projectIds };
    
    console.log('Final query:', query);
    
    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const tasks = await Task.find(query)
      .populate("assignee", "name email")
      .populate("project", "title")
      .sort(sortObj);
    
    console.log('Found tasks:', tasks.length);
    res.json(tasks);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: err.message });
  }
});
  

// Get Tasks for a Project
router.get("/:projectId", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.includes(req.user.id))
      return res.status(403).json({ message: "Not authorized" });

    const tasks = await Task.find({ project: req.params.projectId }).populate("assignee", "name email");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Task
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) return res.status(404).json({ message: "Not found" });

    // Check if user is project member
    if (!task.project.members.includes(req.user.id))
      return res.status(403).json({ message: "Not authorized" });

    // Check if user can update task (assignee or project owner)
    const canUpdate = (
      task.assignee?.toString() === req.user.id || 
      task.project.owner?.toString() === req.user.id
    );
    
    if (!canUpdate) {
      return res.status(403).json({ 
        message: "Only the assignee or project owner can update this task" 
      });
    }

    const oldTask = { ...task.toObject() };
    Object.assign(task, req.body);
    await task.save();
    
    // Create notifications for all project members about task update
    const projectMembers = [task.project.owner, ...task.project.members];
    
    for (const memberId of projectMembers) {
      if (memberId.toString() !== req.user.id) { // Don't notify the updater
        await Notification.create({
          recipient: memberId,
          sender: req.user.id,
          project: task.project._id,
          type: "status_update",
          title: "Task Updated",
          message: `Task "${task.title}" has been updated in project "${task.project.title}"`,
          actionRequired: false
        });
      }
    }
    
    // Emit real-time update
    const io = req.app.get("io");
    io.to(task.project._id.toString()).emit("taskUpdated", task);
    
    // Emit notifications to all project members
    for (const memberId of projectMembers) {
      if (memberId.toString() !== req.user.id) {
        io.to(memberId.toString()).emit('notification', {
          type: 'task_updated',
          message: `Task "${task.title}" updated in project "${task.project.title}"`
        });
      }
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Task
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) return res.status(404).json({ message: "Not found" });

    // Check if user is project member
    if (!task.project.members.includes(req.user.id))
      return res.status(403).json({ message: "Not authorized" });

    // Check if user can delete task (assignee or project owner)
    const canDelete = (
      task.assignee?.toString() === req.user.id || 
      task.project.owner?.toString() === req.user.id
    );
    
    if (!canDelete) {
      return res.status(403).json({ 
        message: "Only the assignee or project owner can delete this task" 
      });
    }

    const projectId = task.project._id.toString();
    const projectTitle = task.project.title;
    const taskTitle = task.title;
    
    // Create notifications for all project members about task deletion
    const projectMembers = [task.project.owner, ...task.project.members];
    
    for (const memberId of projectMembers) {
      if (memberId.toString() !== req.user.id) { // Don't notify the deleter
        await Notification.create({
          recipient: memberId,
          sender: req.user.id,
          project: task.project._id,
          type: "status_update",
          title: "Task Deleted",
          message: `Task "${taskTitle}" has been deleted from project "${projectTitle}"`,
          actionRequired: false
        });
      }
    }
    
    await task.deleteOne();
    
    // Emit real-time update
    const io = req.app.get("io");
    io.to(projectId).emit("taskDeleted", { taskId: req.params.id });
    
    // Emit notifications to all project members
    for (const memberId of projectMembers) {
      if (memberId.toString() !== req.user.id) {
        io.to(memberId.toString()).emit('notification', {
          type: 'task_deleted',
          message: `Task "${taskTitle}" deleted from project "${projectTitle}"`
        });
      }
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Comment
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) return res.status(404).json({ message: "Not found" });

    if (!task.project.members.includes(req.user.id))
      return res.status(403).json({ message: "Not authorized" });

    task.comments.push({ user: req.user.id, text: req.body.text });
    await task.save();
    
    // Emit real-time update
    const io = req.app.get("io");
    io.to(task.project._id.toString()).emit("commentAdded", task);

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
