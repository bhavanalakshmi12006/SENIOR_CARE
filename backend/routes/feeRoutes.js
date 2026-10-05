import { Router } from "express";
import { getFees, orderService, createFee, recordPayment, getPayments } from "../controllers/feeController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getFees);
router.post("/order-service", orderService);
router.post("/", requireRole("admin", "staff"), createFee);
router.post("/:id/pay", requireRole("admin", "staff", "family_member"), recordPayment);
router.get("/payments", getPayments);

export default router;
