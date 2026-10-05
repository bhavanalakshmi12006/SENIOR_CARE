import { Router } from "express";
import { getAssistanceRequests, createAssistanceRequest, updateAssistanceStatus } from "../controllers/assistanceController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getAssistanceRequests);
router.post("/", createAssistanceRequest);
router.patch("/:id/status", updateAssistanceStatus);

export default router;
