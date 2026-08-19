import { httpClient } from "../../../infrastructure/http/httpClient";

export const appointmentsApi = {
  getAppointments: () => httpClient.get("/appointments"),
  scheduleAppointment: (id, payload) => httpClient.patch(`/appointments/${id}/schedule`, payload),
  updateAppointmentStatus: (id, payload) => httpClient.patch(`/appointments/${id}/status`, payload),
};
