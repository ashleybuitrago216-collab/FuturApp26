export function hasAppointmentConflict(appointments, form) {
  return appointments.some(
    (appointment) =>
      appointment.fecha === form.fecha &&
      appointment.hora === form.hora &&
      appointment.estado !== "Cancelada"
  );
}

