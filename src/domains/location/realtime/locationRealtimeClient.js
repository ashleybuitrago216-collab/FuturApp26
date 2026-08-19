export function createLocationRealtimeClient() {
  return {
    connect() {},
    disconnect() {},
    publishLocation() {},
    subscribeToTechnicianLocation() {
      return () => {};
    },
  };
}

