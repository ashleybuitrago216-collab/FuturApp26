import { prisma } from "../../config/prisma.js";
import { mapDatabaseRoleToSystemRole } from "../auth/auth.service.js";
import { crearNotificacionSistemaSegura, notificarAdministradoresSeguro } from "../notifications/notifications.service.js";
import { hasPaymentAmount } from "../payments/payments.service.js";
import { formatService, getPayloadNumber, getPayloadText } from "./services.mapper.js";

const USER_EDIT_WINDOW_MS = 5 * 60 * 1000;

const STATUS_ALIASES = {
  pendiente: "Pendiente",
  "en progreso": "Pendiente",
  "en proceso": "Pendiente",
  confirmado: "Pendiente",
  confirmada: "Pendiente",
  finalizado: "Finalizado",
  completado: "Finalizado",
  completada: "Finalizado",
  cancelado: "Cancelado",
  cancelada: "Cancelado",
};

function isAdmin(user) {
  return user?.role === "admin";
}

function isTechnician(user) {
  return user?.role === "tecnico";
}

function isUser(user) {
  return user?.role === "usuario";
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertAllowed(condition, message = "No autorizado.") {
  if (!condition) throw createError(message, 403);
}

function assertFound(entity, message = "Servicio no encontrado.") {
  if (!entity) throw createError(message, 404);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getUserDisplayName(user) {
  return `${user?.nombre || ""}${user?.apellido ? ` ${user.apellido}` : ""}`.trim() || user?.correo || `usuario #${user?.idUsuario}`;
}

function normalizeStatusName(value) {
  const normalized = normalizeText(value);
  return STATUS_ALIASES[normalized] || null;
}

function isFinalServiceStatus(value) {
  const normalized = normalizeText(value);
  return normalized === "finalizado" || normalized === "completado";
}

function isCanceledServiceStatus(value) {
  return normalizeText(value) === "cancelado";
}

const includeRelations = {
  usuario: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
    },
  },
  tipoServicio: true,
  prioridad: true,
  estado: true,
  equipo: true,
  citas: {
    include: {
      tecnico: {
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
        },
      },
      pagos: {
        include: {
          estadoPago: true,
        },
        orderBy: { idPago: "asc" },
      },
    },
    orderBy: { idCita: "asc" },
  },
  cotizacion: {
    include: {
      pago: {
        include: {
          estadoPago: true,
        },
      },
    },
  },
  asesoriaOrigen: {
    select: {
      idAsesoria: true,
      idTipoServicio: true,
      descripcionServicioFinal: true,
      estado: true,
    },
  },
  ubicacionServicio: true,
  ubicacionesTecnico: {
    include: {
      usuario: {
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
        },
      },
    },
    orderBy: { fechaRegistro: "desc" },
    take: 1,
  },
};

async function findService(id) {
  return prisma.solicitudServicio.findUnique({
    where: { idSolicitudServicio: Number(id) },
    include: includeRelations,
  });
}

async function findUsuario(id) {
  if (!id) return null;
  return prisma.usuario.findUnique({ where: { idUsuario: Number(id) } });
}

async function resolveEstado(value, fallbackName = "Pendiente", db = prisma) {
  const requestedName = normalizeStatusName(value) || fallbackName;
  const estados = await db.estado.findMany();
  const estado = estados.find(item => normalizeText(item.nombreEstado) === normalizeText(requestedName));

  if (!estado) {
    throw createError(`Estado no encontrado en catalogo: ${requestedName}.`, 400);
  }

  return estado;
}

async function resolvePrioridad({ id, name, fallbackName = "Media", db = prisma }) {
  if (id !== undefined && id !== null) {
    const prioridad = await db.prioridad.findUnique({ where: { idPrioridad: Number(id) } });
    if (!prioridad) throw createError("Prioridad no encontrada.", 400);
    return prioridad;
  }

  const requestedName = name || fallbackName;
  const prioridades = await db.prioridad.findMany();
  const prioridad = prioridades.find(item => normalizeText(item.nombrePrioridad) === normalizeText(requestedName));

  if (!prioridad) {
    throw createError(`Prioridad no encontrada en catalogo: ${requestedName}.`, 400);
  }

  return prioridad;
}

async function resolveTipoServicio({ id, name, required = false, db = prisma }) {
  if (id !== undefined && id !== null) {
    const tipoServicio = await db.tipoServicio.findUnique({ where: { idTipoServicio: Number(id) } });
    if (!tipoServicio) throw createError("Tipo de servicio no encontrado.", 400);
    return tipoServicio;
  }

  if (!name) {
    if (required) throw createError("El tipo de servicio es requerido.", 400);
    return null;
  }

  const tipos = await db.tipoServicio.findMany();
  const tipoServicio = tipos.find(item => normalizeText(item.nombreServicio) === normalizeText(name));

  if (!tipoServicio) {
    throw createError(`Tipo de servicio no encontrado en catalogo: ${name}.`, 400);
  }

  return tipoServicio;
}

async function resolveEquipo({ idEquipo, authUser, targetUserId }) {
  if (!idEquipo) return null;

  const equipo = await prisma.equipo.findUnique({ where: { idEquipo: String(idEquipo) } });
  if (!equipo) throw createError("Equipo no encontrado.", 400);

  if (!isAdmin(authUser)) {
    assertAllowed(equipo.idUsuario === authUser.id, "No puedes usar un equipo de otro usuario.");
  } else if (targetUserId && equipo.idUsuario && equipo.idUsuario !== targetUserId) {
    throw createError("El equipo no pertenece al usuario indicado.", 400);
  }

  return equipo;
}

function hasTechnicianAssignment(payload) {
  return Object.prototype.hasOwnProperty.call(payload, "technicianId")
    || Object.prototype.hasOwnProperty.call(payload, "tecnicoId")
    || Object.prototype.hasOwnProperty.call(payload, "idTecnico")
    || Object.prototype.hasOwnProperty.call(payload, "id_tecnico");
}

function getTechnicianIdFromPayload(payload) {
  return getPayloadNumber(payload, "technicianId", "tecnicoId", "idTecnico", "id_tecnico");
}

function normalizeLocationPayload(payload = {}) {
  const location = payload.location || payload.ubicacion || payload.serviceLocation || payload.ubicacionServicio || {};
  const latitude = getPayloadNumber(location, "latitude", "latitud", "lat")
    ?? getPayloadNumber(payload, "latitude", "latitud", "lat");
  const longitude = getPayloadNumber(location, "longitude", "longitud", "lng")
    ?? getPayloadNumber(payload, "longitude", "longitud", "lng");
  const addressReference = getPayloadText(location, "addressReference", "direccionReferencia", "direccion_referencia")
    || getPayloadText(payload, "addressReference", "direccionReferencia", "direccion_referencia");
  const source = getPayloadText(location, "source", "fuente")
    || getPayloadText(payload, "source", "fuente")
    || "manual";

  if (latitude == null && longitude == null && !addressReference) return null;
  if (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90) {
    throw createError("Latitud invalida.", 400);
  }
  if (!Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
    throw createError("Longitud invalida.", 400);
  }

  return {
    latitud: Number(latitude),
    longitud: Number(longitude),
    direccionReferencia: addressReference ? addressReference.slice(0, 255) : null,
    fuente: source.slice(0, 30),
  };
}

async function upsertServiceLocation(idSolicitudServicio, location, db = prisma) {
  if (!location) return null;

  return db.ubicacionServicio.upsert({
    where: { idSolicitudServicio },
    update: location,
    create: {
      idSolicitudServicio,
      ...location,
    },
  });
}

async function resolveTecnico(idUsuarioTecnico, db = prisma) {
  if (idUsuarioTecnico === null) return null;

  const tecnico = await db.usuario.findUnique({
    where: { idUsuario: Number(idUsuarioTecnico) },
    include: { rol: true, areaEspecialidad: true },
  });

  if (!tecnico || !tecnico.activo) {
    throw createError("Tecnico no encontrado o inactivo.", 400);
  }

  if (mapDatabaseRoleToSystemRole(tecnico.rol?.nombreRol) !== "tecnico") {
    throw createError("El usuario indicado no tiene rol tecnico.", 400);
  }

  if (!tecnico.idAreaEspecialidad || !tecnico.areaEspecialidad) {
    throw createError("El tecnico debe tener area de especialidad asignada.", 400);
  }

  return tecnico;
}

async function resolveEstadoCitaPendiente(db = prisma) {
  return resolveEstado("Pendiente", "Pendiente", db);
}

async function upsertCitaAsignacionTecnico(service, idUsuarioTecnico, db = prisma) {
  const estado = await resolveEstadoCitaPendiente(db);

  if (idUsuarioTecnico === null) {
    const existing = await db.cita.findUnique({
      where: { idSolicitudServicio: service.idSolicitudServicio },
    });

    if (!existing) return null;

    return db.cita.update({
      where: { idCita: existing.idCita },
      data: { idUsuarioTecnico: null },
    });
  }

  await resolveTecnico(idUsuarioTecnico, db);

  return db.cita.upsert({
    where: { idSolicitudServicio: service.idSolicitudServicio },
    update: {
      idUsuarioCliente: service.idUsuario,
      idUsuarioTecnico: idUsuarioTecnico,
      idEstado: estado.idEstado,
    },
    create: {
      idSolicitudServicio: service.idSolicitudServicio,
      idUsuarioCliente: service.idUsuario,
      idUsuarioTecnico: idUsuarioTecnico,
      idEstado: estado.idEstado,
      confirmada: false,
    },
  });
}

export async function crearServicioDesdeAsesoria(db = prisma, {
  idUsuario,
  idTipoServicio,
  descripcion,
} = {}) {
  if (!idUsuario) throw createError("El usuario solicitante es obligatorio.", 400);
  if (!idTipoServicio) throw createError("El tipo de servicio es obligatorio.", 400);

  const description = String(descripcion || "").trim().replace(/\s+/g, " ");
  if (description.length < 10) throw createError("La descripcion del servicio debe tener al menos 10 caracteres.", 400);
  if (description.length > 255) throw createError("La descripcion del servicio no puede superar 255 caracteres.", 400);

  const usuario = await db.usuario.findUnique({
    where: { idUsuario: Number(idUsuario) },
  });
  if (!usuario || !usuario.activo) throw createError("Usuario solicitante no encontrado o inactivo.", 400);

  const tipoServicio = await resolveTipoServicio({
    id: Number(idTipoServicio),
    required: true,
    db,
  });
  const estado = await resolveEstado("Pendiente", "Pendiente", db);
  const prioridad = await resolvePrioridad({ fallbackName: "Media", db });

  return db.solicitudServicio.create({
    data: {
      idUsuario: usuario.idUsuario,
      idEquipo: null,
      idTipoServicio: tipoServicio.idTipoServicio,
      descripcionProblema: description,
      idPrioridad: prioridad.idPrioridad,
      idEstado: estado.idEstado,
      fechaSolicitud: new Date(),
    },
    include: includeRelations,
  });
}

export const servicesService = {
  async list(authUser) {
    const where = isAdmin(authUser)
      ? {}
      : isTechnician(authUser)
        ? { citas: { some: { idUsuarioTecnico: authUser.id } } }
        : { idUsuario: authUser.id };

    const services = await prisma.solicitudServicio.findMany({
      where,
      include: includeRelations,
      orderBy: { idSolicitudServicio: "asc" },
    });

    return services.map(formatService);
  },

  async create(authUser, payload) {
    if (isAdmin(authUser)) {
      throw createError("El administrador no puede crear servicios. Solo puede gestionar servicios existentes.", 403);
    }
    assertAllowed(isUser(authUser), "No puedes crear servicios.");
    if (!isAdmin(authUser) && hasTechnicianAssignment(payload)) {
      throw createError("Solo admin puede asignar tecnico.", 403);
    }
    if (!isAdmin(authUser) && hasPaymentAmount(payload)) {
      throw createError("No se puede asignar monto desde este flujo.", 403);
    }

    const description = getPayloadText(payload, "description", "descripcion");
    if (!description) throw createError("La descripcion es requerida.", 400);

    const requestedUserId = authUser.id;

    const usuario = await findUsuario(requestedUserId);
    if (!usuario) throw createError("Usuario no encontrado.", 400);

    const tipoServicio = await resolveTipoServicio({
      id: getPayloadNumber(payload, "serviceTypeId", "idTipoServicio", "id_tipo_servicio"),
      name: getPayloadText(payload, "serviceType", "tipo"),
    });
    const prioridad = await resolvePrioridad({
      id: getPayloadNumber(payload, "priorityId", "idPrioridad", "id_prioridad"),
      name: getPayloadText(payload, "priority", "prioridad"),
    });
    const estado = await resolveEstado(getPayloadText(payload, "status", "estado"), "Pendiente");
    const equipo = await resolveEquipo({
      idEquipo: getPayloadText(payload, "equipoId", "idEquipo", "id_equipo"),
      authUser,
      targetUserId: usuario.idUsuario,
    });
    const serviceLocation = normalizeLocationPayload(payload);

    let service = await prisma.$transaction(async tx => {
      const created = await tx.solicitudServicio.create({
        data: {
          idUsuario: usuario.idUsuario,
          idEquipo: equipo?.idEquipo || null,
          idTipoServicio: tipoServicio?.idTipoServicio || null,
          descripcionProblema: description,
          idPrioridad: prioridad.idPrioridad,
          idEstado: estado.idEstado,
        },
      });
      await upsertServiceLocation(created.idSolicitudServicio, serviceLocation, tx);

      return tx.solicitudServicio.findUnique({
        where: { idSolicitudServicio: created.idSolicitudServicio },
        include: includeRelations,
      });
    });

    if (isAdmin(authUser) && hasTechnicianAssignment(payload)) {
      await upsertCitaAsignacionTecnico(service, getTechnicianIdFromPayload(payload));
      service = await findService(service.idSolicitudServicio);
    }

    await crearNotificacionSistemaSegura({
      idUsuario: service.idUsuario,
      tipo: "servicio",
      titulo: "Solicitud creada",
      mensaje: `Tu solicitud #${service.idSolicitudServicio} fue creada correctamente.`,
      evento: "solicitud_creada_usuario",
      referenciaTipo: "solicitud_servicio",
      referenciaId: service.idSolicitudServicio,
    });

    await notificarAdministradoresSeguro({
      tipo: "servicio",
      titulo: "Nueva solicitud de servicio",
      mensaje: `El usuario ${getUserDisplayName(usuario)} creo la solicitud #${service.idSolicitudServicio}.`,
      evento: "nueva_solicitud",
      referenciaTipo: "solicitud_servicio",
      referenciaId: service.idSolicitudServicio,
    });

    return formatService(service);
  },

  async update(authUser, serviceId, payload) {
    const service = await findService(serviceId);
    assertFound(service);
    if (isAdmin(authUser) && hasPaymentAmount(payload)) {
      throw createError("El administrador ya no puede asignar monto desde este flujo.", 400);
    }
    if (!isAdmin(authUser) && hasTechnicianAssignment(payload)) {
      throw createError("Solo admin puede asignar tecnico.", 403);
    }
    if (!isAdmin(authUser) && hasPaymentAmount(payload)) {
      throw createError("No se puede asignar monto desde este flujo.", 403);
    }
    const data = {};

    if (isUser(authUser)) {
      assertAllowed(service.idUsuario === authUser.id, "Solo puedes editar tus servicios.");
      assertAllowed(service.estado?.nombreEstado === "Pendiente", "Solo puedes editar solicitudes pendientes.");
      assertAllowed(
        service.fechaSolicitud && Date.now() - service.fechaSolicitud.getTime() <= USER_EDIT_WINDOW_MS,
        "La descripcion solo se puede editar durante los primeros 5 minutos.",
      );

      const description = getPayloadText(payload, "description", "descripcion");
      if (!description) throw createError("La descripcion es requerida.", 400);
      data.descripcionProblema = description;
      await upsertServiceLocation(service.idSolicitudServicio, normalizeLocationPayload(payload));
    } else if (isTechnician(authUser)) {
      throw createError("No hay relacion de tecnico asignado en solicitudes_servicio. Edicion de tecnico pendiente para Fase 3B.", 403);
    } else if (isAdmin(authUser)) {
      const tipoServicio = await resolveTipoServicio({
        id: getPayloadNumber(payload, "serviceTypeId", "idTipoServicio", "id_tipo_servicio"),
        name: getPayloadText(payload, "serviceType", "tipo"),
      });
      const priorityId = getPayloadNumber(payload, "priorityId", "idPrioridad", "id_prioridad");
      const priorityName = getPayloadText(payload, "priority", "prioridad");
      const prioridad = priorityId !== undefined || priorityName
        ? await resolvePrioridad({ id: priorityId, name: priorityName })
        : null;
      const statusName = getPayloadText(payload, "status", "estado");
      const estado = statusName ? await resolveEstado(statusName) : null;
      const description = getPayloadText(payload, "description", "descripcion");

      if (tipoServicio && service.asesoriaOrigen) {
        throw createError("No se puede cambiar el tipo de un servicio generado desde asesoria. Admin solo puede asignar tecnico.", 400);
      }
      if (estado && isFinalServiceStatus(estado.nombreEstado)) {
        throw createError("Solo el tecnico asignado puede marcar el servicio como completado.", 403);
      }

      if (tipoServicio) data.idTipoServicio = tipoServicio.idTipoServicio;
      if (prioridad) data.idPrioridad = prioridad.idPrioridad;
      if (estado) data.idEstado = estado.idEstado;
      if (description) data.descripcionProblema = description;
    } else {
      assertAllowed(false);
    }

    if (isAdmin(authUser)) {
      const hasChanges = Object.keys(data).length > 0 || hasTechnicianAssignment(payload);
      if (!hasChanges) return formatService(service);

      const technicianId = getTechnicianIdFromPayload(payload);
      const updatedService = await prisma.$transaction(async tx => {
        let workingService = service;

        if (Object.keys(data).length > 0) {
          workingService = await tx.solicitudServicio.update({
            where: { idSolicitudServicio: service.idSolicitudServicio },
            data,
            include: includeRelations,
          });
        }

        if (hasTechnicianAssignment(payload)) {
          await upsertCitaAsignacionTecnico(workingService, technicianId, tx);
        }

        return tx.solicitudServicio.findUnique({
          where: { idSolicitudServicio: service.idSolicitudServicio },
          include: includeRelations,
        });
      });

      if (technicianId) {
        await crearNotificacionSistemaSegura({
          idUsuario: technicianId,
          tipo: "servicio",
          titulo: "Servicio asignado",
          mensaje: `Se te asigno la solicitud #${service.idSolicitudServicio}.`,
        });
        await crearNotificacionSistemaSegura({
          idUsuario: updatedService.idUsuario,
          tipo: "servicio",
          titulo: "Tecnico asignado",
          mensaje: `Tu solicitud #${service.idSolicitudServicio} ya tiene tecnico asignado.`,
        });
      }
      return formatService(updatedService);
    }

    if (Object.keys(data).length === 0) {
      return formatService(service);
    }

    const updatedService = await prisma.solicitudServicio.update({
      where: { idSolicitudServicio: service.idSolicitudServicio },
      data,
      include: includeRelations,
    });

    return formatService(updatedService);
  },

  async cancel(authUser, serviceId) {
    const service = await findService(serviceId);
    assertFound(service);

    if (isUser(authUser)) {
      assertAllowed(service.idUsuario === authUser.id, "Solo puedes cancelar tus servicios.");
      assertAllowed(service.estado?.nombreEstado === "Pendiente", "Solo puedes cancelar servicios pendientes.");
    } else if (isAdmin(authUser)) {
      assertAllowed(true);
    } else {
      assertAllowed(false, "El tecnico no puede cancelar servicios.");
    }

    const estadoCancelado = await resolveEstado("Cancelado");
    const updatedService = await prisma.solicitudServicio.update({
      where: { idSolicitudServicio: service.idSolicitudServicio },
      data: { idEstado: estadoCancelado.idEstado },
      include: includeRelations,
    });

    await notificarAdministradoresSeguro({
      tipo: "servicio",
      titulo: "Solicitud cancelada",
      mensaje: `El usuario ${getUserDisplayName(updatedService.usuario)} cancelo la solicitud #${updatedService.idSolicitudServicio}.`,
      evento: "solicitud_cancelada",
      referenciaTipo: "solicitud_servicio",
      referenciaId: updatedService.idSolicitudServicio,
    });

    return formatService(updatedService);
  },

  async complete(authUser, serviceId, payload = {}) {
    void payload;
    assertAllowed(isTechnician(authUser), "Solo el tecnico asignado puede completar servicios.");

    const service = await findService(serviceId);
    assertFound(service);

    const assignedAppointment = service.citas?.find(cita => cita.idUsuarioTecnico === authUser.id) || null;
    assertAllowed(assignedAppointment, "Solo puedes completar servicios asignados a ti.");

    if (isCanceledServiceStatus(service.estado?.nombreEstado)) {
      throw createError("No se puede completar un servicio cancelado.", 409);
    }
    if (isFinalServiceStatus(service.estado?.nombreEstado)) {
      throw createError("El servicio ya esta completado.", 409);
    }

    const estadoFinalizado = await resolveEstado("Finalizado");
    const updatedService = await prisma.$transaction(async tx => {
      await tx.solicitudServicio.update({
        where: { idSolicitudServicio: service.idSolicitudServicio },
        data: { idEstado: estadoFinalizado.idEstado },
      });

      await tx.cita.update({
        where: { idCita: assignedAppointment.idCita },
        data: {
          idEstado: estadoFinalizado.idEstado,
          confirmada: true,
        },
      });

      return tx.solicitudServicio.findUnique({
        where: { idSolicitudServicio: service.idSolicitudServicio },
        include: includeRelations,
      });
    });

    await crearNotificacionSistemaSegura({
      idUsuario: updatedService.idUsuario,
      tipo: "servicio",
      titulo: "Servicio completado",
      mensaje: `El tecnico marco tu servicio #${updatedService.idSolicitudServicio} como completado. Ya puedes realizar el pago si tienes una cotizacion aprobada.`,
      evento: "servicio_completado_usuario",
      referenciaTipo: "solicitud_servicio",
      referenciaId: updatedService.idSolicitudServicio,
    });

    await notificarAdministradoresSeguro({
      tipo: "servicio",
      titulo: "Servicio completado",
      mensaje: `El servicio #${updatedService.idSolicitudServicio} fue marcado como completado por el tecnico.`,
      evento: "servicio_completado_admin",
      referenciaTipo: "solicitud_servicio",
      referenciaId: updatedService.idSolicitudServicio,
    });

    return formatService(updatedService);
  },
};
