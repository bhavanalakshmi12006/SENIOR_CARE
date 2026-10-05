import { Router } from "express";
import { getReportData, exportReportExcel, importExcel } from "../controllers/reportController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/export/excel", exportReportExcel);
router.post("/import/excel", requireRole("admin", "staff"), importExcel);
router.get("/:type", getReportData);

export default router;
