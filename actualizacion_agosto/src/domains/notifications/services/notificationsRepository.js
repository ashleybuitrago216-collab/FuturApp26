export function listNotificationsForUser(notifications, userId) {
  return [...notifications]
    .filter((notification) => notification.usuarioId === userId)
    .sort((a, b) => b.id - a.id);
}

