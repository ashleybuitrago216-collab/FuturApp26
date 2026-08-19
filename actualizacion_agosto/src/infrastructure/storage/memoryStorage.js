export function createMemoryStorage(initialValue = {}) {
  let store = { ...initialValue };

  return {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, value) {
      store = { ...store, [key]: value };
    },
    removeItem(key) {
      const next = { ...store };
      delete next[key];
      store = next;
    },
    clear() {
      store = {};
    },
  };
}

