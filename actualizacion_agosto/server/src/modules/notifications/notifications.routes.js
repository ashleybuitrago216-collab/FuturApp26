import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notifications.controller.js";

const router = Router();

router.use(verifyToken);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/", createNotification);
router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);

export default router;
  