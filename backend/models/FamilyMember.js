import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
  relation: { type: String, default: "Son/Daughter" },
  linkedSeniorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Senior" }],
  emergencyContact: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.FamilyMember || mongoose.model("FamilyMember", familyMemberSchema);
