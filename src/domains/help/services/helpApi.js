import { httpClient } from "../../../infrastructure/http/httpClient";

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const helpApi = {
  listArticles: params => httpClient.get(`/help${toQueryString(params)}`),
  listCategories: () => httpClient.get("/help/categories"),
  getContextualHelp: params => httpClient.get(`/help/context${toQueryString(params)}`),
  getArticle: slug => httpClient.get(`/help/${slug}`),
  createArticle: payload => httpClient.post("/help", payload),
  updateArticle: (id, payload) => httpClient.patch(`/help/${id}`, payload),
  publishArticle: id => httpClient.patch(`/help/${id}/publish`, {}),
  archiveArticle: id => httpClient.patch(`/help/${id}/archive`, {}),
};
