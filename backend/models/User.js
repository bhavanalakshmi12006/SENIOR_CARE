import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null, sparse: true },
  role: { 
    type: String, 
    enum: ["senior_citizen", "volunteer", "caretaker", "caregiver", "family_member", "admin", "staff"], 
    required: true 
  },
  firstName: { type: String, required: true },
  lastName: { type: String, default: "" },
  displayName: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  preferredLanguage: { type: String, enum: ["en", "ta"], default: "en" },
  themePreference: { type: String, enum: ["system", "light", "dark", "calm"], default: "light" },
  themeColor: { type: String, default: "#176b87" },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  lastLoginAt: Date
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
