import Checkin from "../models/Checkin.js";
import Senior from "../models/Senior.js";
import AuditLog from "../models/AuditLog.js";

export async function getCheckins(req, res) {
  try {
    const { seniorId, status } = req.query;
    const filter = {};
    if (seniorId) filter.seniorId = seniorId;
    if (status) filter.status = status;

    if (req.user.role === "senior_citizen") {
      const senior = await Senior.findOne({ userId: req.user._id });
      if (senior) filter.seniorId = senior._id;
    }

    const checkins = await Checkin.find(filter).sort({ timestamp: -1 }).limit(50);
    res.json({ checkins });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch check-ins", error: err.message });
  }
}

export async function recordCheckin(req, res) {
  try {
    const { seniorId, notes = "Daily check-in completed. Feeling safe and healthy.", mood = "good", status = "safe" } = req.body;

    let senior;
    if (seniorId) {
      senior = await Senior.findById(seniorId);
    } else {
      senior = await Senior.findOne({ userId: req.user._id }) || await Senior.findOne();
    }

    if (!senior) {
      return res.status(404).json({ message: "Senior citizen record not found." });
    }

    const checkin = await Checkin.create({
      seniorId: senior._id,
      seniorName: senior.name,
      userId: req.user._id,
      status,
      notes,
      mood,
      method: req.user.role === "senior_citizen" ? "self" : "caregiver",
      timestamp: new Date()
    });

    // Update senior
    senior.safetyStatus = status;
    senior.lastCheckinAt = new Date();
    senior.checkinStreak = (senior.checkinStreak || 0) + 1;
    await senior.save();

    await AuditLog.create({
      action: "CHECKIN_RECORDED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Checkin",
      targetId: checkin._id.toString(),
      details: `Safety check-in recorded for ${senior.name}: ${status}`
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("checkin-updated", { checkin, senior });
    }

    res.status(201).json({
      message: "Safety check-in recorded successfully! Thank you for staying safe.",
      checkin,
      senior
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to record check-in", error: err.message });
  }
}

export async function getTodaySummary(req, res) {
  try {
    const totalSeniors = await Senior.countDocuments({ status: "active" });
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const checkedInToday = await Checkin.countDocuments({
      timestamp: { $gte: startOfToday }
    });

    const missedToday = Math.max(0, totalSeniors - checkedInToday);

    res.json({
      totalSeniors,
      checkedInToday,
      missedToday
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get check-in summary", error: err.message });
  }
}
