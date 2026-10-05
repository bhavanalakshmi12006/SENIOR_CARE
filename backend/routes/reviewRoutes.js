import { Router } from "express";
import { 
  getReviews, 
  getLeaderboard, 
  createReview, 
  flagReview, 
  deleteReview 
} from "../controllers/reviewController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getReviews);
router.get("/leaderboard", getLeaderboard);
router.post("/", createReview);
router.patch("/:id/flag", flagReview);
router.delete("/:id", deleteReview);

export default router;
