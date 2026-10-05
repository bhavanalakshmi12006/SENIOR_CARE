import mongoose from "mongoose";

const moduleRecordSchema = new mongoose.Schema({
  kind: { type: String, enum: ["task", "appointment", "payment", "medicine_order", "checkin", "alert"], required: true },
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, default: "PENDING" },
  priority: { type: String, default: "MEDIUM" },
  amount: { type: Number, default: 0 },
  dueDate: Date,
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

moduleRecordSchema.index({ kind: 1, status: 1, createdAt: -1 });
moduleRecordSchema.index({ seniorId: 1, kind: 1 });
export default mongoose.model("ModuleRecord", moduleRecordSchema);
