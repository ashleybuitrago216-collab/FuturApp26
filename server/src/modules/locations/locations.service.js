import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { formatLocation, formatServiceLocation, formatServiceLocationStatus } from "./locations.mapper.js";
import { getRouteEstimate } from "./openRouteService.js";
import { crearNotificacionSistemaUnicaSegura } from "../notifications/notifications.service.js";

function isAdmin(user) {
  return user?.role === "admin";
}

function isTechnician(user) {
  return user?.role === "tecnico";
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertAllowed(condition, message = "No autorizado.") {
  if (!condition) throw createError(message, 403);
}

function toCoordinate(value, label, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw createError(`${label} invalida.`, 400);
  }

  return number;
}

function getPayloadNumber(payload, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      return value === null || value === "" ? null : Number(value);
    }
  }

  return undefined;
}

function getPayloadText(payload, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      return value == null ? "" : String(value).trim();
    }
  }

  return "";
}

function normalizeLocationPayload(payload = {}, { requireAccuracy = false } = {}) {
  const latitude = getPayloadNumber(payload, "latitude", "latitud", "lat");
  const longitude = getPayloadNumber(payload, "longitude", "longitud", "lng");
  const accuracy = getPayloadNumber(payload, "accuracyMeters", "precisionMetros", "precision_metros", "accuracy");
  const source = getPayloadText(payload, "source", "fuente") || (requireAccuracy ? "gps" : "manual");
  const addressReference = getPayloadText(payload, "addressReference", "direccionReferencia", "direccion_referencia");

  return {
    latitude: toCoordinate(latitude, "Latitud", -90, 90),
    longitude: toCoordinate(longitude, "Longitud", -180, 180),
    accuracy: accuracy == null
      ? null
      : toCoordinate(accuracy, "Precision", 0, 100000),
    source: source.slice(0, 30),
    addressReference: addressReference ? addressReference.slice(0, 255) : null,
  };
}

function distanceInMeters(origin, destination) {
  if (!origin || !destination) return null;

  const lat1 = Number(origin.latitud);
  const lon1 = Number(origin.longitud);
  const lat2 = Number(destination.latitud);
  const lon2 = Number(destination.longitud);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const earthRadiusMeters = 6371000;
  const toRadians = degrees => degrees * Math.PI / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function estimateEtaMinutes(distanceMeters) {
  if (distanceMeters == null) return null;
  const urbanMetersPerMinute = 350;
  return Math.max(1, Math.round(distanceMeters / urbanMetersPerMinute));
}

function normalizePositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

async function findService(serviceId) {
  return prisma.solicitudServicio.findUnique({
    where: { idSolicitudServicio: Number(serviceId) },
    include: {
      usuario: true,
      citas: {
        include: { tecnico: true },
        orderBy: { idCita: "asc" },
      },
      ubicacionServicio: true,
    },
  });
}

function getAssignedTechnicianId(service) {
  return service?.citas?.find(cita => cita.idUsuarioTecnico)?.idUsuarioTecnico || null;
}

function assertCanViewServiceLocation(authUser, service) {
  if (isAdmin(authUser)) return;
  if (service.idUsuario === authUser.id) return;
  if (getAssignedTechnicianId(service) === authUser.id) return;

  assertAllowed(false);
}

function assertCanEditServiceLocation(authUser, service) {
  assertAllowed(authUser?.role === "usuario", "Solo el usuario puede registrar la ubicacion del servicio.");
  assertAllowed(service.idUsuario === authUser.id, "Solo puedes editar la ubicacion de tus servicios.");
}

function assertCanShareTechnicianLocation(authUser, service) {
  assertAllowed(isTechnician(authUser), "Solo el tecnico puede compartir su ubicacion.");
  assertAllowed(getAssignedTechnicianId(service) === authUser.id, "Solo puedes compartir ubicacion en servicios asignados a ti.");
}

async function evaluateTechnicianProximity({ service, technicianLocation }) {
  if (!service?.ubicacionServicio || !technicianLocation) {
    return { distanceMeters: null, alerts: [] };
  }
  if (!service.idUsuario || service.idUsuario === technicianLocation.idUsuario) {
    return { distanceMeters: null, alerts: [] };
  }

  const distanceMeters = distanceInMeters(technicianLocation, service.ubicacionServicio);
  if (distanceMeters == null) return { distanceMeters: null, alerts: [] };

  const arrivalRadius = normalizePositiveNumber(env.geo.arrivalRadiusMeters, 100);
  const nearRadius = normalizePositiveNumber(env.geo.nearRadiusMeters, 300);
  const alerts = [];

  if (distanceMeters <= arrivalRadius) {
    const message = `El tecnico llego a tu ubicacion para el servicio #${service.idSolicitudServicio}.`;
    const result = await crearNotificacionSistemaUnicaSegura({
      idUsuario: service.idUsuario,
      tipo: "servicio",
      titulo: "Tecnico llego",
      mensaje: message,
      evento: "tecnico_llego",
      referenciaTipo: "solicitud_servicio",
      referenciaId: service.idSolicitudServicio,
      dedupeKey: `geo:tecnico_llego:servicio:${service.idSolicitudServicio}`,
    });

    if (result.created) {
      alerts.push({
        type: "arrived",
        event: "technicianArrived",
        message,
        distanceMeters,
        thresholdMeters: arrivalRadius,
      });
    }
  } else if (distanceMeters <= nearRadius) {
    const message = `El tecnico esta cerca de tu ubicacion para el servicio #${service.idSolicitudServicio}.`;
    const result = await crearNotificacionSistemaUnicaSegura({
      idUsuario: service.idUsuario,
      tipo: "servicio",
      titulo: "Tecnico cerca",
      mensaje: message,
      evento: "tecnico_cerca",
      referenciaTipo: "solicitud_servicio",
      referenciaId: service.idSolicitudServicio,
      dedupeKey: `geo:tecnico_cerca:servicio:${service.idSolicitudServicio}`,
    });

    if (result.created) {
      alerts.push({
        type: "near",
        event: "technicianNear",
        message,
        distanceMeters,
        thresholdMeters: nearRadius,
      });
    }
  }

  return { distanceMeters, alerts };
}

export async function canAccessServiceLocation(authUser, serviceId) {
  if (!authUser) return false;

  const service = await findService(serviceId);
  if (!service) return false;

  if (isAdmin(authUser)) return true;
  if (authUser.role === "usuario" && service.idUsuario === authUser.id) return true;
  if (isTechnician(authUser) && getAssignedTechnicianId(service) === authUser.id) return true;

  return false;
}

function getWhereByRole(authUser) {
  if (isAdmin(authUser)) return {};
  if (isTechnician(authUser)) return { idUsuario: authUser.id };

  return {
    usuario: {
      citasTecnico: {
        some: {
          idUsuarioCliente: authUser.id,
        },
      },
    },
  };
}

const includeRelations = {
  usuario: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
      areaEspecialidad: true,
    },
  },
};

export const locationsService = {
  async list(authUser) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const locations = await prisma.ubicacionTecnico.findMany({
      where: getWhereByRole(authUser),
      include: includeRelations,
      orderBy: { idUbicacionTecnico: "asc" },
    });

    return locations.map(formatLocation);
  },

  async getServiceLocationStatus(authUser, serviceId) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const service = await findService(serviceId);
    if (!service) throw createError("Servicio no encontrado.", 404);
    assertCanViewServiceLocation(authUser, service);

    const technicianLocation = await prisma.ubicacionTecnico.findFirst({
      where: { idSolicitudServicio: service.idSolicitudServicio },
      include: includeRelations,
      orderBy: { fechaRegistro: "desc" },
    });
    const distanceMeters = distanceInMeters(technicianLocation, service.ubicacionServicio);

    return formatServiceLocationStatus({
      service,
      serviceLocation: service.ubicacionServicio,
      technicianLocation,
      distanceMeters,
      etaMinutes: estimateEtaMinutes(distanceMeters),
    });
  },

  async upsertServiceLocation(authUser, serviceId, payload = {}) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const service = await findService(serviceId);
    if (!service) throw createError("Servicio no encontrado.", 404);
    assertCanEditServiceLocation(authUser, service);

    const location = normalizeLocationPayload(payload);
    const saved = await prisma.ubicacionServicio.upsert({
      where: { idSolicitudServicio: service.idSolicitudServicio },
      update: {
        latitud: location.latitude,
        longitud: location.longitude,
        direccionReferencia: location.addressReference,
        fuente: location.source,
      },
      create: {
        idSolicitudServicio: service.idSolicitudServicio,
        latitud: location.latitude,
        longitud: location.longitude,
        direccionReferencia: location.addressReference,
        fuente: location.source,
      },
    });

    return formatServiceLocation(saved);
  },

  async createTechnicianLocation(authUser, serviceId, payload = {}) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const service = await findService(serviceId);
    if (!service) throw createError("Servicio no encontrado.", 404);
    assertCanShareTechnicianLocation(authUser, service);

    const location = normalizeLocationPayload(payload, { requireAccuracy: true });
    const saved = await prisma.ubicacionTecnico.create({
      data: {
        idUsuario: authUser.id,
        idSolicitudServicio: service.idSolicitudServicio,
        latitud: location.latitude,
        longitud: location.longitude,
        precisionMetros: location.accuracy,
        fuente: location.source || "gps",
      },
      include: includeRelations,
    });

    const proximity = await evaluateTechnicianProximity({
      service,
      technicianLocation: saved,
    });
    const formatted = formatLocation(saved);

    return {
      location: formatted,
      proximity,
    };
  },

  async getTechnicianLocationHistory(authUser, serviceId) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const service = await findService(serviceId);
    if (!service) throw createError("Servicio no encontrado.", 404);
    assertCanViewServiceLocation(authUser, service);

    const locations = await prisma.ubicacionTecnico.findMany({
      where: { idSolicitudServicio: service.idSolicitudServicio },
      include: includeRelations,
      orderBy: { fechaRegistro: "asc" },
    });

    return locations.map(formatLocation);
  },

  async getServiceRoute(authUser, serviceId) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const service = await findService(serviceId);
    if (!service) throw createError("Servicio no encontrado.", 404);
    assertCanViewServiceLocation(authUser, service);

    if (!service.ubicacionServicio) {
      return { message: "Este servicio aun no tiene ubicacion registrada." };
    }

    const technicianLocation = await prisma.ubicacionTecnico.findFirst({
      where: { idSolicitudServicio: service.idSolicitudServicio },
      include: includeRelations,
      orderBy: { fechaRegistro: "desc" },
    });

    if (!technicianLocation) {
      return { message: "El tecnico aun no ha compartido su ubicacion." };
    }

    const fallbackDistanceMeters = distanceInMeters(technicianLocation, service.ubicacionServicio);
    const routeResult = await getRouteEstimate({
      originLat: technicianLocation.latitud,
      originLng: technicianLocation.longitud,
      destinationLat: service.ubicacionServicio.latitud,
      destinationLng: service.ubicacionServicio.longitud,
      fallbackDistanceMeters,
    });

    return {
      serviceId: service.idSolicitudServicio,
      solicitudServicioId: service.idSolicitudServicio,
      ...routeResult,
    };
  },
};
