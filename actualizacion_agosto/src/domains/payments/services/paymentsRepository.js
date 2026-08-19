import { PAYMENT_STATUSES } from "../model/paymentsModel";
import { PLATFORM_COMMISSION_RATE } from "../model/paymentsModel";
import { normalizeServiceStatus, SERVICE_STATUS } from "../../services/model/servicesModel";

export function listPaymentsForSession(payments, session, isAdmin) {
  return isAdmin
    ? payments
    : payments.filter((payment) => payment.usuarioId === session.id);
}

const DEFAULT_SERVICE_AMOUNT = 80000;

function getOwnerId(entity) {
  return entity?.usuarioId ?? entity?.clienteId ?? entity?.userId;
}

function getServiceName(entity, services = []) {
  if (entity?.servicio) return entity.servicio;
  if (entity?.tipo) return entity.tipo;
  const service = services.find(item => item.id === entity?.servicioId);
  return service?.tipo || service?.servicio || service?.descripcion || "Servicio asociado";
}

function getAmount(entity) {
  return Number(entity?.valor ?? entity?.amount ?? entity?.precio ?? entity?.costo ?? DEFAULT_SERVICE_AMOUNT);
}

function getReference(prefix, id) {
  return `SRV-2026-${String(id || "000").padStart(5, "0")}`;
}

function hasPaymentForEntity(payments, entity) {
  return payments.some(payment => {
    if (entity.appointmentId && (payment.appointmentId === entity.appointmentId || payment.citaId === entity.appointmentId)) return true;
    if (entity.serviceId && (payment.serviceId === entity.serviceId || payment.servicioId === entity.serviceId)) return true;
    return payment.referencia === entity.reference || payment.reference === entity.reference;
  });
}

function getPaymentServiceId(payment) {
  return payment?.serviceId ?? payment?.servicioId;
}

function getPaymentTechnicianId(payment) {
  return payment?.technicianId ?? payment?.tecnicoId;
}

function getPaymentOwnerId(payment) {
  return payment?.usuarioId ?? payment?.userId;
}

function getExistingPaymentForService(payments, service) {
  return payments.find(payment => {
    const paymentServiceId = getPaymentServiceId(payment);
    if (paymentServiceId && paymentServiceId === service.id) return true;

    const sameOwner = getPaymentOwnerId(payment) === getOwnerId(service);
    const sameTechnician = !getPaymentTechnicianId(payment) || getPaymentTechnicianId(payment) === service.tecnicoId;
    const sameServiceName = String(payment.servicio || payment.service || "").trim() === String(getServiceName(service)).trim();

    return sameOwner && sameTechnician && sameServiceName;
  });
}

function getAppointmentForService(appointments, service) {
  return appointments.find(appointment => appointment.servicioId === service.id)
    || appointments.find(appointment => getOwnerId(appointment) === getOwnerId(service) && appointment.tecnicoId === service.tecnicoId && getServiceName(appointment) === getServiceName(service));
}

function getPlatformCommission(paymentOrService, amount) {
  return Number(paymentOrService?.platformCommission ?? paymentOrService?.comisionPlataforma ?? Math.round(amount * PLATFORM_COMMISSION_RATE));
}

function getTechnicianEarnings(paymentOrService, amount, commission) {
  return Number(paymentOrService?.technicianEarnings ?? paymentOrService?.gananciaTecnico ?? amount - commission);
}

function buildPaymentFromAppointment(appointment, services) {
  const service = services.find(item => item.id === appointment.servicioId);
  return {
    id: `pending-appointment-${appointment.id}`,
    usuarioId: getOwnerId(appointment),
    serviceId: appointment.servicioId ?? service?.id ?? null,
    appointmentId: appointment.id,
    technicianId: appointment.tecnicoId ?? service?.tecnicoId ?? null,
    servicio: getServiceName(appointment, services),
    reference: getReference("SRV", appointment.id),
    fecha: appointment.fecha || appointment.createdAt?.slice(0, 10) || service?.fecha || "",
    hora: appointment.hora || "",
    valor: getAmount(appointment.valor ? appointment : service),
    medio: appointment.medio || "",
    estado: PAYMENT_STATUSES.PENDING,
    derived: true,
  };
}

function buildPaymentFromService(service) {
  return {
    id: `pending-service-${service.id}`,
    usuarioId: getOwnerId(service),
    serviceId: service.id,
    appointmentId: null,
    technicianId: service.tecnicoId ?? null,
    servicio: getServiceName(service),
    reference: getReference("SRV", service.id),
    fecha: service.fecha || service.createdAt?.slice(0, 10) || "",
    hora: service.hora || "",
    valor: getAmount(service),
    medio: service.medio || "",
    estado: PAYMENT_STATUSES.PENDING,
    derived: true,
  };
}

export function buildPendingPaymentsForUser({ services = [], appointments = [], payments = [], session }) {
  if (!session?.id) return [];

  const userPayments = payments.filter(payment => payment.usuarioId === session.id || payment.userId === session.id);
  const pendingStoredPayments = userPayments.filter(payment => payment.estado === PAYMENT_STATUSES.PENDING);
  const userAppointments = appointments.filter(appointment => getOwnerId(appointment) === session.id);
  const userServices = services.filter(service => getOwnerId(service) === session.id);

  const derivedFromAppointments = userAppointments
    .map(appointment => buildPaymentFromAppointment(appointment, services))
    .filter(payment => !hasPaymentForEntity(userPayments, payment));

  const appointmentServiceIds = new Set(userAppointments.map(appointment => appointment.servicioId).filter(Boolean));
  const derivedFromServices = userServices
    .filter(service => !appointmentServiceIds.has(service.id))
    .map(buildPaymentFromService)
    .filter(payment => !hasPaymentForEntity(userPayments, payment));

  return [...pendingStoredPayments, ...derivedFromAppointments, ...derivedFromServices];
}

export function listPaymentHistoryForUser(payments = [], session) {
  if (!session?.id) return [];
  return payments
    .filter(payment => (payment.usuarioId === session.id || payment.userId === session.id) && payment.estado !== PAYMENT_STATUSES.PENDING)
    .sort((a, b) => String(b.paidAt || b.fecha || "").localeCompare(String(a.paidAt || a.fecha || "")));
}

export function buildTechnicianPaymentsFromCompletedServices({ services = [], appointments = [], payments = [], users = [], session }) {
  if (!session?.id) return [];

  return services
    .filter(service => service.tecnicoId === session.id && normalizeServiceStatus(service.estado) === SERVICE_STATUS.completed)
    .map(service => {
      const appointment = getAppointmentForService(appointments, service);
      const existingPayment = getExistingPaymentForService(payments, service);
      const amount = getAmount(existingPayment || service);
      const platformCommission = getPlatformCommission(existingPayment || service, amount);
      const technicianEarnings = getTechnicianEarnings(existingPayment || service, amount, platformCommission);
      const clientId = getOwnerId(service);
      const client = users.find(user => user.id === clientId);

      return {
        id: existingPayment?.id ?? `technician-pending-service-${service.id}`,
        txId: existingPayment?.txId ?? null,
        usuarioId: clientId,
        userId: clientId,
        clientName: client ? `${client.nombre} ${client.apellido}` : "Cliente sin nombre",
        serviceId: service.id,
        appointmentId: existingPayment?.appointmentId ?? existingPayment?.citaId ?? appointment?.id ?? null,
        technicianId: session.id,
        servicio: existingPayment?.servicio || getServiceName(service),
        duration: existingPayment?.duration || existingPayment?.duracion || service.duracion || appointment?.duracion || "No registrada",
        reference: existingPayment?.reference || existingPayment?.referencia || getReference("SRV", service.id),
        fecha: existingPayment?.fecha || appointment?.fecha || service.fecha || "",
        hora: existingPayment?.hora || appointment?.hora || "",
        valor: amount,
        amount,
        platformCommission,
        technicianEarnings,
        medio: existingPayment?.medio || existingPayment?.method || "",
        method: existingPayment?.method || existingPayment?.medio || null,
        estado: existingPayment?.estado || existingPayment?.status || PAYMENT_STATUSES.PENDING,
        status: existingPayment?.status || existingPayment?.estado || PAYMENT_STATUSES.PENDING,
        confirmedByTechnician: Boolean(existingPayment?.confirmedByTechnician),
        confirmedAt: existingPayment?.confirmedAt || null,
        paidAt: existingPayment?.paidAt || null,
        createdAt: existingPayment?.createdAt || new Date().toISOString(),
        derived: !existingPayment,
      };
    })
    .sort((a, b) => String(b.confirmedAt || b.fecha || "").localeCompare(String(a.confirmedAt || a.fecha || "")));
}
