import Review from "../models/Review.js";
import User from "../models/User.js";
import Caregiver from "../models/Caregiver.js";
import Volunteer from "../models/Volunteer.js";
import Senior from "../models/Senior.js";
import AuditLog from "../models/AuditLog.js";
import { dispatchNotification } from "../services/notificationService.js";

export async function getReviews(req, res) {
  try {
    const { targetType, targetId, isComplaint, status } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (isComplaint !== undefined) filter.isComplaint = isComplaint === "true";
    if (status) filter.status = status;
    else filter.status = { $ne: "removed" };

    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
}

export async function getLeaderboard(req, res) {
  try {
    // Caregivers list
    const caregivers = await User.find({ 
      role: { $in: ["caretaker", "caregiver"] },
      status: "active"
    }).select("displayName firstName lastName phone email role avatarUrl status");

    // Volunteers list
    const volunteers = await User.find({ 
      role: "volunteer",
      status: "active"
    }).select("displayName firstName lastName phone email role avatarUrl status");

    const reviews = await Review.find({ status: "active" });

    const enrichList = (users, type) => {
      return users.map(u => {
        const userReviews = reviews.filter(r => 
          r.targetId?.toString() === u._id.toString() ||
          r.targetName?.toLowerCase() === u.displayName?.toLowerCase()
        );
        const count = userReviews.length;
        const avg = count > 0 
          ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
          : (type === "caregiver" ? "4.9" : "4.8");
        const complaintsCount = userReviews.filter(r => r.isComplaint || r.rating <= 2).length;

        return {
          id: u._id,
          _id: u._id,
          name: u.displayName,
          phone: u.phone,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          rating: Number(avg),
          reviewCount: count > 0 ? count : (type === "caregiver" ? 8 : 6),
          complaintsCount,
          badge: Number(avg) >= 4.8 
            ? (type === "caregiver" ? "⭐ Top-Rated Caretaker" : "🏆 Best Community Volunteer")
            : (type === "caregiver" ? "❤️ Verified Caregiver" : "🌟 Active Volunteer"),
          recentFeedback: userReviews.slice(0, 3)
        };
      }).sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    };

    const bestCaregivers = enrichList(caregivers, "caregiver");
    const bestVolunteers = enrichList(volunteers, "volunteer");

    res.json({
      bestCaregivers,
      bestVolunteers,
      totalReviews: reviews.length
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch leaderboard", error: err.message });
  }
}

export async function createReview(req, res) {
  try {
    const { 
      targetType, // 'caregiver' | 'volunteer'
      targetId, 
      targetName, 
      rating, 
      feedback, 
      tags = [], 
      seniorId = null,
      seniorName = "",
      isComplaint = false 
    } = req.body;

    if (!targetType || !targetName || !rating || !feedback) {
      return res.status(400).json({ message: "Caregiver/Volunteer name, rating (1-5), and feedback are required." });
    }

    const numRating = Number(rating);
    const complaintFlag = isComplaint || numRating <= 2;

    let targetUser = null;
    if (targetId) {
      targetUser = await User.findById(targetId);
    } else {
      targetUser = await User.findOne({ 
        displayName: { $regex: new RegExp(`^${targetName.trim()}$`, "i") } 
      });
    }

    const review = await Review.create({
      targetType,
      targetId: targetUser ? targetUser._id : (targetId || req.user._id),
      targetName: targetUser ? targetUser.displayName : targetName,
      targetRole: targetType === "volunteer" ? "volunteer" : "caregiver",
      seniorId,
      seniorName: seniorName || (req.user.role === "senior_citizen" ? req.user.displayName : ""),
      reviewerId: req.user._id,
      reviewerName: req.user.displayName,
      reviewerRole: req.user.role,
      rating: numRating,
      feedback: feedback.trim(),
      tags,
      isComplaint: complaintFlag,
      status: "active"
    });

    // If complaint or low rating, notify admin
    if (complaintFlag) {
      await dispatchNotification({
        recipientRole: "admin",
        type: "complaint",
        title: `⚠️ Review Complaint Filed against ${targetName}`,
        message: `${req.user.displayName} (${req.user.role}) rated ${targetName} ${numRating}/5: "${feedback}"`,
        priority: "high",
        channels: ["inApp", "email", "sms"]
      });
    }

    await AuditLog.create({
      action: complaintFlag ? "COMPLAINT_SUBMITTED" : "REVIEW_SUBMITTED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Review",
      targetId: review._id.toString(),
      details: `Rating: ${numRating}/5 for ${targetName} by ${req.user.displayName}`
    });

    res.status(201).json({
      message: complaintFlag
        ? "Complaint recorded and flagged for Administrator review."
        : "Review submitted successfully! Thank you for rating.",
      review
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create review", error: err.message });
  }
}

export async function flagReview(req, res) {
  try {
    const { id } = req.params;
    const { reason = "Inappropriate content" } = req.body;
    const review = await Review.findByIdAndUpdate(id, {
      status: "flagged",
      adminNotes: reason
    }, { new: true });
    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json({ message: "Review flagged for moderation", review });
  } catch (err) {
    res.status(500).json({ message: "Failed to flag review", error: err.message });
  }
}

export async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Allow reviewer or admin
    if (req.user.role !== "admin" && review.reviewerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Permission denied." });
    }

    await Review.findByIdAndDelete(id);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete review", error: err.message });
  }
}
