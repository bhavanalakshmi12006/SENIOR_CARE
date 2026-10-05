import Emergency from "../models/Emergency.js";
import Senior from "../models/Senior.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { dispatchNotification } from "../services/notificationService.js";

export async function getEmergencies(req, res) {
  try {
    const { status, severity } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    // If senior citizen, only their emergencies
    if (req.user.role === "senior_citizen") {
      const senior = await Senior.findOne({ userId: req.user._id });
      if (senior) filter.seniorId = senior._id;
    }

    const emergencies = await Emergency.find(filter).sort({ createdAt: -1 });
    res.json({ emergencies });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch emergencies", error: err.message });
  }
}

export async function triggerEmergency(req, res) {
  try {
    let { seniorId, location = "Home", notes = "Emergency assistance triggered by senior", severity = "critical" } = req.body;

    let senior;
    if (seniorId) {
      senior = await Senior.findById(seniorId);
    } else {
      // Find senior record for current user
      senior = await Senior.findOne({ userId: req.user._id });
      if (!senior) {
        // Fallback to first senior or create temporary
        senior = await Senior.findOne();
      }
    }

    if (!senior) {
      return res.status(404).json({ message: "No senior record found to associate with emergency." });
    }

    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const emergencyCode = `EMG-${codeNum}`;

    const emergency = await Emergency.create({
      emergencyCode,
      seniorId: senior._id,
      seniorName: senior.name,
      triggeredBy: req.user._id,
      triggeredRole: req.user.role,
      status: "active",
      severity,
      location: location || senior.address || "Home",
      notes,
      actionsTaken: [
        {
          note: `Emergency alert initiated by ${req.user.displayName} (${req.user.role})`,
          actionTime: new Date(),
          by: req.user.displayName
        }
      ]
    });

    // Update senior safety status
    senior.safetyStatus = "emergency";
    await senior.save();

    // Broadcast notifications to relevant roles via WhatsApp, SMS, Email, and In-App
    const chosenChannels = req.body.channels || ["whatsapp", "sms", "email", "inApp"];
    const rolesToNotify = ["caretaker", "staff", "admin", "family_member"];
    for (const r of rolesToNotify) {
      await dispatchNotification({
        recipientRole: r,
        seniorId: senior._id,
        type: "emergency",
        title: `🚨 Emergency Alert: ${senior.name}`,
        message: `EMG-${codeNum} active in ${emergency.location}. Immediate response required. ${notes}`,
        priority: "critical",
        link: "/emergency",
        channels: chosenChannels,
        recipientPhone: senior.emergencyContactPhone || senior.phone
      });
    }

    // Audit log
    await AuditLog.create({
      action: "EMERGENCY_TRIGGERED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Emergency",
      targetId: emergency.emergencyCode,
      details: `Alert ${emergency.emergencyCode} triggered for ${senior.name}`
    });

    // Socket.IO real-time emission
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency-alert", {
        emergency,
        message: `🚨 Emergency Alert for ${senior.name} (${emergency.emergencyCode})!`,
        timestamp: new Date()
      });
      io.emit("notification-created", { type: "emergency" });
    }

    res.status(201).json({
      message: "Emergency alert triggered successfully. Care team notified.",
      emergency
    });
  } catch (err) {
    console.error("Trigger emergency error:", err);
    res.status(500).json({ message: "Failed to trigger emergency", error: err.message });
  }
}

export async function updateEmergencyStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note = "" } = req.body; // acknowledged, escalated, resolved
    const emergency = await Emergency.findById(id);
    if (!emergency) return res.status(404).json({ message: "Emergency record not found" });

    emergency.status = status;
    const actionEntry = {
      note: note || `Status changed to ${status} by ${req.user.displayName}`,
      actionTime: new Date(),
      by: req.user.displayName
    };
    emergency.actionsTaken.push(actionEntry);

    if (status === "acknowledged") {
      emergency.acknowledgedBy = `${req.user.displayName} (${req.user.role})`;
      emergency.acknowledgedAt = new Date();
    } else if (status === "resolved") {
      emergency.resolvedBy = `${req.user.displayName} (${req.user.role})`;
      emergency.resolvedAt = new Date();

      // Reset senior safety status to safe
      await Senior.findByIdAndUpdate(emergency.seniorId, { safetyStatus: "safe" });
    }

    await emergency.save();

    await AuditLog.create({
      action: `EMERGENCY_${status.toUpperCase()}`,
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Emergency",
      targetId: emergency.emergencyCode,
      details: note || `Status updated to ${status}`
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("emergency-status-changed", { emergency });
      io.emit("notification-created", { type: "emergency-update" });
    }

    res.json({ message: `Emergency status updated to ${status}`, emergency });
  } catch (err) {
    res.status(500).json({ message: "Failed to update emergency", error: err.message });
  }
}
