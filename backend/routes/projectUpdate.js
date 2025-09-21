import express from "express";
import Project from "../models/Project.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Update Project (owner only)
router.put("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Check if user is the project owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only project owner can update the project" });
    }

    // Update project fields
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
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Check if user is the project owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only project owner can delete the project" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
