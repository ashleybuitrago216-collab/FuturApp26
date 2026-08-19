import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { authTokenStorage } from "../../auth/services/authTokenStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

const INITIAL_STATE = {
  status: "disconnected",
  connected: false,
  lastUpdatedAt: null,
  error: "",
};

export function useServiceLocationSocket({ serviceId, enabled, onLocationUpdated, onTrackingAlert }) {
  const [state, setState] = useState(INITIAL_STATE);
  const callbackRef = useRef(onLocationUpdated);
  const alertCallbackRef = useRef(onTrackingAlert);

  useEffect(() => {
    callbackRef.current = onLocationUpdated;
  }, [onLocationUpdated]);

  useEffect(() => {
    alertCallbackRef.current = onTrackingAlert;
  }, [onTrackingAlert]);

  useEffect(() => {
    if (!enabled || !serviceId) {
      return undefined;
    }

    const token = authTokenStorage.getToken();
    if (!token) {
      queueMicrotask(() => {
        setState({ ...INITIAL_STATE, status: "error", error: "Sesion no disponible." });
      });
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1200,
    });

    const joinRoom = () => {
      setState(current => ({ ...current, status: "connecting", error: "" }));
      socket.emit("joinServiceLocation", { serviceId }, response => {
        if (response?.ok) {
          setState(current => ({ ...current, status: "connected", connected: true, error: "" }));
        } else {
          setState(current => ({
            ...current,
            status: "error",
            connected: false,
            error: response?.error || "No se pudo activar el seguimiento.",
          }));
        }
      });
    };

    socket.on("connect", joinRoom);
    socket.on("reconnect_attempt", () => {
      setState(current => ({ ...current, status: "reconnecting", connected: false }));
    });
    socket.on("disconnect", () => {
      setState(current => ({ ...current, status: "disconnected", connected: false }));
    });
    socket.on("connect_error", () => {
      setState(current => ({
        ...current,
        status: "error",
        connected: false,
        error: "No se pudo conectar al seguimiento en tiempo real.",
      }));
    });
    socket.on("locationSocketError", payload => {
      setState(current => ({
        ...current,
        status: "error",
        connected: false,
        error: payload?.message || "Error de seguimiento en tiempo real.",
      }));
    });
    socket.on("technicianLocationUpdated", payload => {
      setState(current => ({
        ...current,
        status: "connected",
        connected: true,
        lastUpdatedAt: new Date().toISOString(),
        error: "",
      }));
      callbackRef.current?.(payload);
    });
    socket.on("technicianNear", payload => {
      alertCallbackRef.current?.(payload);
    });
    socket.on("technicianArrived", payload => {
      alertCallbackRef.current?.(payload);
    });

    return () => {
      socket.emit("leaveServiceLocation", { serviceId });
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [enabled, serviceId]);

  return enabled && serviceId ? state : INITIAL_STATE;
}
