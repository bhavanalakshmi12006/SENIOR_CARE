import { Router } from "express";
import { getDashboardMetrics } from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/dashboard", getDashboardMetrics);

export default router;
