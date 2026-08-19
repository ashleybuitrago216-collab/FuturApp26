import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { BtnGhost } from "../components/ui/Button";
import { Ic } from "../components/ui/Icon";
import { normalizeNotificationsFromApi } from "../domains/notifications/services/notificationMappers";
import { notificationsApi } from "../domains/notifications/services/notificationsApi";

export function NotifModule({ flash, setNotificationUnread }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const unread = useMemo(
    () => notifications.filter(notification => !notification.leida).length,
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    const response = await notificationsApi.getNotifications();
    return normalizeNotificationsFromApi(response);
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const mapped = await fetchNotifications();
      setNotifications(mapped);
      setNotificationUnread?.(mapped.filter(notification => !notification.leida).length);
      return mapped;
    } catch (error) {
      flash(error?.message || "No se pudieron cargar las notificaciones.", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications, flash, setNotificationUnread]);

  useEffect(() => {
    let active = true;

    async function loadInitialNotifications() {
      try {
        const mapped = await fetchNotifications();
        if (!active) return;
        setNotifications(mapped);
        setNotificationUnread?.(mapped.filter(notification => !notification.leida).length);
      } catch (error) {
        if (active) flash(error?.message || "No se pudieron cargar las notificaciones.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialNotifications();

    return () => {
      active = false;
    };
  }, [fetchNotifications, flash, setNotificationUnread]);

  useEffect(() => {
    setNotificationUnread?.(unread);
  }, [setNotificationUnread, unread]);

  const markRead = async id => {
    const current = notifications.find(notification => notification.id === id);
    if (!current || current.leida) return;

    try {
      await notificationsApi.markAsRead(id);
      await refreshNotifications();
    } catch (error) {
      flash(error?.message || "No se pudo marcar la notificacion.", "error");
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllAsRead();
      await refreshNotifications();
      flash("Todas marcadas como leidas.");
    } catch (error) {
      flash(error?.message || "No se pudieron marcar las notificaciones.", "error");
    }
  };

  const tipoColor = { cita: "#2563EB", pago: "#2C6E49", servicio: "#C84B31", sistema: "#D97706" };
  const tipoIcon  = { cita: "cal", pago: "pay", servicio: "tool", sistema: "shield" };

  return (
    <div>
      <PageHead title="Notificaciones" sub="RF011 · RF017 · Alertas en tiempo real sobre citas, pagos y servicios" action={<BtnGhost onClick={markAll} icon="check">Marcar todas leidas</BtnGhost>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <p style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 14 }}>Cargando notificaciones...</p>}
        {!loading && notifications.map(n => (
          <div className="notification-item" key={n.id} onClick={() => markRead(n.id)} style={{ background: "var(--surface)", border: `1.5px solid ${n.leida ? "var(--border)" : tipoColor[n.tipo] || "var(--border)"}`, borderLeft: `5px solid ${n.leida ? "var(--border)" : tipoColor[n.tipo] || "var(--accent)"}`, borderRadius: 11, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, opacity: n.leida ? 0.7 : 1, transition: "all 0.15s" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: (tipoColor[n.tipo] || "#888") + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tipoColor[n.tipo] || "var(--text2)", flexShrink: 0 }}>
              <Ic n={tipoIcon[n.tipo] || "bell"} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: n.leida ? 400 : 600, color: n.leida ? "var(--text2)" : "var(--text)", margin: 0, lineHeight: 1.5 }}>{n.mensaje}</p>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{n.fecha}</span>
            </div>
            {!n.leida && <div style={{ width: 9, height: 9, borderRadius: 50, background: "var(--accent)", flexShrink: 0 }} />}
          </div>
        ))}
        {!loading && notifications.length === 0 && <p style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 14 }}>No tienes notificaciones.</p>}
      </div>
    </div>
  );
}
