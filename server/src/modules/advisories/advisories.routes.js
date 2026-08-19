import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import { assignAdvisory, createAdvisory, getAdvisoryById, getAdvisoryCatalogs, getAdvisoryComments, getAdvisoryMessages, listAdvisories, resolveAdvisory, sendAdvisoryMessage } from "./advisories.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", listAdvisories);
router.post("/", createAdvisory);
router.get("/catalogs", getAdvisoryCatalogs);
router.patch("/:id/assign", assignAdvisory);
router.patch("/:id/resolve", resolveAdvisory);
router.get("/:id/messages", getAdvisoryMessages);
router.post("/:id/messages", sendAdvisoryMessage);
router.get("/:id/comments", getAdvisoryComments);
router.get("/:id", getAdvisoryById);

export default router;
