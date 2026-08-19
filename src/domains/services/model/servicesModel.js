export const SERVICE_STATUS = {
  pending: "Pendiente",
  completed: "Completado",
  canceled: "Cancelado",
};

const SERVICE_STATUS_ALIASES = {
  pendiente: SERVICE_STATUS.pending,
  "en progreso": SERVICE_STATUS.pending,
  "en proceso": SERVICE_STATUS.pending,
  confirmado: SERVICE_STATUS.pending,
  confirmada: SERVICE_STATUS.pending,
  completado: SERVICE_STATUS.completed,
  completada: SERVICE_STATUS.completed,
  finalizado: SERVICE_STATUS.completed,
  finalizada: SERVICE_STATUS.completed,
  cancelado: SERVICE_STATUS.canceled,
  cancelada: SERVICE_STATUS.canceled,
};

export const VALID_SERVICE_STATUSES = Object.values(SERVICE_STATUS);

export function normalizeServiceStatus(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  return SERVICE_STATUS_ALIASES[normalizedStatus] || SERVICE_STATUS.pending;
}
