import { Router } from "express";
import { 
  getSeniors, getSeniorById, createSenior, updateSenior, deleteSenior,
  getFamilyAssociatedSeniors, associateSeniorWithFamily 
} from "../controllers/seniorController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/family-elders", getFamilyAssociatedSeniors);
router.post("/:id/associate-family", associateSeniorWithFamily);
router.get("/", getSeniors);
router.get("/:id", getSeniorById);
router.post("/", requireRole("admin", "staff"), createSenior);
router.patch("/:id", requireRole("admin", "staff", "caregiver", "caretaker"), updateSenior);
router.delete("/:id", requireRole("admin"), deleteSenior);

export default router;
