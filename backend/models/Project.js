/**
 * PROJECT MODEL
 * Defines project schema with owner, members, and timestamps
 * Features: Owner relationship, member management, automatic timestamps
 */
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    deadline: { type: Date },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
