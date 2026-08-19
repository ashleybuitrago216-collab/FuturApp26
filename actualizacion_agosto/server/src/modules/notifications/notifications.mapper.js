function formatUser(user) {
  if (!user) return null;

  return {
    id: user.idUsuario,
    name: `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim(),
    email: user.correo,
  };
}

function normalizeTypeName(tipoNotificacion) {
  const name = tipoNotificacion?.nombreTipoNotificacion || "Sistema";
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("cita")) return "cita";
  if (normalized.includes("pago")) return "pago";
  if (normalized.includes("comentario")) return "comentario";
  if (normalized.includes("solicitud")) return "servicio";
  return "sistema";
}

function cleanInternalMessage(message) {
  return String(message || "").replace(/\n\n\[[^\]]+\]$/u, "");
}

export function formatNotification(notification) {
  const type = normalizeTypeName(notification.tipoNotificacion);
  const message = cleanInternalMessage(notification.mensaje);

  return {
    id: notification.idNotificacion,
    userId: notification.idUsuario,
    usuarioId: notification.idUsuario,
    type,
    tipo: type,
    typeName: notification.tipoNotificacion?.nombreTipoNotificacion || null,
    tipoNotificacionNombre: notification.tipoNotificacion?.nombreTipoNotificacion || null,
    idTipoNotificacion: notification.idTipoNotificacion,
    title: notification.titulo,
    titulo: notification.titulo,
    message,
    mensaje: message,
    read: Boolean(notification.leida),
    leida: Boolean(notification.leida),
    createdAt: notification.fechaEnvio,
    fechaEnvio: notification.fechaEnvio,
    fecha: notification.fechaEnvio,
    usuario: formatUser(notification.usuario),
    user: formatUser(notification.usuario),
    tipoNotificacion: notification.tipoNotificacion
      ? {
        id: notification.tipoNotificacion.idTipoNotificacion,
        nombre: notification.tipoNotificacion.nombreTipoNotificacion,
      }
      : null,
  };
}
