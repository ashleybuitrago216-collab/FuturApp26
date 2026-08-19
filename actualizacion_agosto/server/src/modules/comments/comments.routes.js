import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import { createReview, getCommentsStatus, respondReview } from "./comments.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", getCommentsStatus);
router.post("/", createReview);
router.patch("/:id/response", respondReview);

export default router;
