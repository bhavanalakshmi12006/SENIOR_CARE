import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import { dispatchNotification } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  try {
    const userRole = req.user.role;
    const filter = {
      $or: [
        { recipientUserId: req.user._id },
        { recipientRole: userRole },
        { recipientRole: userRole === "caregiver" ? "caretaker" : userRole === "caretaker" ? "caregiver" : null }
      ]
    };

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const unreadCount = notifications.filter(n => !n.readAt).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
}

export async function dispatchCustomNotification(req, res) {
  try {
    const { 
      title, 
      message, 
      channels = ["whatsapp", "sms", "email"], 
      recipientPhone, 
      recipientEmail, 
      seniorId, 
      type = "system",
      priority = "normal" 
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const notification = await dispatchNotification({
      recipientUserId: req.user._id,
      recipientRole: req.user.role,
      seniorId,
      type,
      title,
      message,
      priority,
      channels,
      recipientPhone: recipientPhone || req.user.phone,
      recipientEmail: recipientEmail || req.user.email
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("notification-created", { type, notification });
    }

    res.status(201).json({
      message: `Notification successfully dispatched via ${channels.join(", ")}`,
      notification
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to dispatch notification", error: err.message });
  }
}

export async function markRead(req, res) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { readAt: new Date() });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notification read", error: err.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const userRole = req.user.role;
    await Notification.updateMany(
      {
        $or: [
          { recipientUserId: req.user._id },
          { recipientRole: userRole }
        ],
        readAt: null
      },
      { readAt: new Date() }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all read", error: err.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification", error: err.message });
  }
}

export async function getPreferences(req, res) {
  try {
    let prefs = await NotificationPreference.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId: req.user._id });
    }
    res.json({ preferences: prefs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notification preferences", error: err.message });
  }
}

export async function updatePreferences(req, res) {
  try {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ message: "Notification preferences updated successfully", preferences: prefs });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification preferences", error: err.message });
  }
}

