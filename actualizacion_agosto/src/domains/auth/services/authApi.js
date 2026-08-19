import { httpClient } from "../../../infrastructure/http/httpClient";

export const authApi = {
  login: credentials => httpClient.post("/auth/login", credentials),
  register: payload => httpClient.post("/auth/register", payload),
  forgotPassword: email => httpClient.post("/auth/forgot-password", { email }),
  resetPassword: payload => httpClient.post("/auth/reset-password", payload),
  me: () => httpClient.get("/auth/me"),
  logout: () => httpClient.post("/auth/logout"),
};
