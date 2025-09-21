/**
 * NOTIFICATION MODEL
 * Defines notification schema for real-time updates
 * Features: User targeting, invitation handling, read status
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },
    type: {
      type: String,
      enum: ["invitation", "task_assigned", "task_completed", "project_update"],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    actionRequired: {
      type: Boolean,
      default: false
    },
    // For invitation notifications
    invitationStatus: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
