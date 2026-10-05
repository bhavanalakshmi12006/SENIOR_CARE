import mongoose from "mongoose";

const assistanceRequestSchema = new mongoose.Schema({
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", required: true },
  seniorName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["Food Assistance", "Medicine Pickup", "Shopping", "Travel Assistance", "Home Assistance", "Other"], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  priority: { type: String, enum: ["Normal", "High", "Urgent"], default: "Normal" },
  status: { 
    type: String, 
    enum: ["Requested", "Assigned", "Accepted", "In Progress", "Completed"], 
    default: "Requested" 
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedToName: { type: String, default: "" },
  assignedRole: { type: String, default: "" },
  completedAt: Date,
  notes: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.models.AssistanceRequest || mongoose.model("AssistanceRequest", assistanceRequestSchema);
