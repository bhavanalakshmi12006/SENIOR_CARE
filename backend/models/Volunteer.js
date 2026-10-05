import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
  skills: [{ type: String }],
  availability: { type: String, default: "Weekdays & Weekends" },
  tasksCompleted: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "busy", "inactive"], default: "active" }
}, { timestamps: true });

export default mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);
