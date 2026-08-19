import { prisma } from "../../config/prisma.js";
import { crearNotificacionSistemaSegura, notificarAdministradoresSeguro } from "../notifications/notifications.service.js";
import { normalizePaymentAmount } from "../payments/payments.service.js";
import { formatQuote } from "./quotes.mapper.js";

const QUOTE_STATUS = {
  SENT: "Enviada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
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

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizePaymentStatus(value) {
  const normalized = normalizeText(value);
  if (normalized.includes("pagado")) return "Pagado";
  if (normalized.includes("fallido")) return "Fallido";
  if (normalized.includes("reembolsado")) return "Reembolsado";
  return "Pendiente";
}

function formatCop(value) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const includeRelations = {
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
  solicitudServicio: {
    include: {
      tipoServicio: true,
      estado: true,
      citas: {
        include: {
          pagos: {
            include: {
              estadoPago: true,
            },
          },
        },
        orderBy: { idCita: "asc" },
      },
    },
  },
  pago: {
    include: {
      estadoPago: true,
    },
  },
};

async function resolvePendingPaymentStatus(db = prisma) {
  const estados = await db.estadoPago.findMany();
  const estado = estados.find(item => normalizePaymentStatus(item.nombreEstadoPago) === "Pendiente");
  if (!estado) throw createError("Estado de pago Pendiente no encontrado.", 400);
  return estado;
}

async function findQuote(id, db = prisma) {
  return db.cotizacion.findUnique({
    where: { idCotizacion: Number(id) },
    include: includeRelations,
  });
}

function getAssignedAppointment(service) {
  return service?.citas?.find(cita => cita.idUsuarioTecnico) || service?.citas?.[0] || null;
}

function hasActivePayment(service) {
  return (service?.citas || []).some(cita => (cita.pagos || []).some(payment => {
    const status = normalizePaymentStatus(payment.estadoPago?.nombreEstadoPago);
    return status === "Pendiente" || status === "Pagado";
  }));
}

function canViewQuote(authUser, quote) {
  return isAdmin(authUser)
    || (isTechnician(authUser) && quote.idUsuarioTecnico === authUser.id)
    || (isUser(authUser) && quote.idUsuarioCliente === authUser.id);
}

function buildWhereByRole(authUser) {
  if (isAdmin(authUser)) return {};
  if (isTechnician(authUser)) return { idUsuarioTecnico: authUser.id };
  if (isUser(authUser)) return { idUsuarioCliente: authUser.id };
  return { idCotizacion: -1 };
}

export const quotesService = {
  async create(authUser, payload = {}) {
    assertAllowed(isTechnician(authUser), "Solo el tecnico puede crear cotizaciones.");

    const serviceId = Number(payload.serviceId || payload.solicitudServicioId || payload.idSolicitudServicio);
    if (!serviceId) throw createError("El servicio es obligatorio.", 400);
    const amount = normalizePaymentAmount(payload.monto ?? payload.amount);
    const descripcion = String(payload.descripcion || payload.description || "").trim();
    if (descripcion.length > 1000) throw createError("La descripcion de la cotizacion no puede superar 1000 caracteres.", 400);

    const service = await prisma.solicitudServicio.findUnique({
      where: { idSolicitudServicio: serviceId },
      include: {
        usuario: true,
        tipoServicio: true,
        citas: {
          include: {
            pagos: { include: { estadoPago: true } },
          },
          orderBy: { idCita: "asc" },
        },
        cotizacion: true,
      },
    });

    if (!service) throw createError("Servicio no encontrado.", 404);
    const assignedAppointment = getAssignedAppointment(service);
    if (!assignedAppointment || assignedAppointment.idUsuarioTecnico !== authUser.id) {
      throw createError("Solo puedes cotizar servicios asignados a ti.", 403);
    }
    if (!service.idUsuario) throw createError("El servicio no tiene usuario cliente asociado.", 400);
    if (hasActivePayment(service)) throw createError("El servicio ya tiene un pago pendiente o pagado.", 409);
    if (service.cotizacion) throw createError("El servicio ya tiene una cotizacion registrada.", 409);

    const quote = await prisma.cotizacion.create({
      data: {
        idSolicitudServicio: service.idSolicitudServicio,
        idUsuarioCliente: service.idUsuario,
        idUsuarioTecnico: authUser.id,
        monto: amount,
        descripcion: descripcion || null,
        estado: QUOTE_STATUS.SENT,
      },
      include: includeRelations,
    });

    await crearNotificacionSistemaSegura({
      idUsuario: quote.idUsuarioCliente,
      tipo: "pago",
      titulo: "Nueva cotizacion recibida",
      mensaje: `El tecnico envio una cotizacion para el servicio #${quote.idSolicitudServicio} por $${formatCop(quote.monto)} COP.`,
      evento: "cotizacion_enviada",
      referenciaTipo: "cotizacion",
      referenciaId: quote.idCotizacion,
    });

    return formatQuote(quote);
  },

  async list(authUser) {
    assertAllowed(isAdmin(authUser) || isTechnician(authUser) || isUser(authUser), "No puedes consultar cotizaciones.");

    const quotes = await prisma.cotizacion.findMany({
      where: buildWhereByRole(authUser),
      include: includeRelations,
      orderBy: { idCotizacion: "asc" },
    });

    return quotes.map(formatQuote);
  },

  async getById(authUser, id) {
    const quote = await findQuote(id);
    if (!quote) throw createError("Cotizacion no encontrada.", 404);
    assertAllowed(canViewQuote(authUser, quote), "No puedes ver esta cotizacion.");
    return formatQuote(quote);
  },

  async approve(authUser, id) {
    assertAllowed(isUser(authUser), "Solo el usuario propietario puede aprobar cotizaciones.");

    const quote = await findQuote(id);
    if (!quote) throw createError("Cotizacion no encontrada.", 404);
    assertAllowed(quote.idUsuarioCliente === authUser.id, "Solo puedes aprobar tus cotizaciones.", 403);
    if (quote.estado !== QUOTE_STATUS.SENT) throw createError("La cotizacion no esta pendiente de aprobacion.", 409);
    if (quote.idPago) throw createError("La cotizacion ya tiene un pago asociado.", 409);

    const assignedAppointment = getAssignedAppointment(quote.solicitudServicio);
    if (!assignedAppointment?.idCita) {
      throw createError("El servicio debe tener una cita/asignacion tecnica antes de generar pago.", 400);
    }
    if (assignedAppointment.idUsuarioCliente !== authUser.id) {
      throw createError("La cita no pertenece al usuario de la cotizacion.", 403);
    }

    const updatedQuote = await prisma.$transaction(async tx => {
      const freshQuote = await tx.cotizacion.findUnique({
        where: { idCotizacion: quote.idCotizacion },
        include: includeRelations,
      });
      if (!freshQuote || freshQuote.estado !== QUOTE_STATUS.SENT || freshQuote.idPago) {
        throw createError("La cotizacion ya fue procesada.", 409);
      }

      const freshAppointment = getAssignedAppointment(freshQuote.solicitudServicio);
      const existingPayment = await tx.pago.findFirst({
        where: {
          idCita: freshAppointment.idCita,
          estadoPago: {
            nombreEstadoPago: {
              in: ["Pendiente", "Pagado"],
            },
          },
        },
      });
      if (existingPayment) throw createError("El servicio ya tiene un pago pendiente o pagado.", 409);

      const estadoPendiente = await resolvePendingPaymentStatus(tx);
      const payment = await tx.pago.create({
        data: {
          idCita: freshAppointment.idCita,
          idUsuario: freshQuote.idUsuarioCliente,
          monto: freshQuote.monto,
          idEstadoPago: estadoPendiente.idEstadoPago,
          idMedioPago: null,
          fechaPago: null,
        },
      });

      await tx.cotizacion.update({
        where: { idCotizacion: freshQuote.idCotizacion },
        data: {
          estado: QUOTE_STATUS.APPROVED,
          idPago: payment.idPago,
          fechaRespuesta: new Date(),
        },
      });

      return tx.cotizacion.findUnique({
        where: { idCotizacion: freshQuote.idCotizacion },
        include: includeRelations,
      });
    });

    await crearNotificacionSistemaSegura({
      idUsuario: updatedQuote.idUsuarioTecnico,
      tipo: "pago",
      titulo: "Cotizacion aprobada",
      mensaje: `El usuario aprobo la cotizacion del servicio #${updatedQuote.idSolicitudServicio}.`,
      evento: "cotizacion_aprobada_tecnico",
      referenciaTipo: "cotizacion",
      referenciaId: updatedQuote.idCotizacion,
    });

    await notificarAdministradoresSeguro({
      tipo: "pago",
      titulo: "Cotizacion aprobada",
      mensaje: `Se genero un pago pendiente para el servicio #${updatedQuote.idSolicitudServicio} desde la cotizacion #${updatedQuote.idCotizacion}.`,
      evento: "cotizacion_aprobada_admin",
      referenciaTipo: "cotizacion",
      referenciaId: updatedQuote.idCotizacion,
    });

    return formatQuote(updatedQuote);
  },

  async reject(authUser, id, payload = {}) {
    assertAllowed(isUser(authUser), "Solo el usuario propietario puede rechazar cotizaciones.");

    const quote = await findQuote(id);
    if (!quote) throw createError("Cotizacion no encontrada.", 404);
    assertAllowed(quote.idUsuarioCliente === authUser.id, "Solo puedes rechazar tus cotizaciones.", 403);
    if (quote.estado !== QUOTE_STATUS.SENT) throw createError("La cotizacion no esta pendiente de respuesta.", 409);

    const motivo = String(payload.motivo || payload.reason || "").trim();
    const updatedQuote = await prisma.cotizacion.update({
      where: { idCotizacion: quote.idCotizacion },
      data: {
        estado: QUOTE_STATUS.REJECTED,
        fechaRespuesta: new Date(),
        descripcion: motivo ? `${quote.descripcion || ""}${quote.descripcion ? "\n\n" : ""}Motivo rechazo: ${motivo}` : quote.descripcion,
      },
      include: includeRelations,
    });

    await crearNotificacionSistemaSegura({
      idUsuario: updatedQuote.idUsuarioTecnico,
      tipo: "pago",
      titulo: "Cotizacion rechazada",
      mensaje: `El usuario rechazo la cotizacion del servicio #${updatedQuote.idSolicitudServicio}.`,
      evento: "cotizacion_rechazada_tecnico",
      referenciaTipo: "cotizacion",
      referenciaId: updatedQuote.idCotizacion,
    });

    await notificarAdministradoresSeguro({
      tipo: "pago",
      titulo: "Cotizacion rechazada",
      mensaje: `El usuario rechazo la cotizacion #${updatedQuote.idCotizacion} del servicio #${updatedQuote.idSolicitudServicio}.`,
      evento: "cotizacion_rechazada_admin",
      referenciaTipo: "cotizacion",
      referenciaId: updatedQuote.idCotizacion,
    });

    return formatQuote(updatedQuote);
  },
};
