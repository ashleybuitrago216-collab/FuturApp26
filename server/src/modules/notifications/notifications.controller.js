import { notificationsService } from "./notifications.service.js";

export async function getNotifications(req, res, next) {
  try {
    res.json(await notificationsService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    res.json(await notificationsService.unreadCount(req.user));
  } catch (error) {
    next(error);
  }
}

export async function createNotification(req, res, next) {
  try {
    res.status(201).json(await notificationsService.create(req.user, req.body));
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    res.json(await notificationsService.markAsRead(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    res.json(await notificationsService.markAllAsRead(req.user));
  } catch (error) {
    next(error);
  }
}
