import mongoose from "mongoose";

const recentlyAccessedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemType: { 
    type: String, 
    enum: ["senior", "emergency", "appointment", "fee", "assistance"], 
    required: true 
  },
  itemId: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  accessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

recentlyAccessedSchema.index({ userId: 1, accessedAt: -1 });

export default mongoose.models.RecentlyAccessed || mongoose.model("RecentlyAccessed", recentlyAccessedSchema);
