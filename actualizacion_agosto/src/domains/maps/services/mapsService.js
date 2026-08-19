export function createMapProviderConfig(config = {}) {
  return {
    provider: config.provider || null,
    apiKey: config.apiKey || null,
  };
}

