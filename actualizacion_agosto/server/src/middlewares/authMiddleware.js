import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { authService } from "../modules/auth/auth.service.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token de autenticación requerido." });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = await authService.findMe(payload.userId);
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
}
