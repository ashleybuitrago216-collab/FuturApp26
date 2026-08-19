import { usersService } from "./users.service.js";

export async function getUsersStatus(req, res, next) {
  try {
    res.json(await usersService.list(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getTechniciansStatus(req, res, next) {
  try {
    res.json(await usersService.listTechnicians(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getUserCatalogs(req, res, next) {
  try {
    res.json(await usersService.getCatalogs(req.user));
  } catch (error) {
    next(error);
  }
}

export async function updateUserFromAdmin(req, res, next) {
  try {
    res.json(await usersService.updateFromAdmin(req.user, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(req, res, next) {
  try {
    res.json(await usersService.getMe(req.user));
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    res.json(await usersService.updateMe(req.user, req.body));
  } catch (error) {
    next(error);
  }
}
