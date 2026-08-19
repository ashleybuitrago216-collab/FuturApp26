import { httpClient } from "../../../infrastructure/http/httpClient";

export const usersApi = {
  listUsers: () => httpClient.get("/users"),
  getUsers: () => httpClient.get("/users"),
  getUserCatalogs: () => httpClient.get("/users/catalogs"),
  updateUserFromAdmin: (userId, payload) => httpClient.patch(`/users/${userId}/admin`, payload),
  listTechnicians: () => httpClient.get("/users/technicians"),
  getTechnicians: () => httpClient.get("/users/technicians"),
  getMe: () => httpClient.get("/users/me"),
  updateMe: payload => httpClient.patch("/users/me", payload),
};
