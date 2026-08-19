import { prisma } from "../../config/prisma.js";
import { mapDatabaseRoleToSystemRole } from "../auth/auth.service.js";
import { formatNotification } from "./notifications.mapper.js";

const TYPE_ALIASES = {
  sistema: "Solicitud Creada",
  servicio: "Solicitud Creada",
  solicitud: "Solicitud Creada",
  cita: "Cita Confirmada",
  pago: "Pago Recibido",
  comentario: "Comentario Nuevo",
  seguridad: "Solicitud Creada",
};

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isAdmin(user) {
  return user?.role === "admin";
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const includeRelations = {
  usuario: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
    },
  },
  tipoNotificacion: true,
};

async function resolveUsuario(idUsuario) {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario: Number(idUsuario) },
  });

  if (!usuario) throw createError("Usuario destino no encontrado.", 404);
  return usuario;
}

async function resolveTipoNotificacion({ idTipoNotificacion, tipo } = {}) {
  if (idTipoNotificacion != null && idTipoNotificacion !== "") {
    const tipoNotificacion = await prisma.tipoNotificacion.findUnique({
      where: { idTipoNotificacion: Number(idTipoNotificacion) },
    });
    if (!tipoNotificacion) throw createError("Tipo de notificacion no encontrado.", 400);
    return tipoNotificacion;
  }

  const requested = normalizeText(tipo || "sistema");
  const targetName = TYPE_ALIASES[requested] || tipo;
  const tipos = await prisma.tipoNotificacion.findMany();
  const tipoNotificacion = tipos.find(item => normalizeText(item.nombreTipoNotificacion) === normalizeText(targetName));

  if (!tipoNotificacion) {
    throw createError(`Tipo de notificacion no encontrado en catalogo: ${targetName}.`, 400);
  }

  return tipoNotificacion;
}

async function findNotification(idNotificacion) {
  return prisma.notificacion.findUnique({
    where: { idNotificacion: Number(idNotificacion) },
    include: includeRelations,
  });
}

function assertCanAccessNotification(authUser, notification) {
  if (!notification) throw createError("Notificacion no encontrada.", 404);
  if (notification.idUsuario !== authUser.id) {
    throw createError("No tienes permisos para esta notificacion.", 403);
  }
}

function getRequestedUserId(authUser, payload = {}) {
  return Number(payload.idUsuario || payload.usuarioId || payload.userId || authUser.id);
}

export async function crearNotificacionSistema({ idUsuario, tipo = "sistema", titulo, mensaje }) {
  if (!idUsuario) throw createError("El usuario destino es obligatorio.");
  if (!titulo || !String(titulo).trim()) throw createError("El titulo de la notificacion es obligatorio.");
  if (!mensaje || !String(mensaje).trim()) throw createError("El mensaje de la notificacion es obligatorio.");

  await resolveUsuario(idUsuario);
  const tipoNotificacion = await resolveTipoNotificacion({ tipo });

  const notification = await prisma.notificacion.create({
    data: {
      idUsuario: Number(idUsuario),
      idTipoNotificacion: tipoNotificacion.idTipoNotificacion,
      titulo: String(titulo).trim(),
      mensaje: String(mensaje).trim(),
      leida: false,
      fechaEnvio: new Date(),
    },
    include: includeRelations,
  });

  return formatNotification(notification);
}

export async function crearNotificacionSistemaSegura(payload) {
  try {
    return await crearNotificacionSistema(payload);
  } catch (error) {
    console.error("[NOTIFICATIONS]", {
      evento: payload?.evento || "notificacion_sistema",
      referenciaTipo: payload?.referenciaTipo || null,
      referenciaId: payload?.referenciaId || null,
      destinatario: payload?.idUsuario || null,
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
    return null;
  }
}

export async function crearNotificacionSistemaUnicaSegura({ idUsuario, tipo = "sistema", titulo, mensaje, evento, referenciaTipo, referenciaId, dedupeKey } = {}) {
  try {
    if (!idUsuario) throw createError("El usuario destino es obligatorio.");
    if (!titulo || !String(titulo).trim()) throw createError("El titulo de la notificacion es obligatorio.");
    if (!mensaje || !String(mensaje).trim()) throw createError("El mensaje de la notificacion es obligatorio.");

    await resolveUsuario(idUsuario);
    const tipoNotificacion = await resolveTipoNotificacion({ tipo });
    const title = String(titulo).trim();
    const message = String(mensaje).trim();
    const uniqueMessage = dedupeKey ? `${message}\n\n[${String(dedupeKey).trim()}]` : message;

    const existing = await prisma.notificacion.findFirst({
      where: {
        idUsuario: Number(idUsuario),
        idTipoNotificacion: tipoNotificacion.idTipoNotificacion,
        titulo: title,
        mensaje: uniqueMessage,
      },
      include: includeRelations,
    });

    if (existing) {
      return {
        notification: formatNotification(existing),
        created: false,
      };
    }

    const notification = await prisma.notificacion.create({
      data: {
        idUsuario: Number(idUsuario),
        idTipoNotificacion: tipoNotificacion.idTipoNotificacion,
        titulo: title,
        mensaje: uniqueMessage,
        leida: false,
        fechaEnvio: new Date(),
      },
      include: includeRelations,
    });

    return {
      notification: formatNotification(notification),
      created: true,
    };
  } catch (error) {
    console.error("[NOTIFICATIONS]", {
      evento: evento || "notificacion_sistema_unica",
      referenciaTipo: referenciaTipo || null,
      referenciaId: referenciaId || null,
      destinatario: idUsuario || null,
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
    return {
      notification: null,
      created: false,
      error: error.message,
    };
  }
}

async function findActiveAdmins() {
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true },
    include: {
      rol: {
        select: { nombreRol: true },
      },
    },
    orderBy: { idUsuario: "asc" },
  });

  return usuarios.filter(usuario => mapDatabaseRoleToSystemRole(usuario.rol?.nombreRol) === "admin");
}

export async function notificarAdministradores({
  tipo = "sistema",
  titulo,
  mensaje,
  referenciaTipo = null,
  referenciaId = null,
  evento = "alerta_administrativa",
}) {
  if (!titulo || !String(titulo).trim()) throw createError("El titulo de la notificacion es obligatorio.");
  if (!mensaje || !String(mensaje).trim()) throw createError("El mensaje de la notificacion es obligatorio.");

  const tipoNotificacion = await resolveTipoNotificacion({ tipo });
  const admins = await findActiveAdmins();

  if (admins.length === 0) {
    return {
      administradoresEncontrados: 0,
      notificacionesCreadas: 0,
      omitidasPorDuplicado: 0,
      errores: [],
    };
  }

  const adminIds = admins.map(admin => admin.idUsuario);
  const title = String(titulo).trim();
  const message = String(mensaje).trim();

  // El schema actual no tiene columnas de referencia/evento. Mientras no haya
  // migracion revisable, el ID real de referencia debe quedar en el mensaje.
  const existing = await prisma.notificacion.findMany({
    where: {
      idUsuario: { in: adminIds },
      idTipoNotificacion: tipoNotificacion.idTipoNotificacion,
      titulo: title,
      mensaje: message,
    },
    select: { idUsuario: true },
  });
  const notifiedAdminIds = new Set(existing.map(notification => notification.idUsuario));
  const pendingAdmins = admins.filter(admin => !notifiedAdminIds.has(admin.idUsuario));

  if (pendingAdmins.length === 0) {
    return {
      administradoresEncontrados: admins.length,
      notificacionesCreadas: 0,
      omitidasPorDuplicado: admins.length,
      errores: [],
      evento,
      referenciaTipo,
      referenciaId,
    };
  }

  const result = await prisma.notificacion.createMany({
    data: pendingAdmins.map(admin => ({
      idUsuario: admin.idUsuario,
      idTipoNotificacion: tipoNotificacion.idTipoNotificacion,
      titulo: title,
      mensaje: message,
      leida: false,
      fechaEnvio: new Date(),
    })),
  });

  return {
    administradoresEncontrados: admins.length,
    notificacionesCreadas: result.count,
    omitidasPorDuplicado: admins.length - pendingAdmins.length,
    errores: [],
    evento,
    referenciaTipo,
    referenciaId,
  };
}

export async function notificarAdministradoresSeguro(payload) {
  try {
    return await notificarAdministradores(payload);
  } catch (error) {
    console.error("[NOTIFICATIONS]", {
      evento: payload?.evento || "alerta_administrativa",
      referenciaTipo: payload?.referenciaTipo || null,
      referenciaId: payload?.referenciaId || null,
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
    return {
      administradoresEncontrados: 0,
      notificacionesCreadas: 0,
      omitidasPorDuplicado: 0,
      errores: [error.message],
      evento: payload?.evento || "alerta_administrativa",
      referenciaTipo: payload?.referenciaTipo || null,
      referenciaId: payload?.referenciaId || null,
    };
  }
}

export const notificationsService = {
  async list(authUser) {
    const notifications = await prisma.notificacion.findMany({
      where: { idUsuario: authUser.id },
      include: includeRelations,
      orderBy: { fechaEnvio: "desc" },
    });

    return notifications.map(formatNotification);
  },

  async unreadCount(authUser) {
    const count = await prisma.notificacion.count({
      where: { idUsuario: authUser.id, leida: false },
    });
    return { unread: count, count };
  },

  async create(authUser, payload = {}) {
    const requestedUserId = getRequestedUserId(authUser, payload);

    if (!requestedUserId) throw createError("El usuario destino es obligatorio.");
    if (!isAdmin(authUser) && requestedUserId !== authUser.id) {
      throw createError("Solo un administrador puede crear notificaciones para otros usuarios.", 403);
    }

    const title = String(payload.title || payload.titulo || "").trim();
    const message = String(payload.message || payload.mensaje || "").trim();
    if (!title) throw createError("El titulo de la notificacion es obligatorio.");
    if (!message) throw createError("El mensaje de la notificacion es obligatorio.");

    const tipoNotificacion = await resolveTipoNotificacion({
      idTipoNotificacion: payload.idTipoNotificacion || payload.id_tipo_notificacion,
      tipo: payload.type || payload.tipo,
    });
    await resolveUsuario(requestedUserId);

    const notification = await prisma.notificacion.create({
      data: {
        idUsuario: requestedUserId,
        idTipoNotificacion: tipoNotificacion.idTipoNotificacion,
        titulo: title,
        mensaje: message,
        leida: Boolean(payload.read ?? payload.leida),
        fechaEnvio: new Date(),
      },
      include: includeRelations,
    });

    return formatNotification(notification);
  },

  async markAsRead(authUser, notificationId) {
    const notification = await findNotification(notificationId);
    assertCanAccessNotification(authUser, notification);

    const updated = await prisma.notificacion.update({
      where: { idNotificacion: notification.idNotificacion },
      data: { leida: true },
      include: includeRelations,
    });

    return formatNotification(updated);
  },

  async markAllAsRead(authUser) {
    const result = await prisma.notificacion.updateMany({
      where: { idUsuario: authUser.id, leida: false },
      data: { leida: true },
    });

    return { updated: result.count };
  },
};
