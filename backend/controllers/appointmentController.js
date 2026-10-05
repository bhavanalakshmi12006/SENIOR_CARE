import Appointment from "../models/Appointment.js";
import Senior from "../models/Senior.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

export async function getAppointments(req, res) {
  try {
    const { status, seniorId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (seniorId) filter.seniorId = seniorId;

    if (req.user.role === "senior_citizen") {
      const senior = await Senior.findOne({ userId: req.user._id });
      if (senior) filter.seniorId = senior._id;
    }

    const appointments = await Appointment.find(filter).sort({ appointmentDate: 1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments", error: err.message });
  }
}

export async function createAppointment(req, res) {
  try {
    let { seniorId, doctorName, department = "General Medicine", hospital = "City Care Hospital", appointmentDate, timeSlot = "10:00 AM", notes = "" } = req.body;

    let senior;
    if (seniorId) {
      senior = await Senior.findById(seniorId);
    } else {
      senior = await Senior.findOne({ userId: req.user._id }) || await Senior.findOne();
    }

    if (!senior) return res.status(404).json({ message: "Senior not found" });

    const codeNum = Math.floor(100 + Math.random() * 900);
    const appointmentCode = `APT-${codeNum}`;

    const appointment = await Appointment.create({
      appointmentCode,
      seniorId: senior._id,
      seniorName: senior.name,
      doctorName,
      department,
      hospital,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      notes,
      status: "Upcoming"
    });

    // Notify senior and family
    await Notification.create({
      recipientUserId: senior.userId || req.user._id,
      recipientRole: "senior_citizen",
      type: "appointment",
      title: `📅 Appointment Scheduled: ${doctorName}`,
      message: `Your appointment is on ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot} (${hospital}).`,
      priority: "high",
      link: "/appointments"
    });

    await AuditLog.create({
      action: "APPOINTMENT_CREATED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Appointment",
      targetId: appointmentCode,
      details: `Scheduled ${appointmentCode} for ${senior.name} with ${doctorName}`
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("appointment-created", { appointment });
      io.emit("notification-created", { type: "appointment" });
    }

    res.status(201).json({ message: "Appointment created successfully", appointment });
  } catch (err) {
    res.status(500).json({ message: "Failed to create appointment", error: err.message });
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(id, req.body, { new: true });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await AuditLog.create({
      action: "APPOINTMENT_UPDATED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Appointment",
      targetId: appointment.appointmentCode,
      details: `Updated appointment ${appointment.appointmentCode}`
    });

    res.json({ message: "Appointment updated successfully", appointment });
  } catch (err) {
    res.status(500).json({ message: "Failed to update appointment", error: err.message });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await AuditLog.create({
      action: "APPOINTMENT_CANCELLED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Appointment",
      targetId: appointment.appointmentCode,
      details: `Cancelled appointment ${appointment.appointmentCode}`
    });

    res.json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel appointment", error: err.message });
  }
}
