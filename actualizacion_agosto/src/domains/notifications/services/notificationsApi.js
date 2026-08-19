import { httpClient } from "../../../infrastructure/http/httpClient";

export const notificationsApi = {
  getNotifications: () => httpClient.get("/notifications"),
  getUnreadCount: () => httpClient.get("/notifications/unread-count"),
  createNotification: payload => httpClient.post("/notifications", payload),
  markAsRead: id => httpClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => httpClient.patch("/notifications/read-all"),
};
