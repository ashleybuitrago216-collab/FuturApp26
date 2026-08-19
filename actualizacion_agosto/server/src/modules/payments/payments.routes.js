import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import { confirmTechnicianPayment, getPaymentById, getPaymentsStatus, getPaymentsSummary, initiatePayment } from "./payments.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", getPaymentsStatus);
router.get("/summary", getPaymentsSummary);
router.get("/:id", getPaymentById);
router.post("/:id/initiate", initiatePayment);
router.post("/:id/confirm-technician", confirmTechnicianPayment);

export default router;
