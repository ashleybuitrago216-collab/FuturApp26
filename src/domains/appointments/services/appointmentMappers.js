export function normalizeAppointmentFromApi(appointment) {
  const scheduledAt = appointment.scheduledAt ? new Date(appointment.scheduledAt) : null;
  const fecha = scheduledAt ? scheduledAt.toISOString().slice(0, 10) : "";
  const hora = appointment.time || (scheduledAt ? scheduledAt.toISOString().slice(11, 16) : "");

  return {
    id: appointment.id,
    servicioId: appointment.serviceId,
    usuarioId: appointment.userId,
    clienteId: appointment.userId,
    tecnicoId: appointment.technicianId,
    estado: appointment.status,
    fechaHora: appointment.scheduledAt,
    fecha,
    hora,
    contacto: appointment.contact,
    servicio: appointment.service?.serviceType || "Servicio asociado",
    descripcionProblema: appointment.service?.description || "",
    client: appointment.client,
    technician: appointment.technician,
    service: appointment.service,
    paymentId: appointment.paymentId || appointment.pagoId,
    amount: appointment.amount,
    monto: appointment.monto,
    formattedAmount: appointment.formattedAmount || appointment.montoFormateado,
    paymentStatus: appointment.paymentStatus || appointment.estadoPago,
  };
}

export function mapScheduleToApiPayload(form) {
  return {
    scheduledAt: `${form.fecha}T${form.hora}:00.000Z`,
  };
}
