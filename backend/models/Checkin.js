import mongoose from "mongoose";

const checkinSchema = new mongoose.Schema({
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", required: true },
  seniorName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["safe", "missed", "attention_needed"], default: "safe" },
  notes: { type: String, default: "Daily check-in completed" },
  mood: { type: String, enum: ["good", "okay", "tired", "unwell"], default: "good" },
  method: { type: String, enum: ["self", "caregiver", "system"], default: "self" },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Checkin || mongoose.model("Checkin", checkinSchema);
