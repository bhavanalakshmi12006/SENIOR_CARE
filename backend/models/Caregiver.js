import mongoose from "mongoose";

const caregiverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
  specialization: { type: String, default: "General Elder Care" },
  assignedSeniorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Senior" }],
  shift: { type: String, enum: ["Morning", "Evening", "Night", "24/7"], default: "Morning" },
  rating: { type: Number, default: 4.8 },
  status: { type: String, enum: ["active", "on_leave", "inactive"], default: "active" }
}, { timestamps: true });

export default mongoose.models.Caregiver || mongoose.model("Caregiver", caregiverSchema);
