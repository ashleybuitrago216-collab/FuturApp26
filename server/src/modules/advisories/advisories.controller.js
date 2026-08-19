import { advisoriesService } from "./advisories.service.js";

export async function createAdvisory(req, res, next) {
  try {
    res.status(201).json(await advisoriesService.create(req.user, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function getAdvisoryCatalogs(req, res, next) {
  try {
    res.json(await advisoriesService.catalogs(req.user));
  } catch (error) {
    next(error);
  }
}

export async function assignAdvisory(req, res, next) {
  try {
    res.json(await advisoriesService.assign(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function listAdvisories(req, res, next) {
  try {
    res.json(await advisoriesService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getAdvisoryById(req, res, next) {
  try {
    res.json(await advisoriesService.getById(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function getAdvisoryComments(req, res, next) {
  try {
    res.json(await advisoriesService.getComments(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function getAdvisoryMessages(req, res, next) {
  try {
    res.json(await advisoriesService.getMessages(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function sendAdvisoryMessage(req, res, next) {
  try {
    res.status(201).json(await advisoriesService.sendMessage(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function resolveAdvisory(req, res, next) {
  try {
    res.json(await advisoriesService.resolve(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}
