const STORAGE_KEYS = {
  data: "futurapp:data",
  session: "futurapp:session",
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson(key, fallback) {
  if (!canUseLocalStorage()) return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseLocalStorage()) return;

  try {
    if (value == null) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort while the app still works from in-memory state.
  }
}

function mergeSeedRecords(persistedRecords, fallbackRecords) {
  const persisted = Array.isArray(persistedRecords) ? persistedRecords : [];
  const fallback = Array.isArray(fallbackRecords) ? fallbackRecords : [];
  const persistedIds = new Set(persisted.map(record => record?.id));
  const missingFallbackRecords = fallback.filter(record => !persistedIds.has(record?.id));

  return [...persisted, ...missingFallbackRecords];
}

export function loadPersistedData(fallback) {
  const persistedData = readJson(STORAGE_KEYS.data, null);
  if (!persistedData || typeof persistedData !== "object") return fallback;

  const persistedServices = Array.isArray(persistedData.servicios)
    ? persistedData.servicios
    : Array.isArray(persistedData.services)
      ? persistedData.services
      : [];

  return {
    ...fallback,
    ...persistedData,
    users: mergeSeedRecords(persistedData.users, fallback.users),
    servicios: mergeSeedRecords(persistedServices, fallback.servicios),
    citas: mergeSeedRecords(persistedData.citas, fallback.citas),
    pagos: mergeSeedRecords(persistedData.pagos, fallback.pagos),
    comentarios: mergeSeedRecords(persistedData.comentarios, fallback.comentarios),
    notificaciones: mergeSeedRecords(persistedData.notificaciones, fallback.notificaciones),
  };
}

export function savePersistedData(data) {
  writeJson(STORAGE_KEYS.data, data);
}

export function loadPersistedSession(fallback = null) {
  return readJson(STORAGE_KEYS.session, fallback);
}

export function savePersistedSession(session) {
  writeJson(STORAGE_KEYS.session, session);
}

export function clearPersistedSession() {
  writeJson(STORAGE_KEYS.session, null);
}
