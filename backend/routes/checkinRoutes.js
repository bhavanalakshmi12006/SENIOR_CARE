import { Router } from "express";
import { getCheckins, recordCheckin, getTodaySummary } from "../controllers/checkinController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getCheckins);
router.post("/", recordCheckin);
router.get("/today-summary", getTodaySummary);

export default router;
