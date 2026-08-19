export const PAYMENT_STATUSES = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_STATUS = {
  paid: PAYMENT_STATUSES.PAID,
};

export const PAYMENT_METHODS = {
  CASH: "Efectivo",
  BANCOLOMBIA: "Bancolombia",
  NEQUI: "Nequi",
  DAVIPLATA: "DaviPlata",
  TRANSFER: "Transferencia Bancaria",
  CARD: "Tarjeta",
};

export const PAYMENT_METHOD_OPTIONS = [
  {
    key: "cash",
    name: PAYMENT_METHODS.CASH,
    description: "Pago en efectivo al tecnico",
  },
  {
    key: "bancolombia",
    name: PAYMENT_METHODS.BANCOLOMBIA,
    description: "Transferencia Bancolombia",
  },
  {
    key: "nequi",
    name: PAYMENT_METHODS.NEQUI,
    description: "Pago digital Nequi",
  },
  {
    key: "daviplata",
    name: PAYMENT_METHODS.DAVIPLATA,
    description: "Pago movil DaviPlata",
  },
  {
    key: "transfer",
    name: PAYMENT_METHODS.TRANSFER,
    description: "Transferencia bancaria",
  },
  {
    key: "card",
    name: PAYMENT_METHODS.CARD,
    description: "Pago con tarjeta registrado",
  },
];

export const PLATFORM_COMMISSION_RATE = 0.25;

const SUCCESS_STATUSES = new Set([PAYMENT_STATUSES.PAID, "Completado"]);

export function normalizePaymentStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  const aliases = {
    pagado: PAYMENT_STATUSES.PAID,
    pagada: PAYMENT_STATUSES.PAID,
    completado: "Completado",
    completada: "Completado",
    pendiente: PAYMENT_STATUSES.PENDING,
    fallido: PAYMENT_STATUSES.FAILED,
    fallida: PAYMENT_STATUSES.FAILED,
    reembolsado: PAYMENT_STATUSES.REFUNDED,
    reembolsada: PAYMENT_STATUSES.REFUNDED,
  };

  return aliases[normalized] || PAYMENT_STATUSES.PENDING;
}

export function getPaymentAmount(payment) {
  return Number(payment?.valor ?? payment?.amount ?? 0);
}

export function calculatePlatformCommission(payment) {
  const amount = getPaymentAmount(payment);
  return Number(payment?.platformCommission ?? payment?.comisionPlataforma ?? Math.round(amount * PLATFORM_COMMISSION_RATE));
}

export function getPaymentDisplayStatus(payment) {
  const status = normalizePaymentStatus(payment?.estado ?? payment?.status);
  return status === PAYMENT_STATUSES.PAID ? "Completado" : status;
}

export function isSuccessfulPayment(payment) {
  return SUCCESS_STATUSES.has(normalizePaymentStatus(payment?.estado ?? payment?.status));
}

export function formatTransactionId(payment) {
  if (payment?.transactionId) return payment.transactionId;
  if (payment?.txId) return payment.txId;
  if (payment?.referencia) return payment.referencia;
  if (payment?.reference) return payment.reference;
  return `TXN-${String(payment?.id || "000000").replace(/\D/g, "").padStart(6, "0")}`;
}

export function resolvePaymentRelations({ payment, users = [], services = [], appointments = [] }) {
  const userId = payment?.userId ?? payment?.usuarioId;
  const technicianId = payment?.technicianId ?? payment?.tecnicoId;
  const serviceId = payment?.serviceId ?? payment?.servicioId;
  const appointmentId = payment?.appointmentId ?? payment?.citaId;
  const appointment = appointments.find(item => item.id === appointmentId) || appointments.find(item => item.servicioId === serviceId);
  const service = services.find(item => item.id === serviceId);
  const client = users.find(user => user.id === (userId ?? service?.usuarioId ?? appointment?.usuarioId ?? appointment?.clienteId));
  const technician = users.find(user => user.id === (technicianId ?? service?.tecnicoId ?? appointment?.tecnicoId));

  return {
    client,
    technician,
    service,
    appointment,
    clientName: client ? `${client.nombre} ${client.apellido}` : "Cliente sin asignar",
    technicianName: technician ? `${technician.nombre} ${technician.apellido}` : "Tecnico sin asignar",
    serviceName: payment?.servicio || payment?.service || service?.tipo || appointment?.servicio || "Servicio asociado",
  };
}

export function calculatePaymentMetrics(payments = []) {
  const totalTransactions = payments.length;
  const successfulPayments = payments.filter(isSuccessfulPayment);
  const totalRevenue = successfulPayments.reduce((total, payment) => total + getPaymentAmount(payment), 0);
  const totalCommissions = successfulPayments.reduce((total, payment) => total + calculatePlatformCommission(payment), 0);
  const successRate = totalTransactions ? (successfulPayments.length / totalTransactions) * 100 : 0;

  return {
    totalTransactions,
    successRate,
    totalRevenue,
    totalCommissions,
  };
}

export function filterPayments({ payments = [], query = "", status = "all", users = [], services = [], appointments = [] }) {
  const normalizedQuery = query.trim().toLowerCase();

  return payments.filter(payment => {
    const displayStatus = getPaymentDisplayStatus(payment);
    const normalizedStatus = normalizePaymentStatus(payment?.estado ?? payment?.status);
    const matchesStatus =
      status === "all"
      || (status === "completed" && (displayStatus === "Completado" || normalizedStatus === PAYMENT_STATUSES.PAID))
      || (status === "pending" && normalizedStatus === PAYMENT_STATUSES.PENDING)
      || (status === "failed" && normalizedStatus === PAYMENT_STATUSES.FAILED);

    if (!matchesStatus) return false;
    if (!normalizedQuery) return true;

    const relations = resolvePaymentRelations({ payment, users, services, appointments });
    const searchable = [
      formatTransactionId(payment),
      payment.reference,
      payment.referencia,
      relations.clientName,
      relations.technicianName,
      relations.serviceName,
      payment.medio,
      payment.method,
    ].filter(Boolean).join(" ").toLowerCase();

    return searchable.includes(normalizedQuery);
  });
}
