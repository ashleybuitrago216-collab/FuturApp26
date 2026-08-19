function formatTechnician(user) {
  if (!user) return null;

  return {
    id: user.idUsuario,
    name: `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim(),
    email: user.correo,
    telefono: user.telefono,
    area: user.areaEspecialidad?.nombreAreaEspecialidad || null,
  };
}

function toNumber(value) {
  return value == null ? null : Number(value);
}

export function formatLocation(location) {
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
    tecnico: formatTechnician(location.usuario),
  };
}

export function formatServiceLocation(location) {
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

export function formatServiceLocationStatus({ service, serviceLocation, technicianLocation, distanceMeters, etaMinutes }) {
  return {
    serviceId: service.idSolicitudServicio,
    solicitudServicioId: service.idSolicitudServicio,
    serviceLocation: formatServiceLocation(serviceLocation),
    ubicacionServicio: formatServiceLocation(serviceLocation),
    technicianLocation: formatLocation(technicianLocation),
    ubicacionTecnico: formatLocation(technicianLocation),
    distanceMeters,
    distanciaMetros: distanceMeters,
    etaMinutes,
    tiempoEstimadoMinutos: etaMinutes,
  };
}
