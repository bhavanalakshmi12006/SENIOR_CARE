import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";

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
