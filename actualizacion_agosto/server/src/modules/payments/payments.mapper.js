export const PLATFORM_COMMISSION_RATE = 0.25;

function toNumber(value) {
  return Number(value || 0);
}

export function formatCopAmount(amount) {
  const value = Math.round(toNumber(amount));
  return `$${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} COP`;
}

function formatUser(user) {
  if (!user) return null;

  return {
    id: user.idUsuario,
    name: `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim(),
    email: user.correo,
    telefono: user.telefono,
  };
}

function normalizeRole(userOrOptions) {
  return userOrOptions?.role || userOrOptions?.authUser?.role || userOrOptions?.visibility || null;
}

function normalizePaymentStatus(nombreEstadoPago) {
  const normalized = String(nombreEstadoPago || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("pagado")) return "Pagado";
  if (normalized.includes("fallido")) return "Fallido";
  if (normalized.includes("reembolsado")) return "Reembolsado";
  return "Pendiente";
}

function normalizeServiceStatus(nombreEstado) {
  const normalized = String(nombreEstado || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "finalizado" || normalized === "completado") return "Completado";
  if (normalized === "cancelado") return "Cancelado";
  return "Pendiente";
}

function normalizeAppointmentStatus(cita) {
  const normalized = String(cita?.estado?.nombreEstado || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "finalizado") return "Completada";
  if (normalized === "cancelado") return "Cancelada";
  if (cita?.confirmada) return "Programada";
  return "Pendiente";
}

function formatTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  return String(value).slice(0, 5);
}

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function formatService(service) {
  if (!service) return null;
  const status = normalizeServiceStatus(service.estado?.nombreEstado);

  return {
    id: service.idSolicitudServicio,
    description: service.descripcionProblema,
    descripcion: service.descripcionProblema,
    serviceType: service.tipoServicio?.nombreServicio || "Pendiente por clasificar",
    tipo: service.tipoServicio?.nombreServicio || "Pendiente por clasificar",
    status,
    estado: status,
    estadoCatalogo: service.estado?.nombreEstado || null,
  };
}

function formatAppointment(cita) {
  if (!cita) return null;

  return {
    id: cita.idCita,
    serviceId: cita.idSolicitudServicio,
    servicioId: cita.idSolicitudServicio,
    userId: cita.idUsuarioCliente,
    usuarioId: cita.idUsuarioCliente,
    technicianId: cita.idUsuarioTecnico,
    tecnicoId: cita.idUsuarioTecnico,
    fecha: formatDate(cita.fecha),
    hora: formatTime(cita.hora),
    estado: normalizeAppointmentStatus(cita),
    status: normalizeAppointmentStatus(cita),
    confirmada: cita.confirmada,
  };
}

export function calculatePlatformCommission(amount) {
  return Math.round(toNumber(amount) * PLATFORM_COMMISSION_RATE);
}

export function calculateTechnicianEarnings(amount, platformCommission) {
  return toNumber(amount) - toNumber(platformCommission);
}

export function formatPayment(payment, options = {}) {
  const amount = toNumber(payment.monto);
  const platformCommission = calculatePlatformCommission(amount);
  const technicianEarnings = calculateTechnicianEarnings(amount, platformCommission);
  const status = normalizePaymentStatus(payment.estadoPago?.nombreEstadoPago);
  const cita = payment.cita;
  const service = cita?.solicitudServicio;
  const serviceStatus = normalizeServiceStatus(service?.estado?.nombreEstado);
  const serviceCompleted = serviceStatus === "Completado";
  const canPay = status === "Pendiente" && amount > 0 && serviceCompleted;
  const paymentBlockedReason = status === "Pendiente" && amount > 0 && !serviceCompleted
    ? "El pago estara disponible cuando el tecnico marque el servicio como completado."
    : null;
  const medioPagoUsuario = payment.medioPago?.nombreMedioPago || null;
  const verificacion = payment.verificacionPago || null;
  const medioPagoTecnico = verificacion?.medioPagoTecnico?.nombreMedioPago || null;
  const usuario = payment.usuario || cita?.cliente || null;
  const tecnico = cita?.tecnico || null;
  const role = normalizeRole(options);
  const isAdmin = role === "admin";
  const isTechnician = role === "tecnico";
  const verificationConfirmed = Boolean(verificacion?.fechaConfirmacion);
  const verificationStatus = verificationConfirmed
    ? verificacion.requiereRevision
      ? "Confirmado con observacion"
      : "Confirmado"
    : "Pendiente";

  const formatted = {
    id: payment.idPago,
    appointmentId: payment.idCita,
    citaId: payment.idCita,
    serviceId: cita?.idSolicitudServicio || null,
    solicitudId: cita?.idSolicitudServicio || null,
    userId: payment.idUsuario || cita?.idUsuarioCliente || null,
    usuarioId: payment.idUsuario || cita?.idUsuarioCliente || null,
    technicianId: cita?.idUsuarioTecnico || null,
    tecnicoId: cita?.idUsuarioTecnico || null,
    amount,
    monto: amount,
    currency: "COP",
    moneda: "COP",
    formattedAmount: formatCopAmount(amount),
    montoFormateado: formatCopAmount(amount),
    status,
    estado: status,
    serviceStatus,
    estadoServicio: serviceStatus,
    canPay,
    puedePagar: canPay,
    paymentBlockedReason,
    motivoBloqueoPago: paymentBlockedReason,
    estadoPagoCatalogo: payment.estadoPago?.nombreEstadoPago || null,
    paymentMethod: medioPagoUsuario,
    method: medioPagoUsuario,
    medioPago: medioPagoUsuario,
    medioPagoUsuario,
    userPaymentMethod: medioPagoUsuario,
    idMedioPago: payment.idMedioPago,
    paidAt: payment.fechaPago,
    fechaPago: payment.fechaPago,
    createdAt: payment.fechaPago,
    receiptDetail: payment.detalleComprobante,
    detalleComprobante: payment.detalleComprobante,
    reference: payment.detalleComprobante,
    platformCommission,
    comisionPlataforma: platformCommission,
    formattedPlatformCommission: formatCopAmount(platformCommission),
    comisionPlataformaFormateada: formatCopAmount(platformCommission),
    technicianEarnings,
    gananciaTecnico: technicianEarnings,
    formattedTechnicianEarnings: formatCopAmount(technicianEarnings),
    gananciaTecnicoFormateada: formatCopAmount(technicianEarnings),
    confirmedByTechnician: verificationConfirmed,
    verificacionTecnica: verificationStatus,
    technicianVerificationStatus: verificationStatus,
    fechaConfirmacionTecnico: verificacion?.fechaConfirmacion || null,
    technicianConfirmedAt: verificacion?.fechaConfirmacion || null,
    usuario: formatUser(usuario),
    client: formatUser(usuario),
    tecnico: formatUser(tecnico),
    technician: formatUser(tecnico),
    cita: formatAppointment(cita),
    appointment: formatAppointment(cita),
    servicio: formatService(service),
    service: formatService(service),
  };

  if (isAdmin || isTechnician) {
    formatted.medioPagoTecnico = medioPagoTecnico;
    formatted.technicianPaymentMethod = medioPagoTecnico;
    formatted.metodosCoinciden = verificacion?.metodosCoinciden ?? null;
    formatted.paymentMethodsMatch = verificacion?.metodosCoinciden ?? null;
    formatted.cantidadIntentosConfirmacion = verificacion?.cantidadIntentos || 0;
    formatted.technicianConfirmationAttempts = verificacion?.cantidadIntentos || 0;
    formatted.requiereRevisionAdministrador = Boolean(verificacion?.requiereRevision);
    formatted.requiresAdminReview = Boolean(verificacion?.requiereRevision);
    formatted.observacionAdministrador = verificacion?.observacion || null;
    formatted.adminObservation = verificacion?.observacion || null;
  }

  return formatted;
}
