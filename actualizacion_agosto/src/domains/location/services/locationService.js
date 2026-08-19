export function createLocationSnapshot({ technicianId, latitude, longitude, timestamp }) {
  return {
    technicianId,
    latitude,
    longitude,
    timestamp,
  };
}

export function mapLegacyTechnicianLocation(row) {
  if (!row) return null;

  return {
    id: row.id_ubicacion,
    technicianId: row.id_usrs,
    latitude: Number(row.latitud),
    longitude: Number(row.longitud),
    timestamp: row.fecha_registro,
  };
}

export function toLegacyTechnicianLocationPayload(location) {
  return {
    id_usrs: location.technicianId,
    latitud: location.latitude,
    longitud: location.longitude,
    fecha_registro: location.timestamp,
  };
}

export function isValidLocationSnapshot(location) {
  return (
    Number.isFinite(Number(location?.latitude)) &&
    Number.isFinite(Number(location?.longitude)) &&
    location?.technicianId != null
  );
}
