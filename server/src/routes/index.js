import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import servicesRoutes from "../modules/services/services.routes.js";
import appointmentsRoutes from "../modules/appointments/appointments.routes.js";
import paymentsRoutes from "../modules/payments/payments.routes.js";
import notificationsRoutes from "../modules/notifications/notifications.routes.js";
import commentsRoutes from "../modules/comments/comments.routes.js";
import locationsRoutes from "../modules/locations/locations.routes.js";
import advisoriesRoutes from "../modules/advisories/advisories.routes.js";
import quotesRoutes from "../modules/quotes/quotes.routes.js";
import helpRoutes from "../modules/help/help.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/services", servicesRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/comments", commentsRoutes);
router.use("/locations", locationsRoutes);
router.use("/advisories", advisoriesRoutes);
router.use("/quotes", quotesRoutes);
router.use("/help", helpRoutes);

export default router;
