export function createRealtimeClient() {
  return {
    connect() {},
    disconnect() {},
    subscribe() {
      return () => {};
    },
    publish() {},
  };
}

