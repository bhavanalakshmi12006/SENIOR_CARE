import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  performedByName: { type: String, default: "System" },
  performedByRole: { type: String, default: "" },
  targetEntity: { type: String, required: true },
  targetId: { type: String, default: "" },
  details: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

auditLogSchema.index({ timestamp: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
