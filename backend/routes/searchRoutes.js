import { Router } from "express";
import { globalSearch, getRecentlyAccessed, recordRecentlyAccessed } from "../controllers/searchController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", globalSearch);
router.get("/recently-accessed", getRecentlyAccessed);
router.post("/recently-accessed", recordRecentlyAccessed);

export default router;
