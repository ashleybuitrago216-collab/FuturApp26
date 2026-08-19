import { prisma } from "../../config/prisma.js";
import { crearNotificacionSistemaSegura } from "../notifications/notifications.service.js";
import { hasPaymentAmount } from "../payments/payments.service.js";
import { formatAppointment } from "./appointments.mapper.js";

const VALID_APPOINTMENT_STATUSES = new Set(["Pendiente", "Programada", "Completada", "Cancelada"]);

function isAdmin(user) {
  return user?.role === "admin";
}

function isTechnician(user) {
  return user?.role === "tecnico";
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertAllowed(condition, message = "No autorizado.") {
  if (!condition) throw createError(message, 403);
}

function assertFound(entity, message = "Cita no encontrada.") {
  if (!entity) throw createError(message, 404);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const includeRelations = {
  solicitudServicio: {
    include: {
      tipoServicio: true,
      estado: true,
    },
  },
  cliente: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
    },
  },
  tecnico: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
    },
  },
  estado: true,
};

async function resolveEstadoByName(name) {
  const estados = await prisma.estado.findMany();
  const estado = estados.find(item => normalizeText(item.nombreEstado) === normalizeText(name));

  if (!estado) throw createError(`Estado no encontrado en catalogo: ${name}.`, 400);
  return estado;
}

async function resolveAppointmentStatus(status) {
  if (!VALID_APPOINTMENT_STATUSES.has(status)) {
    throw createError("Estado de cita invalido.", 400);
  }

  if (status === "Completada") {
    return { estado: await resolveEstadoByName("Finalizado"), confirmada: true };
  }

  if (status === "Cancelada") {
    return { estado: await resolveEstadoByName("Cancelado"), confirmada: false };
  }

  return {
    estado: await resolveEstadoByName("Pendiente"),
    confirmada: status === "Programada",
  };
}

function parseSchedulePayload(payload) {
  const scheduledAt = payload.scheduledAt
    || payload.fechaHora
    || (payload.fecha && payload.hora ? `${payload.fecha}T${payload.hora}:00.000Z` : null);

  if (scheduledAt) {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) throw createError("scheduledAt invalido.", 400);

    return {
      fecha: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
      hora: new Date(Date.UTC(1970, 0, 1, date.getUTCHours(), date.getUTCMinutes(), 0)),
    };
  }

  if (!payload.fecha) throw createError("fecha es requerida.", 400);
  const fecha = new Date(`${payload.fecha}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime())) throw createError("fecha invalida.", 400);

  const horaText = String(payload.hora || "00:00").trim();
  const match = horaText.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) throw createError("hora invalida.", 400);

  return {
    fecha,
    hora: new Date(Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2]), 0)),
  };
}

async function findAppointment(id) {
  return prisma.cita.findUnique({
    where: { idCita: Number(id) },
    include: includeRelations,
  });
}

export const appointmentsService = {
  async list(authUser) {
    const where = isAdmin(authUser)
      ? {}
      : isTechnician(authUser)
        ? { idUsuarioTecnico: authUser.id }
        : { idUsuarioCliente: authUser.id };

    const appointments = await prisma.cita.findMany({
      where,
      include: includeRelations,
      orderBy: { idCita: "asc" },
    });

    return appointments.map(formatAppointment);
  },

  async schedule(authUser, id, payload) {
    assertAllowed(isAdmin(authUser), "Solo admin puede programar citas.");
    if (hasPaymentAmount(payload)) {
      throw createError("El administrador ya no puede asignar monto desde este flujo.", 400);
    }

    const appointment = await findAppointment(id);
    assertFound(appointment);
    assertAllowed(Boolean(appointment.idUsuarioTecnico), "La cita debe tener tecnico asignado.");

    const schedule = parseSchedulePayload(payload);
    const { estado, confirmada } = await resolveAppointmentStatus("Programada");
    const updatedAppointment = await prisma.$transaction(async tx => {
      return tx.cita.update({
        where: { idCita: appointment.idCita },
        data: {
          fecha: schedule.fecha,
          hora: schedule.hora,
          confirmada,
          idEstado: estado.idEstado,
        },
        include: includeRelations,
      });
    });

    for (const idUsuario of [updatedAppointment.idUsuarioCliente, updatedAppointment.idUsuarioTecnico].filter(Boolean)) {
      await crearNotificacionSistemaSegura({
        idUsuario,
        tipo: "cita",
        titulo: "Cita programada",
        mensaje: `La cita #${updatedAppointment.idCita} fue programada para ${payload.fecha || "la fecha indicada"}.`,
      });
    }
    return formatAppointment(updatedAppointment);
  },

  async updateStatus(authUser, id, payload) {
    assertAllowed(isAdmin(authUser), "Solo admin puede cambiar estados de citas.");
    const status = payload.status || payload.estado;
    const { estado, confirmada } = await resolveAppointmentStatus(status);

    const appointment = await findAppointment(id);
    assertFound(appointment);

    const updatedAppointment = await prisma.cita.update({
      where: { idCita: appointment.idCita },
      data: {
        idEstado: estado.idEstado,
        confirmada,
      },
      include: includeRelations,
    });

    for (const idUsuario of [updatedAppointment.idUsuarioCliente, updatedAppointment.idUsuarioTecnico].filter(Boolean)) {
      await crearNotificacionSistemaSegura({
        idUsuario,
        tipo: "cita",
        titulo: "Estado de cita actualizado",
        mensaje: `La cita #${updatedAppointment.idCita} cambio a ${status}.`,
      });
    }

    return formatAppointment(updatedAppointment);
  },
};
