function toNumber(value) {
  if (value == null) return null;
  return Number(value);
}

function formatUser(user) {
  if (!user) return null;

  return {
    id: user.idUsuario,
    name: `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim(),
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.correo,
    correo: user.correo,
    telefono: user.telefono,
  };
}

function formatPayment(payment) {
  if (!payment) return null;

  return {
    id: payment.idPago,
    paymentId: payment.idPago,
    citaId: payment.idCita,
    appointmentId: payment.idCita,
    monto: toNumber(payment.monto),
    amount: toNumber(payment.monto),
    estado: payment.estadoPago?.nombreEstadoPago || null,
    status: payment.estadoPago?.nombreEstadoPago || null,
  };
}

function formatService(service) {
  if (!service) return null;

  return {
    id: service.idSolicitudServicio,
    serviceId: service.idSolicitudServicio,
    userId: service.idUsuario,
    usuarioId: service.idUsuario,
    type: service.tipoServicio?.nombreServicio || null,
    tipo: service.tipoServicio?.nombreServicio || null,
    description: service.descripcionProblema,
    descripcion: service.descripcionProblema,
  };
}

export function formatQuote(quote) {
  if (!quote) return null;

  return {
    id: quote.idCotizacion,
    quoteId: quote.idCotizacion,
    idCotizacion: quote.idCotizacion,
    serviceId: quote.idSolicitudServicio,
    solicitudServicioId: quote.idSolicitudServicio,
    userId: quote.idUsuarioCliente,
    usuarioId: quote.idUsuarioCliente,
    technicianId: quote.idUsuarioTecnico,
    tecnicoId: quote.idUsuarioTecnico,
    paymentId: quote.idPago,
    pagoId: quote.idPago,
    amount: toNumber(quote.monto),
    monto: toNumber(quote.monto),
    description: quote.descripcion,
    descripcion: quote.descripcion,
    status: quote.estado,
    estado: quote.estado,
    createdAt: quote.fechaCreacion,
    fechaCreacion: quote.fechaCreacion,
    respondedAt: quote.fechaRespuesta,
    fechaRespuesta: quote.fechaRespuesta,
    updatedAt: quote.fechaActualizacion,
    fechaActualizacion: quote.fechaActualizacion,
    client: formatUser(quote.cliente),
    usuario: formatUser(quote.cliente),
    technician: formatUser(quote.tecnico),
    tecnico: formatUser(quote.tecnico),
    service: formatService(quote.solicitudServicio),
    servicio: formatService(quote.solicitudServicio),
    payment: formatPayment(quote.pago),
    pago: formatPayment(quote.pago),
  };
}
