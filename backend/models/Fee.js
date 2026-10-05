import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  feeCode: { type: String, required: true, unique: true },
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", required: true },
  seniorName: { type: String, required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["Monthly Care", "Medical Consultation", "Physiotherapy", "Special Care", "Meals", "Other"], 
    default: "Monthly Care" 
  },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["Pending", "Partially Paid", "Paid", "Overdue"], 
    default: "Pending" 
  },
  notes: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.models.Fee || mongoose.model("Fee", feeSchema);
