import { calculatePaymentMetrics, filterPayments } from "../model/paymentsModel";
import { buildPendingPaymentsForUser, buildTechnicianPaymentsFromCompletedServices, listPaymentHistoryForUser } from "./paymentsRepository";

// API-ready contract for the future backend/MySQL migration:
// GET /api/payments/my-summary
// GET /api/payments/my-pending
// GET /api/payments/my-history
// GET /api/payments/:id
// POST /api/payments/:id/initiate
// GET /api/payments/technician
// GET /api/payments/technician/:id
// POST /api/payments/technician/:id/confirm
// GET /api/payments/admin/summary
// GET /api/payments/admin/transactions
// GET /api/payments/admin/transactions/:id
export const paymentsService = {
  getMySummary: async ({ payments = [], session } = {}) => {
    const mine = payments.filter(payment => payment.usuarioId === session?.id || payment.userId === session?.id);
    const pending = mine.filter(payment => payment.estado === "Pendiente");
    const paid = mine.filter(payment => payment.estado === "Pagado");

    return {
      pendingTotal: pending.reduce((total, payment) => total + Number(payment.valor || payment.amount || 0), 0),
      pendingCount: pending.length,
      paidCount: paid.length,
      spentTotal: paid.reduce((total, payment) => total + Number(payment.valor || payment.amount || 0), 0),
      methodsUsed: new Set(paid.map(payment => payment.medio || payment.method).filter(Boolean)).size,
    };
  },
  getMyPendingPayments: async ({ services, appointments, payments, session } = {}) =>
    buildPendingPaymentsForUser({ services, appointments, payments, session }),
  getMyPaymentHistory: async ({ payments, session } = {}) =>
    listPaymentHistoryForUser(payments, session),
  startPayment: async (paymentId, method) => ({
    paymentId,
    method,
    gateway: null,
    simulated: true,
  }),
  getTechnicianPayments: async ({ services, appointments, payments, users, session } = {}) =>
    buildTechnicianPaymentsFromCompletedServices({ services, appointments, payments, users, session }),
  confirmTechnicianPayment: async (paymentId, method) => ({
    paymentId,
    method,
    status: "Pagado",
    confirmedByTechnician: true,
    confirmedAt: new Date().toISOString(),
    simulated: true,
  }),
  getAdminSummary: async ({ payments = [] } = {}) =>
    calculatePaymentMetrics(payments),
  getAdminTransactions: async ({ payments, query, status, users, services, appointments } = {}) =>
    filterPayments({ payments, query, status, users, services, appointments }),
  getTransactionById: async ({ payments = [], id } = {}) =>
    payments.find(payment => String(payment.id) === String(id) || payment.txId === id || payment.transactionId === id) || null,
};
