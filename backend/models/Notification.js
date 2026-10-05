import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true },
  recipientRole: { type: String, default: "" },
  senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", default: null },
  type: { 
    type: String, 
    enum: ["emergency", "checkin", "appointment", "assistance", "fee", "medication", "health", "system"], 
    default: "system" 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ["normal", "high", "critical"], default: "normal" },
  link: { type: String, default: "" },
  readAt: { type: Date, default: null }
}, { timestamps: true });

notificationSchema.index({ recipientUserId: 1, recipientRole: 1, readAt: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
