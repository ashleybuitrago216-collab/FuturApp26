import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { authService } from "../auth/auth.service.js";
import { canAccessServiceLocation } from "./locations.service.js";

const LOCATION_EVENTS = {
  join: "joinServiceLocation",
  leave: "leaveServiceLocation",
  updated: "technicianLocationUpdated",
  near: "technicianNear",
  arrived: "technicianArrived",
  error: "locationSocketError",
};

export function serviceLocationRoom(serviceId) {
  return `service:${Number(serviceId)}`;
}

function createSocketError(message, code = "LOCATION_SOCKET_ERROR") {
  return { code, message };
}

async function verifySocketToken(token) {
  if (!token) throw new Error("Token requerido.");

  const payload = jwt.verify(token, env.jwtSecret);
  const user = await authService.findMe(payload.userId);
  if (!user) throw new Error("Usuario no encontrado.");

  return user;
}

export function registerLocationSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      socket.user = await verifySocketToken(token);
      next();
    } catch {
      next(new Error("No autorizado."));
    }
  });

  io.on("connection", socket => {
    socket.on(LOCATION_EVENTS.join, async (payload = {}, ack) => {
      const serviceId = Number(payload.serviceId || payload.solicitudServicioId);

      try {
        if (!Number.isInteger(serviceId) || serviceId <= 0) {
          throw new Error("Servicio invalido.");
        }

        const allowed = await canAccessServiceLocation(socket.user, serviceId);
        if (!allowed) {
          throw new Error("No autorizado para consultar la ubicacion de este servicio.");
        }

        const room = serviceLocationRoom(serviceId);
        await socket.join(room);
        ack?.({ ok: true, room });
      } catch (error) {
        const payloadError = createSocketError(error.message || "No se pudo unir al room.", "JOIN_SERVICE_LOCATION_FAILED");
        socket.emit(LOCATION_EVENTS.error, payloadError);
        ack?.({ ok: false, error: payloadError.message });
      }
    });

    socket.on(LOCATION_EVENTS.leave, async (payload = {}, ack) => {
      const serviceId = Number(payload.serviceId || payload.solicitudServicioId);

      if (Number.isInteger(serviceId) && serviceId > 0) {
        await socket.leave(serviceLocationRoom(serviceId));
      }

      ack?.({ ok: true });
    });
  });
}

export { LOCATION_EVENTS };
