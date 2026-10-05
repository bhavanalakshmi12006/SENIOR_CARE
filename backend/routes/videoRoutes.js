import { Router } from "express";
import { getVideos, addVideo, deleteVideo } from "../controllers/videoController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", getVideos);
router.post("/", addVideo);
router.delete("/:id", deleteVideo);

export default router;
