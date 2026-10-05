import { Router } from "express";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Get all users (Admin only)
router.get("/", requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// Update user status or role (Admin only)
router.patch("/:id", requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (role) user.role = role;
    if (status) user.status = status;
    await user.save();

    await AuditLog.create({
      action: "USER_MODIFIED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "User",
      targetId: id,
      details: `Admin changed user status/role to ${role || user.role} / ${status || user.status}`
    });

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
});

// Remove/delete caregiver, volunteer, or user (Admin only)
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const name = user.displayName;
    const role = user.role;
    await User.findByIdAndDelete(id);

    await AuditLog.create({
      action: "USER_DELETED_BY_ADMIN",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "User",
      targetId: id,
      details: `Admin removed ${role} '${name}' following review/complaints`
    });

    res.json({ message: `${role} '${name}' removed successfully.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove user", error: err.message });
  }
});

// Get Audit Logs (Admin only)
router.get("/audit/logs", requireRole("admin"), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
});

export default router;
