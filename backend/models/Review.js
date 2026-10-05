import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  targetType: { 
    type: String, 
    enum: ["caregiver", "volunteer"], 
    required: true 
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  targetName: { 
    type: String, 
    required: true 
  },
  targetRole: { 
    type: String, 
    enum: ["caretaker", "caregiver", "volunteer"],
    default: "caregiver" 
  },
  seniorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Senior" 
  },
  seniorName: { 
    type: String, 
    default: "" 
  },
  reviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  reviewerName: { 
    type: String, 
    required: true 
  },
  reviewerRole: { 
    type: String, 
    enum: ["senior_citizen", "family_member", "admin", "staff"],
    required: true 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  feedback: { 
    type: String, 
    required: true 
  },
  tags: [{ 
    type: String 
  }],
  isComplaint: { 
    type: Boolean, 
    default: false 
  },
  status: { 
    type: String, 
    enum: ["active", "flagged", "resolved", "removed"], 
    default: "active" 
  },
  adminNotes: { 
    type: String, 
    default: "" 
  }
}, { timestamps: true });

export default mongoose.models.Review || mongoose.model("Review", reviewSchema);
