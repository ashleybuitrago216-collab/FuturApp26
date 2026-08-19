import { authService } from "./auth.service.js";

export function getAuthStatus(req, res) {
  res.json(authService.getStatus());
}

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    res.json(await authService.login(req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    res.json(await authService.forgotPassword(req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    res.json(await authService.resetPassword(req.body || {}));
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}

export function logout(req, res) {
  res.json({ message: "Sesión cerrada correctamente." });
}
