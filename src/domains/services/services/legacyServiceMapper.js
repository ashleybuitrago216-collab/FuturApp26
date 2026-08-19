import { normalizeServiceStatus } from "../model/servicesModel";

export function mapLegacyServiceRequest(row, lookups = {}) {
  if (!row) return null;

  return {
    id: row.id_solicitud,
    usuarioId: row.id_usrs,
    equipoId: row.id_equipo,
    tipo: lookups.serviceTypes?.[row.id_tp_servicio] || row.id_tp_servicio,
    descripcion: row.descripcion_problema || "",
    prioridad: lookups.priorities?.[row.id_prioridad] || row.id_prioridad,
    fecha: row.fecha_solicitud,
    estado: normalizeServiceStatus(lookups.statuses?.[row.id_estado] || row.id_estado),
    tecnicoId: null,
  };
}

export function toLegacyServiceRequestPayload(service) {
  return {
    id_usrs: service.usuarioId,
    id_equipo: service.equipoId || null,
    id_tp_servicio: service.tipo,
    descripcion_problema: service.descripcion,
    id_prioridad: service.prioridad,
    fecha_solicitud: service.fecha,
    id_estado: normalizeServiceStatus(service.estado),
  };
}
