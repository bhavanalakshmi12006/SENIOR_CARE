import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, default: "recorded" },
  priority: { type: String, enum: ["normal", "high", "critical"], default: "normal" },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

actionSchema.index({ userId: 1, createdAt: -1 });
actionSchema.index({ type: 1, createdAt: -1 });
export default mongoose.model("Action", actionSchema);
