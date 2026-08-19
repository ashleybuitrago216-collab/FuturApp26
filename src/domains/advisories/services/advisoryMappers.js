function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}

function formatTime(value) {
  if (!value) return "Sin hora";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return String(value).slice(0, 5);
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    nombre: user.nombre || "",
    apellido: user.apellido || "",
    name: user.name || `${user.nombre || ""} ${user.apellido || ""}`.trim(),
    correo: user.correo || user.email || "",
    telefono: user.telefono || "",
  };
}

function normalizeTipoServicio(tipoServicio) {
  if (!tipoServicio) return null;
  return {
    id: tipoServicio.id ?? tipoServicio.idTipoServicio,
    idTipoServicio: tipoServicio.idTipoServicio ?? tipoServicio.id,
    nombre: tipoServicio.nombre || tipoServicio.nombreServicio || "",
    nombreServicio: tipoServicio.nombreServicio || tipoServicio.nombre || "",
    descripcion: tipoServicio.descripcion || tipoServicio.descripcionServicio || "",
  };
}

function normalizeAdvisor(advisor) {
  if (!advisor) return null;
  return {
    id: advisor.id ?? advisor.idUsuario ?? advisor.asesorId,
    idUsuario: advisor.idUsuario ?? advisor.id ?? advisor.asesorId,
    asesorId: advisor.asesorId ?? advisor.id ?? advisor.idUsuario,
    nombre: advisor.nombre || "",
    apellido: advisor.apellido || "",
    name: advisor.name || `${advisor.nombre || ""} ${advisor.apellido || ""}`.trim(),
    correo: advisor.correo || advisor.email || "",
    telefono: advisor.telefono || "",
    carga: advisor.carga ?? advisor.activeAdvisories ?? 0,
    activeAdvisories: advisor.activeAdvisories ?? advisor.carga ?? 0,
  };
}

export function normalizeAdvisoryFromApi(advisory) {
  return {
    id: advisory.id,
    idAsesoria: advisory.idAsesoria || advisory.id,
    asesorId: advisory.asesorId || advisory.advisorId,
    usuarioId: advisory.usuarioId || advisory.userId,
    fechaRaw: advisory.fecha,
    horaRaw: advisory.hora,
    fechaContactoRaw: advisory.fechaContacto || advisory.fecha,
    horaContactoRaw: advisory.horaContacto || advisory.hora,
    fecha: formatDate(advisory.fechaContacto || advisory.fecha),
    hora: formatTime(advisory.horaContacto || advisory.hora),
    fechaContacto: formatDate(advisory.fechaContacto || advisory.fecha),
    horaContacto: formatTime(advisory.horaContacto || advisory.hora),
    estado: advisory.estado || "Pendiente",
    motivo: advisory.motivo || "Asesoria de servicio",
    descripcion: advisory.descripcionInicial || advisory.descripcion || "",
    descripcionInicial: advisory.descripcionInicial || advisory.descripcion || "",
    tipoDispositivo: advisory.tipoDispositivo || "",
    telefonoPrincipal: advisory.telefonoPrincipal || "",
    telefonoAlterno: advisory.telefonoAlterno || "",
    tipoServicioId: advisory.tipoServicioId ?? advisory.idTipoServicio ?? null,
    tipoServicio: normalizeTipoServicio(advisory.tipoServicio),
    descripcionServicioFinal: advisory.descripcionServicioFinal || "",
    solicitudServicioId: advisory.solicitudServicioId ?? advisory.serviceId ?? advisory.solicitudServicio?.id ?? null,
    serviceId: advisory.serviceId ?? advisory.solicitudServicioId ?? advisory.solicitudServicio?.id ?? null,
    solicitudServicio: advisory.solicitudServicio || null,
    fechaCreacion: formatDate(advisory.fechaCreacion || advisory.createdAt),
    fechaCreacionRaw: advisory.fechaCreacion || advisory.createdAt,
    solicitante: normalizeUser(advisory.solicitante),
    asesor: normalizeUser(advisory.asesor),
  };
}

export function normalizeAdvisoryCatalogsFromApi(response = {}) {
  return {
    tiposServicio: (response.tiposServicio || []).map(normalizeTipoServicio),
    asesores: (response.asesores || []).map(normalizeAdvisor),
  };
}

export function normalizeAdvisoriesFromApi(advisories = []) {
  return advisories.map(normalizeAdvisoryFromApi);
}

export function normalizeAdvisoryCommentsFromApi(response) {
  const comments = response?.comments || response?.comentarios || [];
  return {
    comments,
    relationAvailable: Boolean(response?.relationAvailable ?? response?.relacionDisponible),
    message: response?.message || "",
  };
}

export function normalizeAdvisoryMessageFromApi(message) {
  const createdAt = message.createdAt ?? message.fechaCreacion;

  return {
    id: message.id ?? message.idMensajeAsesoria,
    advisoryId: message.advisoryId ?? message.asesoriaId,
    senderId: message.senderId ?? message.remitenteId,
    senderRole: message.senderRole ?? message.rolRemitente,
    message: message.message ?? message.mensaje ?? "",
    read: Boolean(message.read ?? message.leido),
    readAt: message.readAt ?? message.fechaLectura,
    createdAt,
    sender: normalizeUser(message.sender || message.remitente),
  };
}

export function normalizeAdvisoryMessagesFromApi(response = {}) {
  const messages = response.messages || response.mensajes || [];
  return messages.map(normalizeAdvisoryMessageFromApi);
}
