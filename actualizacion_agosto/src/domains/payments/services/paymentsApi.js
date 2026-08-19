import { httpClient } from "../../../infrastructure/http/httpClient";

export const paymentsApi = {
  getPayments: () => httpClient.get("/payments"),
  getPaymentsSummary: () => httpClient.get("/payments/summary"),
  getPaymentById: id => httpClient.get(`/payments/${id}`),
  initiatePayment: (id, payload) => httpClient.post(`/payments/${id}/initiate`, payload),
  confirmTechnicianPayment: (id, payload) => httpClient.post(`/payments/${id}/confirm-technician`, payload),
};
