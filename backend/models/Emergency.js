import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema({
  emergencyCode: { type: String, required: true, unique: true },
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", required: true },
  seniorName: { type: String, required: true },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  triggeredRole: { type: String, default: "senior_citizen" },
  status: { 
    type: String, 
    enum: ["active", "acknowledged", "escalated", "resolved"], 
    default: "active" 
  },
  severity: { 
    type: String, 
    enum: ["critical", "high", "moderate"], 
    default: "critical" 
  },
  location: { type: String, default: "Home" },
  notes: { type: String, default: "Emergency assistance triggered by senior" },
  acknowledgedBy: { type: String, default: "" },
  acknowledgedAt: Date,
  resolvedBy: { type: String, default: "" },
  resolvedAt: Date,
  actionsTaken: [{ note: String, actionTime: Date, by: String }]
}, { timestamps: true });

export default mongoose.models.Emergency || mongoose.model("Emergency", emergencySchema);
