export function createApiClient() {
  return {
    get() {
      throw new Error("API client is not configured yet.");
    },
    post() {
      throw new Error("API client is not configured yet.");
    },
    put() {
      throw new Error("API client is not configured yet.");
    },
    delete() {
      throw new Error("API client is not configured yet.");
    },
  };
}

