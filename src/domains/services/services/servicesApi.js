import { httpClient } from "../../../infrastructure/http/httpClient";

export const servicesApi = {
  getServices: () => httpClient.get("/services"),
  createService: payload => httpClient.post("/services", payload),
  updateService: (id, payload) => httpClient.patch(`/services/${id}`, payload),
  completeService: (id, payload = {}) => httpClient.patch(`/services/${id}/complete`, payload),
  cancelService: id => httpClient.patch(`/services/${id}/cancel`),
  getLocationStatus: id => httpClient.get(`/locations/services/${id}`),
  getServiceRoute: id => httpClient.get(`/locations/services/${id}/route`),
  saveServiceLocation: (id, payload) => httpClient.put(`/locations/services/${id}/service-location`, payload),
  shareTechnicianLocation: (id, payload) => httpClient.post(`/locations/services/${id}/technician-location`, payload),
  getTechnicianLocationHistory: id => httpClient.get(`/locations/services/${id}/technician-history`),
};
