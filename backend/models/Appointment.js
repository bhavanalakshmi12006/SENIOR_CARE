import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  appointmentCode: { type: String, required: true, unique: true },
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", required: true },
  seniorName: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, default: "General Medicine" },
  hospital: { type: String, default: "City Senior Care Hospital" },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, default: "10:00 AM" },
  status: { 
    type: String, 
    enum: ["Upcoming", "Completed", "Cancelled", "Missed"], 
    default: "Upcoming" 
  },
  notes: { type: String, default: "" },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
