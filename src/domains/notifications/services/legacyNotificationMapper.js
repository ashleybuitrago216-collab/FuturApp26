export function mapLegacyNotification(row, lookups = {}) {
  if (!row) return null;

  return {
    id: row.id_notificacion,
    usuarioId: row.id_usrs,
    titulo: row.titulo || "",
    mensaje: row.mensaje || "",
    leida: Boolean(row.leida),
    fecha: String(row.fecha_envio || "").slice(0, 10),
    tipo: lookups.notificationTypes?.[row.id_tipo_notif] || row.id_tipo_notif,
  };
}

export function toLegacyNotificationPayload(notification) {
  return {
    id_usrs: notification.usuarioId,
    id_tipo_notif: notification.tipo,
    titulo: notification.titulo || "",
    mensaje: notification.mensaje,
    leida: notification.leida ? 1 : 0,
    fecha_envio: notification.fecha,
  };
}

