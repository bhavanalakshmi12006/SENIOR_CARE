import AssistanceRequest from "../models/AssistanceRequest.js";
import Senior from "../models/Senior.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

export async function getAssistanceRequests(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    if (req.user.role === "senior_citizen") {
      const senior = await Senior.findOne({ userId: req.user._id });
      if (senior) filter.seniorId = senior._id;
    } else if (req.user.role === "volunteer") {
      // Volunteers see assigned to them or unassigned "Requested"
      filter.$or = [
        { assignedTo: req.user._id },
        { status: "Requested" }
      ];
    }

    const requests = await AssistanceRequest.find(filter).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assistance requests", error: err.message });
  }
}

export async function createAssistanceRequest(req, res) {
  try {
    let { seniorId, category, title, description = "", priority = "Normal" } = req.body;

    let senior;
    if (seniorId) {
      senior = await Senior.findById(seniorId);
    } else {
      senior = await Senior.findOne({ userId: req.user._id }) || await Senior.findOne();
    }

    if (!senior) return res.status(404).json({ message: "Senior not found" });

    const request = await AssistanceRequest.create({
      seniorId: senior._id,
      seniorName: senior.name,
      category,
      title,
      description,
      priority,
      status: "Requested",
      requestedBy: req.user._id
    });

    // Notify volunteers & caregivers
    await Notification.create({
      recipientRole: "volunteer",
      seniorId: senior._id,
      type: "assistance",
      title: `🤝 New Assistance Request: ${category}`,
      message: `${senior.name} needs help with: ${title}`,
      priority: priority === "Urgent" ? "critical" : "high",
      link: "/assistance"
    });

    await AuditLog.create({
      action: "ASSISTANCE_REQUESTED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "AssistanceRequest",
      targetId: request._id.toString(),
      details: `Requested ${category} for ${senior.name}`
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("assistance-created", { request });
      io.emit("notification-created", { type: "assistance" });
    }

    res.status(201).json({ message: "Assistance request submitted successfully", request });
  } catch (err) {
    res.status(500).json({ message: "Failed to request assistance", error: err.message });
  }
}

export async function updateAssistanceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Assigned, Accepted, In Progress, Completed

    const request = await AssistanceRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Assistance request not found" });

    request.status = status;
    if (notes) request.notes = notes;

    if (status === "Accepted" || status === "In Progress") {
      if (!request.assignedTo) {
        request.assignedTo = req.user._id;
        request.assignedToName = `${req.user.displayName} (${req.user.role})`;
        request.assignedRole = req.user.role;
      }
    } else if (status === "Completed") {
      request.completedAt = new Date();
    }

    await request.save();

    await AuditLog.create({
      action: `ASSISTANCE_${status.toUpperCase().replace(/\s+/g, "_")}`,
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "AssistanceRequest",
      targetId: request._id.toString(),
      details: `Status updated to ${status} for ${request.title}`
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("assistance-status-changed", { request });
    }

    res.json({ message: `Assistance status updated to ${status}`, request });
  } catch (err) {
    res.status(500).json({ message: "Failed to update assistance status", error: err.message });
  }
}
