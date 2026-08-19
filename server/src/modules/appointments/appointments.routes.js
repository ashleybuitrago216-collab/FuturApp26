import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import { getAppointmentsStatus, scheduleAppointment, updateAppointmentStatus } from "./appointments.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", getAppointmentsStatus);
router.patch("/:id/schedule", scheduleAppointment);
router.patch("/:id/status", updateAppointmentStatus);

export default router;
