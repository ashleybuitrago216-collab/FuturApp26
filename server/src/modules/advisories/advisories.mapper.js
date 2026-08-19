function formatUser(user) {
  if (!user) return null;

  return {
    id: user.idUsuario,
    idUsuario: user.idUsuario,
    nombre: user.nombre,
    apellido: user.apellido,
    name: `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim(),
    correo: user.correo,
    email: user.correo,
    telefono: user.telefono,
  };
}

export function formatAdvisoryMessage(message) {
  const senderRole = message?.remitente?.idUsuario === message?.asesoria?.idUsuarioAsesor
    ? "asesor"
    : message?.remitente?.idUsuario === message?.asesoria?.idUsuarioSolicitante
      ? "usuario"
      : null;

  return {
    id: message.idMensajeAsesoria,
    idMensajeAsesoria: message.idMensajeAsesoria,
    advisoryId: message.idAsesoria,
    asesoriaId: message.idAsesoria,
    senderId: message.idUsuarioRemitente,
    remitenteId: message.idUsuarioRemitente,
    senderRole,
    rolRemitente: senderRole,
    message: message.mensaje,
    mensaje: message.mensaje,
    read: message.leido,
    leido: message.leido,
    readAt: message.fechaLectura,
    fechaLectura: message.fechaLectura,
    createdAt: message.fechaCreacion,
    fechaCreacion: message.fechaCreacion,
    sender: formatUser(message.remitente),
    remitente: formatUser(message.remitente),
  };
}

export function formatAdvisory(advisory) {
  const descripcionInicial = advisory.descripcion || advisory.descripcionProblema || "";
  const tipoServicio = advisory.tipoServicio
    ? {
      id: advisory.tipoServicio.idTipoServicio,
      idTipoServicio: advisory.tipoServicio.idTipoServicio,
      nombre: advisory.tipoServicio.nombreServicio,
      nombreServicio: advisory.tipoServicio.nombreServicio,
      descripcion: advisory.tipoServicio.descripcionServicio,
      descripcionServicio: advisory.tipoServicio.descripcionServicio,
    }
    : null;

  return {
    id: advisory.idAsesoria,
    idAsesoria: advisory.idAsesoria,
    userId: advisory.idUsuarioSolicitante,
    usuarioId: advisory.idUsuarioSolicitante,
    advisorId: advisory.idUsuarioAsesor,
    asesorId: advisory.idUsuarioAsesor,
    fecha: advisory.fecha,
    hora: advisory.hora,
    fechaContacto: advisory.fecha,
    horaContacto: advisory.hora,
    estado: advisory.estado || "Programada",
    motivo: advisory.motivo || advisory.tipoAsesoria || "Asesoria de servicio",
    descripcion: descripcionInicial,
    descripcionInicial,
    tipoDispositivo: advisory.tipoDispositivo || null,
    telefonoPrincipal: advisory.telefonoPrincipal || null,
    telefonoAlterno: advisory.telefonoAlterno || null,
    tipoServicioId: advisory.idTipoServicio,
    idTipoServicio: advisory.idTipoServicio,
    tipoServicio,
    descripcionServicioFinal: advisory.descripcionServicioFinal || null,
    solicitudServicioId: advisory.idSolicitudServicio || null,
    serviceId: advisory.idSolicitudServicio || null,
    solicitudServicio: advisory.solicitudServicio
      ? {
        id: advisory.solicitudServicio.idSolicitudServicio,
        idSolicitudServicio: advisory.solicitudServicio.idSolicitudServicio,
        estado: advisory.solicitudServicio.estado?.nombreEstado || null,
        tipoServicio: advisory.solicitudServicio.tipoServicio?.nombreServicio || null,
        descripcion: advisory.solicitudServicio.descripcionProblema || null,
      }
      : null,
    createdAt: advisory.fechaCreacion,
    fechaCreacion: advisory.fechaCreacion,
    updatedAt: advisory.fechaActualizacion,
    fechaActualizacion: advisory.fechaActualizacion,
    solicitante: formatUser(advisory.solicitante || advisory.usuario),
    asesor: formatUser(advisory.asesor),
  };
}
