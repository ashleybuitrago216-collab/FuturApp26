import { httpClient } from "../../../infrastructure/http/httpClient";

export const commentsApi = {
  listReviews: () => httpClient.get("/comments"),
  createReview: payload => httpClient.post("/comments", payload),
  respondReview: (id, payload) => httpClient.patch(`/comments/${id}/response`, payload),
};
