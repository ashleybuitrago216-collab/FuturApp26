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

function normalizeApiStatus(nombreEstado) {
  const value = String(nombreEstado || "").trim().toLowerCase();

  if (value === "finalizado" || value === "completado") return "Completado";
  if (value === "cancelado") return "Cancelado";
  return "Pendiente";
}

function normalizePaymentStatus(nombreEstadoPago) {
  const value = String(nombreEstadoPago || "").trim().toLowerCase();

  if (value.includes("pagado")) return "Pagado";
  if (value.includes("fallido")) return "Fallido";
  if (value.includes("reembolsado")) return "Reembolsado";
  return "Pendiente";
}

function formatQuote(quote) {
  if (!quote) return null;

  return {
    id: quote.idCotizacion,
    quoteId: quote.idCotizacion,
    idCotizacion: quote.idCotizacion,
    amount: toNumber(quote.monto),
    monto: toNumber(quote.monto),
    description: quote.descripcion,
    descripcion: quote.descripcion,
    status: quote.estado,
    estado: quote.estado,
    paymentId: quote.idPago,
    pagoId: quote.idPago,
    createdAt: quote.fechaCreacion,
    fechaCreacion: quote.fechaCreacion,
    respondedAt: quote.fechaRespuesta,
    fechaRespuesta: quote.fechaRespuesta,
  };
}

function formatServiceLocation(location) {
  if (!location) return null;

  return {
    id: location.idUbicacionServicio,
    serviceId: location.idSolicitudServicio,
    solicitudServicioId: location.idSolicitudServicio,
    latitude: toNumber(location.latitud),
    latitud: toNumber(location.latitud),
    longitude: toNumber(location.longitud),
    longitud: toNumber(location.longitud),
    addressReference: location.direccionReferencia,
    direccionReferencia: location.direccionReferencia,
    source: location.fuente,
    fuente: location.fuente,
    createdAt: location.fechaCreacion,
    fechaCreacion: location.fechaCreacion,
    updatedAt: location.fechaActualizacion,
    fechaActualizacion: location.fechaActualizacion,
  };
}

function formatTechnicianLocation(location) {
  if (!location) return null;

  return {
    id: location.idUbicacionTecnico,
    serviceId: location.idSolicitudServicio,
    solicitudServicioId: location.idSolicitudServicio,
    technicianId: location.idUsuario,
    tecnicoId: location.idUsuario,
    latitude: toNumber(location.latitud),
    latitud: toNumber(location.latitud),
    longitude: toNumber(location.longitud),
    longitud: toNumber(location.longitud),
    accuracyMeters: toNumber(location.precisionMetros),
    precisionMetros: toNumber(location.precisionMetros),
    source: location.fuente,
    fuente: location.fuente,
    createdAt: location.fechaRegistro,
    fechaRegistro: location.fechaRegistro,
  };
}

export function formatService(service) {
  const assignedAppointment = service.citas?.find(cita => cita.idUsuarioTecnico) || service.citas?.[0] || null;
  const tecnico = formatUser(assignedAppointment?.tecnico);
  const tipo = service.tipoServicio?.nombreServicio || "Pendiente por clasificar";
  const prioridad = service.prioridad?.nombrePrioridad || "Media";
  const estado = normalizeApiStatus(service.estado?.nombreEstado);
  const value = service.tipoServicio?.costo == null ? null : Number(service.tipoServicio.costo);
  const quote = service.cotizacion || null;
  const payment = quote?.pago || assignedAppointment?.pagos?.find(item => normalizePaymentStatus(item.estadoPago?.nombreEstadoPago) === "Pendiente")
    || assignedAppointment?.pagos?.find(item => normalizePaymentStatus(item.estadoPago?.nombreEstadoPago) === "Pagado")
    || assignedAppointment?.pagos?.[0]
    || null;
  const quoteStatus = quote ? `Cotizacion ${String(quote.estado || "").toLowerCase()}` : "Sin cotizacion";
  const paymentStatus = payment ? normalizePaymentStatus(payment.estadoPago?.nombreEstadoPago) : "Sin pago";
  const latestTechnicianLocation = service.ubicacionesTecnico?.[0] || null;
  const isCompleted = estado === "Completado";
  const isCanceled = estado === "Cancelado";
  const canPay = Boolean(payment && paymentStatus === "Pendiente" && isCompleted && quote?.estado === "Aprobada");
  const paymentBlockedReason = payment && paymentStatus === "Pendiente" && !isCompleted
    ? "El pago estara disponible cuando el tecnico marque el servicio como completado."
    : null;

  return {
    id: service.idSolicitudServicio,
    serviceId: service.idSolicitudServicio,
    solicitudId: service.idSolicitudServicio,
    userId: service.idUsuario,
    usuarioId: service.idUsuario,
    technicianId: assignedAppointment?.idUsuarioTecnico || null,
    tecnicoId: assignedAppointment?.idUsuarioTecnico || null,
    description: service.descripcionProblema,
    descripcion: service.descripcionProblema,
    serviceType: tipo,
    tipo,
    serviceTypeId: service.idTipoServicio,
    idTipoServicio: service.idTipoServicio,
    priority: prioridad,
    prioridad,
    priorityId: service.idPrioridad,
    idPrioridad: service.idPrioridad,
    status: estado,
    estado,
    isCompleted,
    completado: isCompleted,
    estadoCatalogo: service.estado?.nombreEstado || null,
    statusId: service.idEstado,
    idEstado: service.idEstado,
    equipoId: service.idEquipo,
    idEquipo: service.idEquipo,
    equipo: service.equipo
      ? {
        id: service.equipo.idEquipo,
        tipo: service.equipo.tipoEquipo,
        marca: service.equipo.marcaEquipo,
        modelo: service.equipo.modeloEquipo,
      }
      : null,
    client: formatUser(service.usuario),
    usuario: formatUser(service.usuario),
    technician: tecnico,
    tecnico,
    appointmentId: assignedAppointment?.idCita || null,
    citaId: assignedAppointment?.idCita || null,
    paymentId: payment?.idPago || null,
    pagoId: payment?.idPago || null,
    paymentStatus,
    estadoPago: paymentStatus,
    canPay,
    puedePagar: canPay,
    paymentBlockedReason,
    motivoBloqueoPago: paymentBlockedReason,
    quote: formatQuote(quote),
    cotizacion: formatQuote(quote),
    serviceLocation: formatServiceLocation(service.ubicacionServicio),
    ubicacionServicio: formatServiceLocation(service.ubicacionServicio),
    technicianLocation: formatTechnicianLocation(latestTechnicianLocation),
    ubicacionTecnico: formatTechnicianLocation(latestTechnicianLocation),
    quoteStatus,
    estadoCotizacion: quoteStatus,
    canComplete: !isCompleted && !isCanceled && Boolean(assignedAppointment?.idUsuarioTecnico),
    puedeCompletar: !isCompleted && !isCanceled && Boolean(assignedAppointment?.idUsuarioTecnico),
    value,
    valor: value,
    duration: null,
    duracion: null,
    date: service.fechaSolicitud,
    fecha: service.fechaSolicitud,
    createdAt: service.fechaSolicitud,
    updatedAt: null,
    advisoryOriginId: service.asesoriaOrigen?.idAsesoria || null,
    asesoriaOrigenId: service.asesoriaOrigen?.idAsesoria || null,
    advisoryOrigin: service.asesoriaOrigen
      ? {
        id: service.asesoriaOrigen.idAsesoria,
        idAsesoria: service.asesoriaOrigen.idAsesoria,
        estado: service.asesoriaOrigen.estado,
        tipoServicioId: service.asesoriaOrigen.idTipoServicio,
        descripcionServicioFinal: service.asesoriaOrigen.descripcionServicioFinal,
      }
      : null,
    asesoriaOrigen: service.asesoriaOrigen
      ? {
        id: service.asesoriaOrigen.idAsesoria,
        idAsesoria: service.asesoriaOrigen.idAsesoria,
        estado: service.asesoriaOrigen.estado,
        tipoServicioId: service.asesoriaOrigen.idTipoServicio,
        descripcionServicioFinal: service.asesoriaOrigen.descripcionServicioFinal,
      }
      : null,
  };
}

export function getPayloadNumber(payload, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      return value === null || value === "" ? null : toNumber(value);
    }
  }

  return undefined;
}

export function getPayloadText(payload, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      return value == null ? "" : String(value).trim();
    }
  }

  return "";
}
