import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  paymentCode: { type: String, required: true, unique: true },
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: "Fee", required: true },
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", required: true },
  seniorName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ["Cash", "UPI", "Credit/Debit Card", "Net Banking", "Cheque"], 
    default: "UPI" 
  },
  transactionRef: { type: String, default: "" },
  paidAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recordedByName: { type: String, default: "" },
  notes: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
