import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  titleTa: { 
    type: String, 
    default: "" 
  },
  description: { 
    type: String, 
    default: "" 
  },
  category: { 
    type: String, 
    enum: [
      "exercise", "wellness", "health", "family", "entertainment",
      "yoga", "meditation", "physiotherapy", "recreation"
    ], 
    set: (v) => v ? v.toLowerCase() : "wellness",
    default: "wellness" 
  },
  videoUrl: { 
    type: String, 
    required: true 
  },
  thumbnail: { 
    type: String, 
    default: "" 
  },
  duration: { 
    type: String, 
    default: "10 mins" 
  },
  instructor: { 
    type: String, 
    default: "SeniorCare Staff" 
  },
  addedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  status: { 
    type: String, 
    enum: ["active", "archived"], 
    default: "active" 
  }
}, { timestamps: true });

export default mongoose.models.Video || mongoose.model("Video", videoSchema);
