import mongoose from "mongoose";

const seniorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  emergencyContactName: { type: String, default: "" },
  emergencyContactPhone: { type: String, default: "" },
  emergencyContactRelation: { type: String, default: "" },
  bloodGroup: { type: String, default: "O+" },
  medicalNotes: { type: String, default: "None" },
  roomNumber: { type: String, default: "" },
  assignedCaregiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedCaregiverName: { type: String, default: "" },
  familyMemberUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  safetyStatus: { type: String, enum: ["safe", "attention_needed", "emergency"], default: "safe" },
  lastCheckinAt: { type: Date, default: Date.now },
  checkinStreak: { type: Number, default: 1 },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

export default mongoose.models.Senior || mongoose.model("Senior", seniorSchema);
