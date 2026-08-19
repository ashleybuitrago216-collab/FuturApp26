import { httpClient } from "../../../infrastructure/http/httpClient";

export const advisoriesApi = {
  createAdvisoryRequest: payload => httpClient.post("/advisories", payload),
  getCatalogs: () => httpClient.get("/advisories/catalogs"),
  listMyAdvisories: () => httpClient.get("/advisories"),
  listMyAdvisoryRequests: () => httpClient.get("/advisories"),
  getAdvisoryById: id => httpClient.get(`/advisories/${id}`),
  getAdvisoryRequestById: id => httpClient.get(`/advisories/${id}`),
  getAdvisoryComments: id => httpClient.get(`/advisories/${id}/comments`),
  getAdvisoryMessages: id => httpClient.get(`/advisories/${id}/messages`),
  sendAdvisoryMessage: (id, payload) => httpClient.post(`/advisories/${id}/messages`, payload),
  assignAdvisory: (id, payload) => httpClient.patch(`/advisories/${id}/assign`, payload),
  resolveAdvisory: (id, payload) => httpClient.patch(`/advisories/${id}/resolve`, payload),
};
