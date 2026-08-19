const TOKEN_KEY = "futurapp:token";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export const authTokenStorage = {
  getToken() {
    if (!canUseLocalStorage()) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    if (!canUseLocalStorage()) return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
