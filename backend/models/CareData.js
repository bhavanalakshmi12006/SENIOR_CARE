import mongoose from "mongoose";

const careDataSchema = new mongoose.Schema({
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  kind: { type: String, enum: ["medication", "health", "report", "contact"], required: true },
  title: { type: String, required: true },
  status: { type: String, default: "active" },
  scheduledAt: Date,
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

careDataSchema.index({ seniorId: 1, kind: 1, createdAt: -1 });
export default mongoose.model("CareData", careDataSchema);
