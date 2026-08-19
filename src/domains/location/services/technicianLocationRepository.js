export function createTechnicianLocationRepository({ realtimeClient, storage } = {}) {
  return {
    getLatestByTechnician() {
      return null;
    },
    saveSnapshot(snapshot) {
      storage?.setItem?.(`technician-location:${snapshot.technicianId}`, snapshot);
      realtimeClient?.publish?.("technician-location.updated", snapshot);
      return snapshot;
    },
    subscribeToTechnician() {
      return realtimeClient?.subscribe?.("technician-location.updated") || (() => {});
    },
  };
}

