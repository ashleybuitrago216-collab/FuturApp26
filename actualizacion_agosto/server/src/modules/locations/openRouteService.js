import { env } from "../../config/env.js";

const routeCache = new Map();

function cacheKey({ originLat, originLng, destinationLat, destinationLng }) {
  return [
    Number(originLat).toFixed(6),
    Number(originLng).toFixed(6),
    Number(destinationLat).toFixed(6),
    Number(destinationLng).toFixed(6),
    env.ors.profile,
  ].join(":");
}

function isValidCoordinate(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function buildFallback({ fallbackDistanceMeters, message = "No se pudo calcular la ruta real. Se muestra distancia aproximada." } = {}) {
  return {
    route: {
      distanceMeters: fallbackDistanceMeters ?? null,
      durationSeconds: null,
      geometry: null,
    },
    fallback: true,
    message,
  };
}

function getCachedRoute(key) {
  const cached = routeCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    routeCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedRoute(key, value) {
  const seconds = Number.isFinite(env.ors.routeCacheSeconds) ? env.ors.routeCacheSeconds : 30;
  if (seconds <= 0) return;

  routeCache.set(key, {
    value,
    expiresAt: Date.now() + seconds * 1000,
  });
}

export async function getRouteEstimate({
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  fallbackDistanceMeters,
} = {}) {
  if (!isValidCoordinate(originLat, -90, 90)
    || !isValidCoordinate(destinationLat, -90, 90)
    || !isValidCoordinate(originLng, -180, 180)
    || !isValidCoordinate(destinationLng, -180, 180)) {
    return buildFallback({ fallbackDistanceMeters, message: "Coordenadas incompletas para calcular la ruta." });
  }

  if (!env.ors.apiKey) {
    return buildFallback({ fallbackDistanceMeters, message: "No se pudo calcular la ruta real. Se muestra distancia aproximada." });
  }

  const key = cacheKey({ originLat, originLng, destinationLat, destinationLng });
  const cached = getCachedRoute(key);
  if (cached) return cached;

  try {
    const baseUrl = String(env.ors.baseUrl || "https://api.openrouteservice.org").replace(/\/+$/, "");
    const profile = encodeURIComponent(env.ors.profile || "driving-car");
    const response = await fetch(`${baseUrl}/v2/directions/${profile}/geojson`, {
      method: "POST",
      headers: {
        Accept: "application/geo+json, application/json",
        Authorization: env.ors.apiKey,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        coordinates: [
          [Number(originLng), Number(originLat)],
          [Number(destinationLng), Number(destinationLat)],
        ],
      }),
    });

    if (!response.ok) {
      return buildFallback({ fallbackDistanceMeters });
    }

    const data = await response.json();
    const feature = data?.features?.[0];
    const summary = feature?.properties?.summary;
    const result = {
      route: {
        distanceMeters: Number.isFinite(Number(summary?.distance)) ? Number(summary.distance) : null,
        durationSeconds: Number.isFinite(Number(summary?.duration)) ? Number(summary.duration) : null,
        geometry: feature?.geometry || null,
      },
      fallback: false,
      message: "",
    };

    setCachedRoute(key, result);
    return result;
  } catch {
    return buildFallback({ fallbackDistanceMeters });
  }
}
