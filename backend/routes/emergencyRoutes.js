import { Router } from "express";
import { getEmergencies, triggerEmergency, updateEmergencyStatus } from "../controllers/emergencyController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getEmergencies);
router.post("/", triggerEmergency);
router.patch("/:id/status", updateEmergencyStatus);

export default router;
