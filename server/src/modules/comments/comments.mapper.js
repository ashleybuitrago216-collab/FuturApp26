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

function normalizeStatusName(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "finalizado" || normalized === "completado") return "Completado";
  if (normalized === "cancelado") return "Cancelado";
  return value || "Pendiente";
}

function formatService(service) {
  if (!service) return null;

  const assignedAppointment = service.citas?.find(cita => cita.idUsuarioTecnico) || service.citas?.[0] || null;

  return {
    id: service.idSolicitudServicio,
    serviceId: service.idSolicitudServicio,
    solicitudServicioId: service.idSolicitudServicio,
    userId: service.idUsuario,
    usuarioId: service.idUsuario,
    technicianId: assignedAppointment?.idUsuarioTecnico || null,
    tecnicoId: assignedAppointment?.idUsuarioTecnico || null,
    description: service.descripcionProblema,
    descripcion: service.descripcionProblema,
    serviceType: service.tipoServicio?.nombreServicio || "Servicio",
    tipo: service.tipoServicio?.nombreServicio || "Servicio",
    status: normalizeStatusName(service.estado?.nombreEstado),
    estado: normalizeStatusName(service.estado?.nombreEstado),
    createdAt: service.fechaSolicitud,
    fechaSolicitud: service.fechaSolicitud,
    user: formatUser(service.usuario),
    usuario: formatUser(service.usuario),
    technician: formatUser(assignedAppointment?.tecnico),
    tecnico: formatUser(assignedAppointment?.tecnico),
  };
}

function formatAdvisory(advisory) {
  if (!advisory) return null;

  return {
    id: advisory.idAsesoria,
    advisoryId: advisory.idAsesoria,
    asesoriaId: advisory.idAsesoria,
    advisorId: advisory.idUsuarioAsesor,
    asesorId: advisory.idUsuarioAsesor,
    advisor: formatUser(advisory.asesor),
    asesor: formatUser(advisory.asesor),
    status: advisory.estado,
    estado: advisory.estado,
    description: advisory.descripcionServicioFinal || advisory.descripcion || advisory.motivo || null,
    descripcion: advisory.descripcionServicioFinal || advisory.descripcion || advisory.motivo || null,
  };
}

export function formatReview(review) {
  const service = formatService(review.solicitudServicio);
  const advisory = formatAdvisory(review.asesoria);

  return {
    id: review.idResena,
    reviewId: review.idResena,
    resenaId: review.idResena,
    userId: review.idUsuario,
    usuarioId: review.idUsuario,
    serviceId: review.idSolicitudServicio,
    solicitudServicioId: review.idSolicitudServicio,
    advisoryId: review.idAsesoria,
    asesoriaId: review.idAsesoria,
    rating: review.calificacion == null ? null : Number(review.calificacion),
    calificacion: review.calificacion == null ? null : Number(review.calificacion),
    comment: review.comentario || "",
    comentario: review.comentario || "",
    technicianResponse: review.respuestaTecnico || "",
    respuestaTecnico: review.respuestaTecnico || "",
    status: review.estado || "Activa",
    estado: review.estado || "Activa",
    createdAt: review.fechaResena,
    fechaResena: review.fechaResena,
    user: formatUser(review.usuario),
    usuario: formatUser(review.usuario),
    service,
    servicio: service,
    advisory,
    asesoria: advisory,
  };
}
