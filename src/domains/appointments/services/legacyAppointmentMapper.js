export function mapLegacyAppointment(row, lookups = {}) {
  if (!row) return null;

  return {
    id: row.id_cita,
    clienteId: row.id_usrs,
    solicitudId: row.id_solicitud,
    servicio: lookups.requests?.[row.id_solicitud] || row.id_solicitud,
    fecha: row.fecha,
    hora: String(row.hora || "").slice(0, 5),
    contacto: "",
    estado: lookups.statuses?.[row.id_estado] || (row.confirmada ? "Confirmada" : "Pendiente"),
    tecnicoId: null,
  };
}

export function toLegacyAppointmentPayload(appointment) {
  return {
    id_solicitud: appointment.solicitudId || null,
    id_usrs: appointment.clienteId,
    fecha: appointment.fecha,
    hora: appointment.hora,
    confirmada: appointment.estado === "Confirmada" ? 1 : 0,
    id_estado: appointment.estado,
  };
}

