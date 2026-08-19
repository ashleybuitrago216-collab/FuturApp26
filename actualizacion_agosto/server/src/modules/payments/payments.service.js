import { prisma } from "../../config/prisma.js";
import { crearNotificacionSistemaSegura, notificarAdministradoresSeguro } from "../notifications/notifications.service.js";
import { formatPayment } from "./payments.mapper.js";

const SUCCESS_STATUSES = new Set(["Pagado"]);
const PAYMENT_AMOUNT_KEYS = ["amount", "monto", "serviceAmount", "montoServicio", "valorServicio", "total"];
const MIN_SERVICE_AMOUNT_COP = 10000;
const MAX_SERVICE_AMOUNT_COP = 50000000;
const TECHNICIAN_MISMATCH_ATTEMPTS_BEFORE_OBSERVATION = 2;
const SIMULATED_PAYMENT_METHODS = new Map([
  ["efectivo", "Efectivo"],
  ["pago en efectivo", "Efectivo"],
  ["nequi", "Nequi"],
  ["daviplata", "DaviPlata"],
  ["davi plata", "DaviPlata"],
  ["bancolombia", "Bancolombia"],
  ["transferencia bancaria", "Transferencia Bancaria"],
  ["transferencia", "Transferencia Bancaria"],
  ["tarjeta", "Tarjeta"],
  ["tarjeta de credito", "Tarjeta"],
  ["tarjeta de crédito", "Tarjeta"],
  ["pse", "PSE"],
]);

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

function createDetailedError(message, statusCode, payload = {}) {
  const error = createError(message, statusCode);
  error.payload = payload;
  error.code = payload.code;
  error.responseStatus = payload.status;
  return error;
}

function assertAllowed(condition, message = "No autorizado.") {
  if (!condition) throw createError(message, 403);
}

function assertFound(entity, message = "Pago no encontrado.") {
  if (!entity) throw createError(message, 404);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getUserDisplayName(user) {
  return `${user?.nombre || ""}${user?.apellido ? ` ${user.apellido}` : ""}`.trim() || user?.correo || `usuario #${user?.idUsuario}`;
}

function formatCop(value) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizePaymentMethodName(value) {
  const normalized = normalizeText(value);
  if (normalized === "davi plata") return "daviplata";
  if (normalized.includes("efectivo")) return "efectivo";
  if (normalized === "tarjeta de credito") return "tarjeta";
  if (normalized === "tarjeta de debito") return "tarjeta";
  return normalized;
}

function normalizeApiPaymentStatus(nombreEstadoPago) {
  const normalized = normalizeText(nombreEstadoPago);

  if (normalized.includes("pagado")) return "Pagado";
  if (normalized.includes("fallido")) return "Fallido";
  if (normalized.includes("reembolsado")) return "Reembolsado";
  return "Pendiente";
}

function isCompletedService(service) {
  const normalized = normalizeText(service?.estado?.nombreEstado);
  return normalized === "finalizado" || normalized === "completado";
}

export function hasPaymentAmount(payload = {}) {
  return PAYMENT_AMOUNT_KEYS.some(key => Object.prototype.hasOwnProperty.call(payload, key));
}

function getPaymentAmountFromPayload(payload = {}) {
  for (const key of PAYMENT_AMOUNT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) return payload[key];
  }

  return undefined;
}

export function normalizePaymentAmount(value) {
  let normalizedValue = value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      normalizedValue = trimmed;
    } else if (/^\d{1,3}(?:\.\d{3})+$/.test(trimmed)) {
      normalizedValue = trimmed.replace(/\./g, "");
    } else {
      throw createError("Monto invalido. Usa un numero entero en pesos colombianos.", 400);
    }
  }

  const amount = Number(normalizedValue);
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    throw createError("Monto invalido. Usa un numero entero en pesos colombianos.", 400);
  }

  if (amount <= 0) throw createError("El monto debe ser mayor que 0.", 400);
  if (amount < MIN_SERVICE_AMOUNT_COP) {
    throw createError(`El monto minimo es ${MIN_SERVICE_AMOUNT_COP} COP.`, 400);
  }
  if (amount > MAX_SERVICE_AMOUNT_COP) {
    throw createError(`El monto maximo es ${MAX_SERVICE_AMOUNT_COP} COP.`, 400);
  }

  return amount;
}

export function getPaymentAmountIfPresent(payload = {}) {
  if (!hasPaymentAmount(payload)) return undefined;
  return normalizePaymentAmount(getPaymentAmountFromPayload(payload));
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
  medioPago: true,
  estadoPago: true,
  verificacionPago: {
    include: {
      medioPagoTecnico: true,
      usuarioTecnico: {
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
        },
      },
    },
  },
  cita: {
    include: {
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
      solicitudServicio: {
        include: {
          tipoServicio: true,
          estado: true,
        },
      },
    },
  },
};

function getWhereByRole(authUser) {
  if (isAdmin(authUser)) return {};
  if (isTechnician(authUser)) return { cita: { idUsuarioTecnico: authUser.id } };

  return {
    OR: [
      { idUsuario: authUser.id },
      { cita: { idUsuarioCliente: authUser.id } },
    ],
  };
}

function canViewPayment(authUser, payment) {
  return isAdmin(authUser)
    || (isTechnician(authUser) && payment.cita?.idUsuarioTecnico === authUser.id)
    || (isUser(authUser) && (payment.idUsuario === authUser.id || payment.cita?.idUsuarioCliente === authUser.id));
}

async function findPayment(id, db = prisma) {
  return db.pago.findUnique({
    where: { idPago: Number(id) },
    include: includeRelations,
  });
}

async function assertNoPendingQuotePaymentBlock(authUser, payload = {}) {
  const serviceId = payload.serviceId || payload.servicioId || payload.idSolicitudServicio || payload.solicitudServicioId;
  if (!serviceId) return;

  const quote = await prisma.cotizacion.findUnique({
    where: { idSolicitudServicio: Number(serviceId) },
  });
  if (!quote || quote.idUsuarioCliente !== authUser.id) return;

  if (quote.estado === "Enviada") {
    throw createError("Debes aprobar la cotizacion antes de pagar.", 400);
  }
  if (quote.estado === "Rechazada") {
    throw createError("No puedes pagar una cotizacion rechazada.", 400);
  }
}

async function assertApprovedQuoteForPayment(payment) {
  const quote = await prisma.cotizacion.findUnique({
    where: { idPago: payment.idPago },
  });
  if (!quote) return;

  if (quote.estado !== "Aprobada") {
    throw createError("Debes aprobar la cotizacion antes de pagar.", 400);
  }
}

function assertPaymentServiceCompleted(payment) {
  if (!isCompletedService(payment.cita?.solicitudServicio)) {
    throw createError("El pago estara disponible cuando el tecnico marque el servicio como completado.", 400);
  }
}

async function resolveEstadoPago(name, db = prisma) {
  const estados = await db.estadoPago.findMany();
  const estado = estados.find(item => normalizeApiPaymentStatus(item.nombreEstadoPago) === name);

  if (!estado) throw createError(`Estado de pago no encontrado en catalogo: ${name}.`, 400);
  return estado;
}

function pickPaymentToUpdate(payments) {
  const sortedPayments = [...payments].sort((a, b) => a.idPago - b.idPago);
  return sortedPayments.find(payment => normalizeApiPaymentStatus(payment.estadoPago?.nombreEstadoPago) === "Pendiente")
    || sortedPayments.find(payment => normalizeApiPaymentStatus(payment.estadoPago?.nombreEstadoPago) === "Fallido")
    || sortedPayments[0]
    || null;
}

async function resolveMedioPago(payload, db = prisma) {
  const id = payload.idMedioPago ?? payload.id_medio_pago;
  if (id != null && id !== "") {
    const medio = await db.medioPago.findUnique({ where: { idMedioPago: Number(id) } });
    if (!medio) throw createError("Medio de pago no encontrado.", 400);
    return medio;
  }

  const requestedName = payload.paymentMethod || payload.metodoPago || payload.medioPago || payload.method;
  if (!requestedName) throw createError("Medio de pago requerido.", 400);

  const medios = await db.medioPago.findMany();
  const normalizedRequested = normalizePaymentMethodName(requestedName);
  const medio = medios.find(item => {
    const normalized = normalizePaymentMethodName(item.nombreMedioPago);
    return normalized === normalizedRequested
      || (normalizedRequested === "efectivo" && normalized.includes("efectivo"));
  });

  if (medio) return medio;

  const simulatedMethodName = SIMULATED_PAYMENT_METHODS.get(normalizedRequested);
  if (simulatedMethodName) {
    return db.medioPago.create({
      data: { nombreMedioPago: simulatedMethodName },
    });
  }

  throw createError(`Medio de pago no encontrado en catalogo: ${requestedName}.`, 400);
}

function buildReceiptDetail(payload, fallbackPrefix) {
  const detail = payload.receiptDetail || payload.detalleComprobante || payload.reference || payload.referencia;
  if (detail) return String(detail);
  return `${fallbackPrefix}: ${new Date().toISOString()}`;
}

function summarize(payments) {
  const paid = payments.filter(payment => SUCCESS_STATUSES.has(payment.status));
  const pending = payments.filter(payment => payment.status === "Pendiente");
  const failed = payments.filter(payment => payment.status === "Fallido");
  const refunded = payments.filter(payment => payment.status === "Reembolsado");
  const totalAmount = payments.reduce((total, payment) => total + payment.amount, 0);
  const paidAmount = paid.reduce((total, payment) => total + payment.amount, 0);
  const pendingAmount = pending.reduce((total, payment) => total + payment.amount, 0);
  const totalCommissions = payments.reduce((total, payment) => total + payment.platformCommission, 0);
  const paidCommissions = paid.reduce((total, payment) => total + payment.platformCommission, 0);
  const technicianEarnings = payments.reduce((total, payment) => total + payment.technicianEarnings, 0);
  const paidTechnicianEarnings = paid.reduce((total, payment) => total + payment.technicianEarnings, 0);

  return {
    totalTransactions: payments.length,
    totalPayments: payments.length,
    paidPayments: paid.length,
    pendingPayments: pending.length,
    failedPayments: failed.length,
    refundedPayments: refunded.length,
    totalAmount,
    totalRevenue: paidAmount,
    paidAmount,
    pendingAmount,
    totalCommissions,
    totalPlatformCommission: totalCommissions,
    paidCommissions,
    paidPlatformCommission: paidCommissions,
    technicianEarnings,
    totalTechnicianEarnings: technicianEarnings,
    paidTechnicianEarnings,
    successRate: payments.length ? (paid.length / payments.length) * 100 : 0,
  };
}

export const paymentsService = {
  async ensurePendingPaymentForAppointment({ citaId, amount, adminUserId, db = prisma }) {
    if (!adminUserId) throw createError("Admin requerido para definir monto.", 403);

    const monto = normalizePaymentAmount(amount);
    const cita = await db.cita.findUnique({
      where: { idCita: Number(citaId) },
      include: {
        cliente: true,
        tecnico: true,
        solicitudServicio: true,
        pagos: {
          include: {
            estadoPago: true,
            verificacionPago: true,
          },
          orderBy: { idPago: "asc" },
        },
      },
    });

    if (!cita) throw createError("Cita no encontrada para crear pago.", 404);
    if (!cita.idUsuarioCliente) throw createError("La cita no tiene cliente asociado.", 400);
    if (!cita.idUsuarioTecnico) throw createError("La cita no tiene tecnico asociado.", 400);

    const estadoPendiente = await resolveEstadoPago("Pendiente", db);
    const existingPayment = pickPaymentToUpdate(cita.pagos || []);

    if (existingPayment) {
      const currentStatus = normalizeApiPaymentStatus(existingPayment.estadoPago?.nombreEstadoPago);

      if (currentStatus === "Pagado") {
        throw createError("No se puede modificar el monto de un pago ya pagado.", 400);
      }
      if (existingPayment.verificacionPago?.fechaConfirmacion) {
        throw createError("No se puede modificar el monto de un pago confirmado por tecnico.", 400);
      }
      if (currentStatus === "Reembolsado") {
        throw createError("No se puede modificar el monto de un pago reembolsado.", 400);
      }

      const updated = await db.pago.update({
        where: { idPago: existingPayment.idPago },
        data: {
          monto,
          idUsuario: cita.idUsuarioCliente,
          idEstadoPago: estadoPendiente.idEstadoPago,
          fechaPago: null,
        },
        include: includeRelations,
      });

      return formatPayment(updated, { role: "admin" });
    }

    const created = await db.pago.create({
      data: {
        idCita: cita.idCita,
        idUsuario: cita.idUsuarioCliente,
        monto,
        idEstadoPago: estadoPendiente.idEstadoPago,
        idMedioPago: null,
        fechaPago: null,
      },
      include: includeRelations,
    });

    return formatPayment(created, { role: "admin" });
  },

  async list(authUser) {
    const payments = await prisma.pago.findMany({
      where: getWhereByRole(authUser),
      include: includeRelations,
      orderBy: { idPago: "asc" },
    });

    return payments.map(payment => formatPayment(payment, authUser));
  },

  async summary(authUser) {
    const payments = await this.list(authUser);
    const baseSummary = summarize(payments);

    if (isAdmin(authUser)) {
      return baseSummary;
    }

    if (isTechnician(authUser)) {
      return {
        completedServicesWithPayment: payments.filter(payment => payment.servicio?.estado === "Finalizado").length,
        pendingEarnings: payments
          .filter(payment => payment.status === "Pendiente")
          .reduce((total, payment) => total + payment.technicianEarnings, 0),
        confirmedEarnings: payments
          .filter(payment => payment.status === "Pagado")
          .reduce((total, payment) => total + payment.technicianEarnings, 0),
        generatedCommissions: baseSummary.totalCommissions,
        ...baseSummary,
      };
    }

    return {
      totalToPay: baseSummary.pendingAmount,
      pendingPayments: baseSummary.pendingPayments,
      paidPayments: baseSummary.paidPayments,
      spentTotal: baseSummary.paidAmount,
      ...baseSummary,
    };
  },

  async getById(authUser, id) {
    const payment = await findPayment(id);
    assertFound(payment);
    assertAllowed(canViewPayment(authUser, payment), "No puedes ver este pago.");
    return formatPayment(payment, authUser);
  },

  async initiate(authUser, id, payload) {
    assertAllowed(isUser(authUser), "Solo el usuario propietario puede iniciar pagos.");
    if (hasPaymentAmount(payload)) {
      throw createError("El monto del pago no se puede modificar desde la confirmacion de pago.", 400);
    }

    const payment = await findPayment(id);
    if (!payment) {
      await assertNoPendingQuotePaymentBlock(authUser, payload);
    }
    assertFound(payment);
    assertAllowed(canViewPayment(authUser, payment), "No puedes pagar este pago.");

    assertAllowed(
      payment.idUsuario === authUser.id || payment.cita?.idUsuarioCliente === authUser.id,
      "Solo puedes pagar tus pagos.",
    );

    const currentStatus = normalizeApiPaymentStatus(payment.estadoPago?.nombreEstadoPago);
    if (currentStatus !== "Pendiente") {
      throw createError("El pago no esta pendiente.", 400);
    }

    const amount = normalizePaymentAmount(payment.monto);
    if (amount <= 0) {
      throw createError("El pago no tiene un monto valido.", 400);
    }

    await assertApprovedQuoteForPayment(payment);
    assertPaymentServiceCompleted(payment);

    const medioPago = await resolveMedioPago(payload);
    const estadoPagado = await resolveEstadoPago("Pagado");

    await prisma.$transaction(async tx => {
      await tx.pago.update({
        where: { idPago: payment.idPago },
        data: {
          idMedioPago: medioPago.idMedioPago,
          idEstadoPago: estadoPagado.idEstadoPago,
          fechaPago: new Date(),
          detalleComprobante: buildReceiptDetail(payload, "Pago simulado"),
        },
        include: includeRelations,
      });

      await tx.verificacionPago.upsert({
        where: { idPago: payment.idPago },
        update: {},
        create: {
          idPago: payment.idPago,
          cantidadIntentos: 0,
          requiereRevision: false,
        },
      });

    });

    const updated = await findPayment(payment.idPago);

    await crearNotificacionSistemaSegura({
      idUsuario: updated.idUsuario || updated.cita?.idUsuarioCliente,
      tipo: "pago",
      titulo: "Pago registrado",
      mensaje: `El pago #${updated.idPago} fue marcado como Pagado.`,
      evento: "pago_registrado_usuario",
      referenciaTipo: "pago",
      referenciaId: updated.idPago,
    });
    if (updated.cita?.idUsuarioTecnico) {
      await crearNotificacionSistemaSegura({
        idUsuario: updated.cita.idUsuarioTecnico,
        tipo: "pago",
        titulo: "Pago recibido",
        mensaje: `Se registro el pago #${updated.idPago} de una cita asignada a ti.`,
        evento: "pago_recibido_tecnico",
        referenciaTipo: "pago",
        referenciaId: updated.idPago,
      });
    }

    await notificarAdministradoresSeguro({
      tipo: "pago",
      titulo: "Pago realizado",
      mensaje: `El usuario ${getUserDisplayName(updated.usuario || updated.cita?.cliente)} realizo el pago #${updated.idPago} por $${formatCop(updated.monto)} COP mediante ${updated.medioPago?.nombreMedioPago || "medio no especificado"}.`,
      evento: "pago_realizado",
      referenciaTipo: "pago",
      referenciaId: updated.idPago,
    });

    return formatPayment(updated, authUser);
  },

  async confirmTechnician(authUser, id, payload) {
    assertAllowed(isTechnician(authUser), "Solo el tecnico puede confirmar pagos.");
    if (hasPaymentAmount(payload)) {
      throw createError("El monto no se puede modificar desde la confirmacion del tecnico.", 400);
    }

    const payment = await findPayment(id);
    assertFound(payment);

    assertAllowed(payment.cita?.idUsuarioTecnico === authUser.id, "Solo puedes confirmar pagos asociados a ti.");

    const currentStatus = normalizeApiPaymentStatus(payment.estadoPago?.nombreEstadoPago);
    if (currentStatus !== "Pagado") {
      throw createError("El usuario debe realizar el pago simulado antes de la confirmacion tecnica.", 400);
    }
    if (!payment.idMedioPago || !payment.medioPago) {
      throw createError("El pago no tiene medio declarado por el usuario.", 400);
    }

    const medioPago = await resolveMedioPago(payload);
    const userMethod = payment.medioPago.nombreMedioPago;
    const technicianMethod = medioPago.nombreMedioPago;
    const methodsMatch = normalizePaymentMethodName(userMethod) === normalizePaymentMethodName(technicianMethod);
    const now = new Date();
    const existingVerification = payment.verificacionPago;
    const currentAttempts = existingVerification?.cantidadIntentos || 0;
    const nextAttempts = currentAttempts + 1;

    if (!methodsMatch && nextAttempts < TECHNICIAN_MISMATCH_ATTEMPTS_BEFORE_OBSERVATION) {
      await prisma.verificacionPago.upsert({
        where: { idPago: payment.idPago },
        update: {
          idUsuarioTecnico: authUser.id,
          idMedioPagoTecnico: medioPago.idMedioPago,
          cantidadIntentos: nextAttempts,
          metodosCoinciden: false,
          requiereRevision: false,
          fechaPrimerIntento: existingVerification?.fechaPrimerIntento || now,
        },
        create: {
          idPago: payment.idPago,
          idUsuarioTecnico: authUser.id,
          idMedioPagoTecnico: medioPago.idMedioPago,
          cantidadIntentos: nextAttempts,
          metodosCoinciden: false,
          requiereRevision: false,
          fechaPrimerIntento: now,
        },
      });

      throw createDetailedError("El metodo indicado no coincide con el registrado por el usuario. Revisa nuevamente antes de confirmar.", 409, {
        status: "warning",
        code: "PAYMENT_METHOD_MISMATCH",
        declaredByUser: userMethod,
        declaredByTechnician: technicianMethod,
        attempts: nextAttempts,
        remainingAttemptsBeforeObservation: TECHNICIAN_MISMATCH_ATTEMPTS_BEFORE_OBSERVATION - nextAttempts,
      });
    }

    const requiresAdminReview = !methodsMatch;
    const observation = requiresAdminReview
      ? `El usuario reporto ${userMethod} y el tecnico reporto ${technicianMethod}.`
      : null;

    await prisma.verificacionPago.upsert({
      where: { idPago: payment.idPago },
      update: {
        idUsuarioTecnico: authUser.id,
        idMedioPagoTecnico: medioPago.idMedioPago,
        cantidadIntentos: nextAttempts,
        metodosCoinciden: methodsMatch,
        requiereRevision: requiresAdminReview,
        observacion: observation,
        fechaPrimerIntento: existingVerification?.fechaPrimerIntento || now,
        fechaConfirmacion: now,
      },
      create: {
        idPago: payment.idPago,
        idUsuarioTecnico: authUser.id,
        idMedioPagoTecnico: medioPago.idMedioPago,
        cantidadIntentos: nextAttempts,
        metodosCoinciden: methodsMatch,
        requiereRevision: requiresAdminReview,
        observacion: observation,
        fechaPrimerIntento: now,
        fechaConfirmacion: now,
      },
    });

    await crearNotificacionSistemaSegura({
      idUsuario: payment.idUsuario || payment.cita?.idUsuarioCliente,
      tipo: "pago",
      titulo: requiresAdminReview ? "Pago confirmado con observacion" : "Pago confirmado",
      mensaje: requiresAdminReview
        ? `El tecnico confirmo el pago #${payment.idPago} con diferencia de metodo.`
        : `El tecnico confirmo el pago #${payment.idPago}.`,
      evento: requiresAdminReview ? "pago_confirmado_observacion_usuario" : "pago_confirmado_usuario",
      referenciaTipo: "pago",
      referenciaId: payment.idPago,
    });

    if (requiresAdminReview) {
      await notificarAdministradoresSeguro({
        tipo: "pago",
        titulo: "Revision de pago requerida",
        mensaje: `En el pago #${payment.idPago}, el usuario reporto ${userMethod} y el tecnico reporto ${technicianMethod}. El proceso continuo con observacion.`,
        evento: "revision_pago_requerida",
        referenciaTipo: "pago",
        referenciaId: payment.idPago,
      });
    }

    const updated = await findPayment(payment.idPago);
    const formatted = formatPayment(updated, authUser);

    if (requiresAdminReview) {
      return {
        ...formatted,
        status: "confirmed_with_observation",
        code: "PAYMENT_CONFIRMED_WITH_METHOD_MISMATCH",
        message: "La confirmacion continuo, pero el metodo no coincide. Se genero una observacion para revision del administrador.",
        declaredByUser: userMethod,
        declaredByTechnician: technicianMethod,
        attempts: nextAttempts,
        requiresAdminReview: true,
      };
    }

    return {
      ...formatted,
      status: "confirmed",
      code: "PAYMENT_CONFIRMED",
      message: "Pago confirmado correctamente.",
      declaredByUser: userMethod,
      declaredByTechnician: technicianMethod,
      attempts: nextAttempts,
      requiresAdminReview: false,
    };
  },
};
