import Video from "../models/Video.js";
import AuditLog from "../models/AuditLog.js";

const DEFAULT_VIDEOS = [
  {
    title: "Gentle Morning Chair Yoga for Seniors",
    titleTa: "மூத்தவர்களுக்கான காலை நாற்காலி யோகா",
    description: "Low-impact stretches and breathing exercises designed for joint flexibility and gentle mobility.",
    category: "exercise",
    videoUrl: "https://www.youtube.com/watch?v=kFhG-ZzLNN4",
    thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500",
    duration: "15 mins",
    instructor: "Dr. Lakshmi Yoga Master",
    status: "active"
  },
  {
    title: "Guided Deep Breathing & Mind Relaxation",
    titleTa: "மன அமைதிக்கான பிராணாயாம மூச்சுப் பயிற்சி",
    description: "Guided relaxation technique to reduce anxiety, lower blood pressure, and improve lung capacity.",
    category: "wellness",
    videoUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
    thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500",
    duration: "10 mins",
    instructor: "Guruji Ramanathan (Wellness Coach)",
    status: "active"
  },
  {
    title: "Active Balance & Fall Prevention Exercises",
    titleTa: "சமநிலை மற்றும் தவறி விழுதல் தடுப்பு பயிற்சி",
    description: "Simple indoor routine to strengthen ankle stability, core muscles, and posture.",
    category: "exercise",
    videoUrl: "https://www.youtube.com/watch?v=gC_L9qAHVJ8",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
    duration: "18 mins",
    instructor: "Dr. Anand (Senior Physiotherapist)",
    status: "active"
  },
  {
    title: "Laughter Therapy & Emotional Upliftment",
    titleTa: "முதியோர்களுக்கான சிரிப்பு யோகா & மன உற்சாகம்",
    description: "Hearty joyful laughter sessions that stimulate blood circulation and bring cheerful smiles.",
    category: "wellness",
    videoUrl: "https://www.youtube.com/watch?v=4pLUleLdwY4",
    thumbnail: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500",
    duration: "12 mins",
    instructor: "Sister Malathi (Geriatric Counsellor)",
    status: "active"
  }
];

export async function getVideos(req, res) {
  try {
    let videos = await Video.find({ status: "active" }).sort({ createdAt: -1 });
    // Seed defaults if empty
    if (videos.length === 0) {
      await Video.insertMany(DEFAULT_VIDEOS);
      videos = await Video.find({ status: "active" }).sort({ createdAt: -1 });
    }
    res.json({ videos });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videos", error: err.message });
  }
}

export async function addVideo(req, res) {
  try {
    if (req.user.role !== "admin" && req.user.role !== "staff") {
      return res.status(403).json({ message: "Only Administrators can add community videos." });
    }
    const { title, titleTa, description, category = "exercise", videoUrl, duration, instructor, thumbnail } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ message: "Video title and URL are required." });
    }

    const video = await Video.create({
      title,
      titleTa: titleTa || "",
      description: description || "",
      category,
      videoUrl,
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
      duration: duration || "10 mins",
      instructor: instructor || req.user.displayName,
      addedBy: req.user._id,
      status: "active"
    });

    await AuditLog.create({
      action: "VIDEO_ADDED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Video",
      targetId: video._id.toString(),
      details: `Admin added video: ${video.title}`
    });

    res.status(201).json({ message: "Video published successfully", video });
  } catch (err) {
    res.status(500).json({ message: "Failed to add video", error: err.message });
  }
}

export async function deleteVideo(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only Administrators can remove videos." });
    }
    const { id } = req.params;
    const video = await Video.findByIdAndDelete(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    await AuditLog.create({
      action: "VIDEO_REMOVED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Video",
      targetId: id,
      details: `Admin removed video: ${video.title}`
    });

    res.json({ message: `Video '${video.title}' removed successfully.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove video", error: err.message });
  }
}
