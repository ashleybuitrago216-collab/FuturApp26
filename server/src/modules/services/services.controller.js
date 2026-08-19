import { servicesService } from "./services.service.js";

export async function getServicesStatus(req, res, next) {
  try {
    res.json(await servicesService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    res.status(201).json(await servicesService.create(req.user, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function updateService(req, res, next) {
  try {
    res.json(await servicesService.update(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function completeService(req, res, next) {
  try {
    res.json(await servicesService.complete(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function cancelService(req, res, next) {
  try {
    res.json(await servicesService.cancel(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}
