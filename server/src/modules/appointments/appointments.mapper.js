function formatUser(user) {
  if (!user) return null;

  return {
    id: user.idUsuario,
    name: `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim(),
    email: user.correo,
    telefono: user.telefono,
  };
}

function normalizeApiStatus(nombreEstado, confirmada = false) {
  const normalized = String(nombreEstado || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "cancelado") return "Cancelada";
  if (normalized === "finalizado" || normalized === "completado") return "Completada";
  if (confirmada) return "Programada";
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

  return {
    id: service.idSolicitudServicio,
    description: service.descripcionProblema,
    descripcion: service.descripcionProblema,
    serviceType: service.tipoServicio?.nombreServicio || "Pendiente por clasificar",
    tipo: service.tipoServicio?.nombreServicio || "Pendiente por clasificar",
    status: normalizeApiStatus(service.estado?.nombreEstado),
    estado: normalizeApiStatus(service.estado?.nombreEstado),
  };
}

export function formatAppointment(appointment) {
  const estado = normalizeApiStatus(appointment.estado?.nombreEstado, appointment.confirmada);
  const fecha = formatDate(appointment.fecha);
  const hora = formatTime(appointment.hora);

  return {
    id: appointment.idCita,
    serviceId: appointment.idSolicitudServicio,
    servicioId: appointment.idSolicitudServicio,
    userId: appointment.idUsuarioCliente,
    usuarioId: appointment.idUsuarioCliente,
    clientId: appointment.idUsuarioCliente,
    clienteId: appointment.idUsuarioCliente,
    technicianId: appointment.idUsuarioTecnico,
    tecnicoId: appointment.idUsuarioTecnico,
    status: estado,
    estado,
    estadoCatalogo: appointment.estado?.nombreEstado || null,
    scheduledAt: fecha && hora ? `${fecha}T${hora}:00.000Z` : null,
    fecha,
    hora,
    time: hora,
    confirmada: appointment.confirmada,
    service: formatService(appointment.solicitudServicio),
    servicio: formatService(appointment.solicitudServicio),
    client: formatUser(appointment.cliente),
    usuario: formatUser(appointment.cliente),
    cliente: formatUser(appointment.cliente),
    technician: formatUser(appointment.tecnico),
    tecnico: formatUser(appointment.tecnico),
    createdAt: null,
    updatedAt: null,
  };
}
