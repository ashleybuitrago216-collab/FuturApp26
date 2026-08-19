function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function normalizeNotificationFromApi(notification) {
  const createdAt = notification.createdAt || notification.fechaEnvio || notification.fecha;

  return {
    id: notification.id,
    userId: notification.userId ?? notification.usuarioId,
    usuarioId: notification.usuarioId ?? notification.userId,
    title: notification.title || notification.titulo || "",
    titulo: notification.titulo || notification.title || "",
    message: notification.message || notification.mensaje || "",
    mensaje: notification.mensaje || notification.message || "",
    type: notification.type || notification.tipo || "sistema",
    tipo: notification.tipo || notification.type || "sistema",
    read: Boolean(notification.read ?? notification.leida),
    leida: Boolean(notification.leida ?? notification.read),
    fecha: formatDate(createdAt),
    createdAt,
    fechaEnvio: notification.fechaEnvio || createdAt,
    updatedAt: notification.updatedAt,
    user: notification.user,
    usuario: notification.usuario,
  };
}

export function normalizeNotificationsFromApi(notifications = []) {
  return notifications.map(normalizeNotificationFromApi);
}
