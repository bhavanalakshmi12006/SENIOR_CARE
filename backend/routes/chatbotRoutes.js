import { Router } from "express";
import { handleChatMessage } from "../controllers/chatbotController.js";
import { authenticateOptional } from "../middleware/auth.js";

const router = Router();

router.use(authenticateOptional);
router.post("/message", handleChatMessage);

export default router;
