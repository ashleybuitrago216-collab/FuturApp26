import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import { cancelService, completeService, createService, getServicesStatus, updateService } from "./services.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", getServicesStatus);
router.post("/", createService);
router.patch("/:id/complete", completeService);
router.patch("/:id", updateService);
router.patch("/:id/cancel", cancelService);

export default router;
