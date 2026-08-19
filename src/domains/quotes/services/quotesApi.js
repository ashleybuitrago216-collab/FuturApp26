import { httpClient } from "../../../infrastructure/http/httpClient";

export const quotesApi = {
  getQuotes: () => httpClient.get("/quotes"),
  createQuote: payload => httpClient.post("/quotes", payload),
  approveQuote: id => httpClient.post(`/quotes/${id}/approve`, {}),
  rejectQuote: (id, payload = {}) => httpClient.post(`/quotes/${id}/reject`, payload),
};
