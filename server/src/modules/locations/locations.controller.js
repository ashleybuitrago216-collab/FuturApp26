import { locationsService } from "./locations.service.js";
import { LOCATION_EVENTS, serviceLocationRoom } from "./locations.socket.js";

export async function getLocationsStatus(req, res, next) {
  try {
    res.json(await locationsService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getServiceLocationStatus(req, res, next) {
  try {
    res.json(await locationsService.getServiceLocationStatus(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function upsertServiceLocation(req, res, next) {
  try {
    res.json(await locationsService.upsertServiceLocation(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function createTechnicianLocation(req, res, next) {
  try {
    const result = await locationsService.createTechnicianLocation(req.user, req.params.id, req.body || {});
    const technicianLocation = result.location;
    const status = await locationsService.getServiceLocationStatus(req.user, req.params.id);
    const io = req.app.get("io");

    io?.to(serviceLocationRoom(req.params.id)).emit(LOCATION_EVENTS.updated, {
      serviceId: status.serviceId,
      solicitudServicioId: status.solicitudServicioId,
      technicianLocation: status.technicianLocation,
      ubicacionTecnico: status.ubicacionTecnico,
      historyPoint: technicianLocation,
      tracking: {
        active: true,
        distanceMeters: status.distanceMeters,
        distanciaMetros: status.distanciaMetros,
        etaMinutes: status.etaMinutes,
        tiempoEstimadoMinutos: status.tiempoEstimadoMinutos,
      },
      updatedAt: technicianLocation.createdAt,
    });

    for (const alert of result.proximity?.alerts || []) {
      io?.to(serviceLocationRoom(req.params.id)).emit(alert.event, {
        serviceId: status.serviceId,
        solicitudServicioId: status.solicitudServicioId,
        type: alert.type,
        message: alert.message,
        distanceMeters: alert.distanceMeters,
        thresholdMeters: alert.thresholdMeters,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json(technicianLocation);
  } catch (error) {
    next(error);
  }
}

export async function getTechnicianLocationHistory(req, res, next) {
  try {
    res.json(await locationsService.getTechnicianLocationHistory(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function getServiceRoute(req, res, next) {
  try {
    res.json(await locationsService.getServiceRoute(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}
