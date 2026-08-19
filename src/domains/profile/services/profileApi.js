import { httpClient } from "../../../infrastructure/http/httpClient";

export const profileApi = {
  getMyProfile: () => httpClient.get("/users/me"),
  updateMyProfile: payload => httpClient.patch("/users/me", payload),
};
