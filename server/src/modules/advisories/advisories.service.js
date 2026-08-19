import { prisma } from "../../config/prisma.js";
import { mapDatabaseRoleToSystemRole } from "../auth/auth.service.js";
import { crearNotificacionSistemaSegura, notificarAdministradoresSeguro } from "../notifications/notifications.service.js";
import { crearServicioDesdeAsesoria } from "../services/services.service.js";
import { formatService } from "../services/services.mapper.js";
import { formatAdvisory, formatAdvisoryMessage } from "./advisories.mapper.js";

const DEVICE_TYPES = new Set(["Computador", "Celular", "Tablet", "Impresora", "Consola", "Otro"]);
const ADVISORY_STATUS = {
  pending: "Pendiente",
  assigned: "Asignada",
  inProgress: "En proceso",
  resolved: "Asesoria resuelta",
  cancelled: "Cancelada",
};
const NON_TECHNICAL_SERVICE_TYPE_NAMES = new Set([
  "asesoria",
  "asesorias",
  "orientacion",
  "orientaciones",
  "consulta",
  "consultas",
]);
const FORBIDDEN_CREATE_FIELDS = [
  "estado",
  "asesorId",
  "advisorId",
  "idUsuarioAsesor",
  "id_usuario_asesor",
  "tipoServicioId",
  "idTipoServicio",
  "id_tipo_servicio",
  "descripcionServicioFinal",
  "descripcion_servicio_final",
  "usuarioId",
  "userId",
  "idUsuarioSolicitante",
  "id_usuario_solicitante",
];
const FORBIDDEN_RESOLVE_FIELDS = [
  "estado",
  "usuarioId",
  "userId",
  "idUsuario",
  "id_usuario",
  "idUsuarioSolicitante",
  "id_usuario_solicitante",
  "asesorId",
  "advisorId",
  "idUsuarioAsesor",
  "id_usuario_asesor",
  "solicitudServicioId",
  "serviceId",
  "idSolicitudServicio",
  "id_solicitud_servicio",
  "technicianId",
  "tecnicoId",
  "monto",
  "amount",
  "fecha",
  "hora",
];

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertUser(authUser) {
  if (!authUser) throw createError("Usuario autenticado requerido.", 401);
  if (authUser.role !== "usuario") {
    throw createError("Solo usuarios pueden solicitar asesorias.", 403);
  }
}

function assertAdvisor(authUser) {
  if (!authUser) throw createError("Usuario autenticado requerido.", 401);
  if (authUser.role !== "asesor") {
    throw createError("Solo el asesor asignado puede resolver asesorias.", 403);
  }
}

function assertAdmin(authUser) {
  if (!authUser) throw createError("Usuario autenticado requerido.", 401);
  if (authUser.role !== "admin") {
    throw createError("Solo administradores pueden gestionar asesorias.", 403);
  }
}

function trimText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeMessageText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function assertNoForbiddenFields(payload) {
  const found = FORBIDDEN_CREATE_FIELDS.filter(field => Object.hasOwn(payload, field));
  if (found.length > 0) {
    throw createError(`No puedes enviar campos administrativos: ${found.join(", ")}.`, 400);
  }
}

function assertNoForbiddenResolveFields(payload) {
  const found = FORBIDDEN_RESOLVE_FIELDS.filter(field => Object.hasOwn(payload, field));
  if (found.length > 0) {
    throw createError(`No puedes enviar campos no permitidos para resolver asesorias: ${found.join(", ")}.`, 400);
  }
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeCatalogName(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function isTechnicalServiceType(tipoServicio) {
  const normalized = normalizeCatalogName(tipoServicio?.nombreServicio);
  if (!normalized) return false;
  const compact = normalized.replace(/\s+/g, "");
  return !Array.from(NON_TECHNICAL_SERVICE_TYPE_NAMES).some(blocked => compact === blocked || normalized === blocked);
}

function assertTechnicalServiceType(tipoServicio) {
  if (!isTechnicalServiceType(tipoServicio)) {
    throw createError("El tipo Asesoria no puede usarse como servicio tecnico.", 400);
  }
}

function formatTipoServicioCatalog(tipo) {
  return {
    id: tipo.idTipoServicio,
    idTipoServicio: tipo.idTipoServicio,
    nombre: tipo.nombreServicio,
    nombreServicio: tipo.nombreServicio,
    descripcion: tipo.descripcionServicio,
    descripcionServicio: tipo.descripcionServicio,
  };
}

function isResolvedAdvisory(advisory) {
  return normalizeStatus(advisory?.estado) === normalizeStatus(ADVISORY_STATUS.resolved);
}

function isCancelledAdvisory(advisory) {
  return normalizeStatus(advisory?.estado) === normalizeStatus(ADVISORY_STATUS.cancelled);
}

function isResolvableAdvisory(advisory) {
  const status = normalizeStatus(advisory?.estado);
  return [
    ADVISORY_STATUS.pending,
    ADVISORY_STATUS.assigned,
    ADVISORY_STATUS.inProgress,
  ].some(item => normalizeStatus(item) === status);
}

function pickTipoServicioId(payload = {}) {
  return payload.tipoServicioId ?? payload.idTipoServicio ?? payload.serviceTypeId ?? payload.id_tipo_servicio;
}

function pickDescripcionFinal(payload = {}) {
  return payload.descripcionServicioFinal
    ?? payload.descripcionFinal
    ?? payload.finalServiceDescription
    ?? payload.descripcion_servicio_final
    ?? "";
}

function pickAdvisorId(payload = {}) {
  return payload.asesorId ?? payload.advisorId ?? payload.idUsuarioAsesor ?? payload.id_usuario_asesor;
}

function normalizePhone(value, { required = false } = {}) {
  const raw = String(value || "").trim();
  if (!raw) {
    if (required) throw createError("El telefono principal es obligatorio.", 400);
    return null;
  }

  if (!/^[+\d\s-]+$/.test(raw)) throw createError("Telefono invalido.", 400);
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("57") && digits.length > 10) digits = digits.slice(2);
  if (digits.length < 7 || digits.length > 15) throw createError("Telefono invalido.", 400);
  return digits;
}

function parseContactDate(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw createError("Fecha de contacto invalida.", 400);
  const date = new Date(`${raw}T00:00:00.000`);
  if (Number.isNaN(date.getTime())) throw createError("Fecha de contacto invalida.", 400);
  return { raw, date };
}

function parseContactTime(value) {
  const raw = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(raw)) throw createError("Hora de contacto invalida.", 400);
  const [hour, minute] = raw.split(":").map(Number);
  if (hour > 23 || minute > 59) throw createError("Hora de contacto invalida.", 400);
  return { raw, date: new Date(`1970-01-01T${raw}:00.000`) };
}

function validateContactDateTime(fechaContacto, horaContacto) {
  const { raw: dateRaw, date } = parseContactDate(fechaContacto);
  const { raw: timeRaw, date: time } = parseContactTime(horaContacto);
  const now = new Date();
  const todayRaw = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  if (dateRaw < todayRaw) throw createError("La fecha de contacto no puede estar en el pasado.", 400);
  if (dateRaw === todayRaw) {
    const contactDateTime = new Date(`${dateRaw}T${timeRaw}:00.000`);
    if (contactDateTime <= now) throw createError("La hora de contacto no puede estar en el pasado.", 400);
  }

  return { date, time };
}

function getUserDisplayName(user) {
  return `${user?.nombre || ""}${user?.apellido ? ` ${user.apellido}` : ""}`.trim() || user?.correo || `usuario #${user?.idUsuario}`;
}

const includeRelations = {
  solicitante: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
    },
  },
  asesor: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
    },
  },
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
  solicitudServicio: {
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
        },
        orderBy: { idCita: "asc" },
      },
    },
  },
};

async function findAdvisory(id) {
  return prisma.asesoria.findUnique({
    where: { idAsesoria: Number(id) },
    include: includeRelations,
  });
}

async function assertChatParticipant(authUser, id) {
  if (!authUser) throw createError("Usuario autenticado requerido.", 401);
  if (!["asesor", "usuario"].includes(authUser.role)) {
    throw createError("Solo el usuario solicitante y el asesor asignado pueden usar este chat.", 403);
  }

  const advisory = await prisma.asesoria.findUnique({
    where: { idAsesoria: Number(id) },
    include: {
      solicitante: {
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
        },
      },
      asesor: {
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
        },
      },
    },
  });

  if (!advisory) throw createError("Asesoria no encontrada.", 404);
  if (!advisory.idUsuarioAsesor) {
    throw createError("La asesoria aun no tiene asesor asignado.", 409);
  }

  const isRequester = authUser.role === "usuario" && advisory.idUsuarioSolicitante === authUser.id;
  const isAssignedAdvisor = authUser.role === "asesor" && advisory.idUsuarioAsesor === authUser.id;
  if (!isRequester && !isAssignedAdvisor) {
    throw createError("No tienes permisos para usar el chat de esta asesoria.", 403);
  }

  return advisory;
}

export const advisoriesService = {
  async catalogs(authUser) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);
    if (!["asesor", "admin"].includes(authUser.role)) {
      throw createError("No tienes permisos para consultar catalogos de asesorias.", 403);
    }

    const tiposServicio = await prisma.tipoServicio.findMany({
      orderBy: { idTipoServicio: "asc" },
    });
    const usuarios = authUser.role === "admin"
      ? await prisma.usuario.findMany({
        where: { activo: true },
        include: { rol: true },
        orderBy: [
          { nombre: "asc" },
          { apellido: "asc" },
          { idUsuario: "asc" },
        ],
      })
      : [];
    const asesores = usuarios.filter(usuario => mapDatabaseRoleToSystemRole(usuario.rol?.nombreRol) === "asesor");
    const advisorLoads = authUser.role === "admin" && asesores.length > 0
      ? await prisma.asesoria.groupBy({
        by: ["idUsuarioAsesor"],
        where: {
          idUsuarioAsesor: { in: asesores.map(asesor => asesor.idUsuario) },
          estado: { in: [ADVISORY_STATUS.assigned, ADVISORY_STATUS.inProgress, ADVISORY_STATUS.pending] },
          idSolicitudServicio: null,
        },
        _count: { _all: true },
      })
      : [];
    const loadsByAdvisor = new Map(advisorLoads.map(item => [item.idUsuarioAsesor, item._count._all]));

    const tiposVisibles = authUser.role === "asesor"
      ? tiposServicio.filter(isTechnicalServiceType)
      : tiposServicio;

    return {
      tiposServicio: tiposVisibles.map(formatTipoServicioCatalog),
      asesores: asesores.map(asesor => ({
        id: asesor.idUsuario,
        idUsuario: asesor.idUsuario,
        asesorId: asesor.idUsuario,
        nombre: asesor.nombre,
        apellido: asesor.apellido,
        name: getUserDisplayName(asesor),
        correo: asesor.correo,
        email: asesor.correo,
        telefono: asesor.telefono,
        carga: loadsByAdvisor.get(asesor.idUsuario) || 0,
        activeAdvisories: loadsByAdvisor.get(asesor.idUsuario) || 0,
      })),
    };
  },

  async create(authUser, payload = {}) {
    assertUser(authUser);
    assertNoForbiddenFields(payload);

    const descripcionInicial = trimText(payload.descripcionInicial ?? payload.descripcion);
    if (descripcionInicial.length < 10) throw createError("La descripcion inicial debe tener al menos 10 caracteres.", 400);
    if (descripcionInicial.length > 2000) throw createError("La descripcion inicial no puede superar 2000 caracteres.", 400);

    const tipoDispositivo = trimText(payload.tipoDispositivo);
    if (!DEVICE_TYPES.has(tipoDispositivo)) throw createError("Tipo de dispositivo invalido.", 400);

    const { date, time } = validateContactDateTime(payload.fechaContacto ?? payload.fecha, payload.horaContacto ?? payload.hora);
    const telefonoPrincipal = normalizePhone(payload.telefonoPrincipal);
    const telefonoAlterno = normalizePhone(payload.telefonoAlterno);
    if (telefonoPrincipal && telefonoAlterno && telefonoAlterno === telefonoPrincipal) {
      throw createError("El telefono alterno debe ser diferente del principal.", 400);
    }

    const advisory = await prisma.asesoria.create({
      data: {
        idUsuarioSolicitante: authUser.id,
        idUsuarioAsesor: null,
        fecha: date,
        hora: time,
        estado: ADVISORY_STATUS.pending,
        motivo: "Solicitud de asesoria",
        descripcion: descripcionInicial,
        tipoDispositivo,
        telefonoPrincipal,
        telefonoAlterno,
        idTipoServicio: null,
        descripcionServicioFinal: null,
        fechaCreacion: new Date(),
      },
      include: includeRelations,
    });

    await crearNotificacionSistemaSegura({
      idUsuario: authUser.id,
      tipo: "sistema",
      titulo: "Solicitud de asesoria creada",
      mensaje: `Tu solicitud de asesoria #${advisory.idAsesoria} fue registrada y esta pendiente.`,
      evento: "solicitud_asesoria_usuario",
      referenciaTipo: "asesoria",
      referenciaId: advisory.idAsesoria,
    });

    await notificarAdministradoresSeguro({
      tipo: "sistema",
      titulo: "Nueva solicitud de asesoria",
      mensaje: `El usuario ${getUserDisplayName(advisory.solicitante)} creo la solicitud de asesoria #${advisory.idAsesoria}.`,
      evento: "nueva_solicitud_asesoria",
      referenciaTipo: "asesoria",
      referenciaId: advisory.idAsesoria,
    });

    return formatAdvisory(advisory);
  },

  async list(authUser) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);
    if (!["asesor", "usuario", "admin"].includes(authUser.role)) {
      throw createError("No tienes permisos para consultar asesorias.", 403);
    }

    const advisories = await prisma.asesoria.findMany({
      where: authUser.role === "admin"
        ? {}
        : authUser.role === "asesor"
          ? { idUsuarioAsesor: authUser.id }
          : { idUsuarioSolicitante: authUser.id },
      include: includeRelations,
      orderBy: [
        { fechaCreacion: "desc" },
        { idAsesoria: "desc" },
      ],
    });

    return advisories.map(formatAdvisory);
  },

  async getById(authUser, id) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);
    if (!["asesor", "usuario", "admin"].includes(authUser.role)) {
      throw createError("No tienes permisos para consultar asesorias.", 403);
    }
    const advisory = await findAdvisory(id);

    if (!advisory) throw createError("Asesoria no encontrada.", 404);
    const ownsAdvisory = authUser.role === "admin"
      || (authUser.role === "asesor"
        ? advisory.idUsuarioAsesor === authUser.id
        : advisory.idUsuarioSolicitante === authUser.id);
    if (!ownsAdvisory) {
      throw createError("No tienes permisos para esta asesoria.", 403);
    }

    return formatAdvisory(advisory);
  },

  async getComments(authUser, id) {
    await this.getById(authUser, id);

    return {
      advisoryId: Number(id),
      asesoriaId: Number(id),
      comments: [],
      comentarios: [],
      relationAvailable: false,
      relacionDisponible: false,
      message: "La tabla comentarios todavia no tiene relacion funcional con asesorias.",
    };
  },

  async getMessages(authUser, id) {
    await assertChatParticipant(authUser, id);

    const messages = await prisma.mensajeAsesoria.findMany({
      where: { idAsesoria: Number(id) },
      include: {
        remitente: {
          select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            correo: true,
            telefono: true,
          },
        },
        asesoria: {
          select: {
            idAsesoria: true,
            idUsuarioSolicitante: true,
            idUsuarioAsesor: true,
          },
        },
      },
      orderBy: [
        { fechaCreacion: "asc" },
        { idMensajeAsesoria: "asc" },
      ],
    });

    const formattedMessages = messages.map(formatAdvisoryMessage);

    return {
      advisoryId: Number(id),
      asesoriaId: Number(id),
      messages: formattedMessages,
      mensajes: formattedMessages,
    };
  },

  async sendMessage(authUser, id, payload = {}) {
    const advisory = await assertChatParticipant(authUser, id);
    const message = normalizeMessageText(payload.message ?? payload.mensaje ?? payload.texto);

    if (!message) throw createError("El mensaje es obligatorio.", 400);
    if (message.length > 1000) throw createError("El mensaje no puede superar 1000 caracteres.", 400);

    const created = await prisma.mensajeAsesoria.create({
      data: {
        idAsesoria: advisory.idAsesoria,
        idUsuarioRemitente: authUser.id,
        mensaje: message,
      },
      include: {
        remitente: {
          select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            correo: true,
            telefono: true,
          },
        },
        asesoria: {
          select: {
            idAsesoria: true,
            idUsuarioSolicitante: true,
            idUsuarioAsesor: true,
          },
        },
      },
    });

    const recipientId = authUser.id === advisory.idUsuarioSolicitante
      ? advisory.idUsuarioAsesor
      : advisory.idUsuarioSolicitante;

    await crearNotificacionSistemaSegura({
      idUsuario: recipientId,
      tipo: "comentario",
      titulo: "Nuevo mensaje de asesoria",
      mensaje: `Tienes un nuevo mensaje en la asesoria #${advisory.idAsesoria}.`,
      evento: "mensaje_asesoria",
      referenciaTipo: "asesoria",
      referenciaId: advisory.idAsesoria,
    });

    const formatted = formatAdvisoryMessage(created);
    return {
      message: "Mensaje enviado correctamente.",
      chatMessage: formatted,
      mensaje: formatted,
    };
  },

  async assign(authUser, id, payload = {}) {
    assertAdmin(authUser);

    const advisorId = Number(pickAdvisorId(payload));
    if (!Number.isInteger(advisorId) || advisorId <= 0) {
      throw createError("El asesor es obligatorio.", 400);
    }

    const advisory = await prisma.asesoria.findUnique({
      where: { idAsesoria: Number(id) },
      include: includeRelations,
    });
    if (!advisory) throw createError("Asesoria no encontrada.", 404);
    if (isResolvedAdvisory(advisory) || advisory.idSolicitudServicio) {
      throw createError("No se puede reasignar una asesoria resuelta.", 409);
    }
    if (isCancelledAdvisory(advisory)) {
      throw createError("No se puede asignar una asesoria cancelada.", 409);
    }

    const advisor = await prisma.usuario.findUnique({
      where: { idUsuario: advisorId },
      include: { rol: true },
    });
    if (!advisor || !advisor.activo) {
      throw createError("Asesor no encontrado o inactivo.", 404);
    }
    if (mapDatabaseRoleToSystemRole(advisor.rol?.nombreRol) !== "asesor") {
      throw createError("El usuario indicado no tiene rol asesor.", 400);
    }

    const wasAssignedToSameAdvisor = advisory.idUsuarioAsesor === advisor.idUsuario;
    const updated = await prisma.asesoria.update({
      where: { idAsesoria: advisory.idAsesoria },
      data: {
        idUsuarioAsesor: advisor.idUsuario,
        estado: ADVISORY_STATUS.assigned,
        fechaActualizacion: new Date(),
      },
      include: includeRelations,
    });

    await crearNotificacionSistemaSegura({
      idUsuario: updated.idUsuarioSolicitante,
      tipo: "sistema",
      titulo: "Asesor asignado",
      mensaje: `Tu asesoria #${updated.idAsesoria} fue asignada al asesor ${getUserDisplayName(advisor)}.`,
      evento: "asesoria_asignada_usuario",
      referenciaTipo: "asesoria",
      referenciaId: updated.idAsesoria,
    });

    if (!wasAssignedToSameAdvisor) {
      await crearNotificacionSistemaSegura({
        idUsuario: advisor.idUsuario,
        tipo: "sistema",
        titulo: "Nueva asesoria asignada",
        mensaje: `Se te asigno la asesoria #${updated.idAsesoria} del usuario ${getUserDisplayName(updated.solicitante)}.`,
        evento: "asesoria_asignada_asesor",
        referenciaTipo: "asesoria",
        referenciaId: updated.idAsesoria,
      });
    }

    return {
      message: wasAssignedToSameAdvisor ? "Asesoria ya estaba asignada a este asesor." : "Asesoria asignada correctamente.",
      advisory: formatAdvisory(updated),
      asesoria: formatAdvisory(updated),
    };
  },

  async resolve(authUser, id, payload = {}) {
    assertAdvisor(authUser);
    assertNoForbiddenResolveFields(payload);

    const tipoServicioId = Number(pickTipoServicioId(payload));
    if (!Number.isInteger(tipoServicioId) || tipoServicioId <= 0) {
      throw createError("El tipo de servicio es obligatorio.", 400);
    }

    const descripcionServicioFinal = trimText(pickDescripcionFinal(payload));
    if (descripcionServicioFinal.length < 10) {
      throw createError("La descripcion final del servicio debe tener al menos 10 caracteres.", 400);
    }
    if (descripcionServicioFinal.length > 255) {
      throw createError("La descripcion final del servicio no puede superar 255 caracteres porque solicitudes_servicio.descripcion_problema permite 255.", 400);
    }

    let transactionResult;
    try {
      transactionResult = await prisma.$transaction(async tx => {
        const advisory = await tx.asesoria.findUnique({
          where: { idAsesoria: Number(id) },
          include: includeRelations,
        });

        if (!advisory) throw createError("Asesoria no encontrada.", 404);
        if (advisory.idUsuarioAsesor !== authUser.id) {
          throw createError("No tienes permisos para resolver esta asesoria.", 403);
        }
        if (advisory.idSolicitudServicio) {
          throw createError("La asesoria ya tiene una solicitud de servicio generada.", 409);
        }
        if (!isResolvableAdvisory(advisory)) {
          throw createError("Solo se pueden resolver asesorias pendientes o asignadas.", 409);
        }
        if (!advisory.idUsuarioSolicitante) {
          throw createError("La asesoria no tiene usuario solicitante.", 400);
        }

        const tipoServicio = await tx.tipoServicio.findUnique({
          where: { idTipoServicio: tipoServicioId },
        });
        if (!tipoServicio) throw createError("Tipo de servicio no encontrado.", 404);
        assertTechnicalServiceType(tipoServicio);

        const solicitante = await tx.usuario.findUnique({
          where: { idUsuario: advisory.idUsuarioSolicitante },
        });
        if (!solicitante || !solicitante.activo) {
          throw createError("Usuario solicitante no encontrado o inactivo.", 400);
        }

        const service = await crearServicioDesdeAsesoria(tx, {
          idUsuario: advisory.idUsuarioSolicitante,
          idTipoServicio: tipoServicio.idTipoServicio,
          descripcion: descripcionServicioFinal,
        });

        const updatedAdvisory = await tx.asesoria.update({
          where: { idAsesoria: advisory.idAsesoria },
          data: {
            idTipoServicio: tipoServicio.idTipoServicio,
            descripcionServicioFinal,
            estado: ADVISORY_STATUS.resolved,
            idSolicitudServicio: service.idSolicitudServicio,
            fechaActualizacion: new Date(),
          },
          include: includeRelations,
        });

        return {
          advisory: updatedAdvisory,
          service,
          tipoServicio,
          solicitante,
        };
      });
    } catch (error) {
      if (error?.code === "P2002") {
        throw createError("La asesoria ya tiene una solicitud de servicio generada.", 409);
      }
      throw error;
    }

    await crearNotificacionSistemaSegura({
      idUsuario: transactionResult.advisory.idUsuarioSolicitante,
      tipo: "servicio",
      titulo: "Asesoria resuelta",
      mensaje: `Tu asesoria #${transactionResult.advisory.idAsesoria} fue resuelta. Se creo la solicitud de servicio #${transactionResult.service.idSolicitudServicio} con el tipo ${transactionResult.tipoServicio.nombreServicio}.`,
      evento: "asesoria_resuelta_usuario",
      referenciaTipo: "asesoria",
      referenciaId: transactionResult.advisory.idAsesoria,
    });

    await notificarAdministradoresSeguro({
      tipo: "servicio",
      titulo: "Nuevo servicio generado desde asesoria",
      mensaje: `La asesoria #${transactionResult.advisory.idAsesoria} fue resuelta y genero la solicitud de servicio #${transactionResult.service.idSolicitudServicio}, pendiente de asignacion de tecnico.`,
      evento: "asesoria_genero_servicio",
      referenciaTipo: "asesoria",
      referenciaId: transactionResult.advisory.idAsesoria,
    });

    await crearNotificacionSistemaSegura({
      idUsuario: authUser.id,
      tipo: "sistema",
      titulo: "Asesoria finalizada",
      mensaje: `Finalizaste la asesoria #${transactionResult.advisory.idAsesoria}.`,
      evento: "asesoria_finalizada_asesor",
      referenciaTipo: "asesoria",
      referenciaId: transactionResult.advisory.idAsesoria,
    });

    return {
      message: "Asesoria resuelta y solicitud de servicio creada correctamente.",
      advisory: formatAdvisory(transactionResult.advisory),
      asesoria: formatAdvisory(transactionResult.advisory),
      service: formatService(transactionResult.service),
      servicio: formatService(transactionResult.service),
    };
  },
};
