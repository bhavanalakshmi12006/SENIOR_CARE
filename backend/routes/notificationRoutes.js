import { Router } from "express";
import { getNotifications, markRead, markAllRead, deleteNotification, getPreferences, updatePreferences } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.delete("/:id", deleteNotification);
router.get("/preferences", getPreferences);
router.patch("/preferences", updatePreferences);

export default router;
