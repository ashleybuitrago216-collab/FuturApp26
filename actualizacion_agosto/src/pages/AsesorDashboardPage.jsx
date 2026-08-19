import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { Badge } from "../components/ui/Badge";
import { BtnGhost } from "../components/ui/Button";
import { StatCard } from "../components/cards/StatCard";
import { advisoriesApi } from "../domains/advisories/services/advisoriesApi";
import { normalizeAdvisoriesFromApi, normalizeAdvisoryCommentsFromApi } from "../domains/advisories/services/advisoryMappers";
import { notificationsApi } from "../domains/notifications/services/notificationsApi";
import { normalizeNotificationsFromApi } from "../domains/notifications/services/notificationMappers";
import { profileApi } from "../domains/profile/services/profileApi";
import { normalizeProfileFromApi } from "../domains/profile/services/profileMappers";

export function AsesorDashboardPage({ session, setTab, setNotificationUnread, flash }) {
  const [profile, setProfile] = useState(session);
  const [advisories, setAdvisories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [commentsInfo, setCommentsInfo] = useState({ count: 0, relationAvailable: false, message: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setError("");
        const [profileResponse, advisoriesResponse, notificationsResponse] = await Promise.all([
          profileApi.getMyProfile(),
          advisoriesApi.listMyAdvisories(),
          notificationsApi.getNotifications(),
        ]);
        if (!active) return;

        const mappedAdvisories = normalizeAdvisoriesFromApi(advisoriesResponse);
        const mappedNotifications = normalizeNotificationsFromApi(notificationsResponse);
        setProfile(normalizeProfileFromApi(profileResponse));
        setAdvisories(mappedAdvisories);
        setNotifications(mappedNotifications);
        setNotificationUnread?.(mappedNotifications.filter(notification => !notification.leida).length);

        const commentsResponses = await Promise.all(mappedAdvisories.map(advisory => advisoriesApi.getAdvisoryComments(advisory.id)));
        if (!active) return;
        const mappedComments = commentsResponses.map(normalizeAdvisoryCommentsFromApi);
        setCommentsInfo({
          count: mappedComments.reduce((total, item) => total + item.comments.length, 0),
          relationAvailable: mappedComments.some(item => item.relationAvailable),
          message: mappedComments.find(item => item.message)?.message || "",
        });
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.message || "No se pudo cargar el panel de asesor.");
        flash?.(loadError?.message || "No se pudo cargar el panel de asesor.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [flash, setNotificationUnread, session]);

  const upcoming = useMemo(
    () => advisories.filter(advisory => !["Cancelada", "Completada", "Finalizada", "Asesoria resuelta", "Asesoría resuelta"].includes(advisory.estado)),
    [advisories],
  );
  const unread = notifications.filter(notification => !notification.leida).length;

  return (
    <div>
      <PageHead title="Panel de asesor" sub="Inicio / Asesoria" />

      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando panel de asesor...</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Hola, {profile.nombre}</h2>
            <Badge label="asesor" />
          </div>

          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard label="Asesorias proximas" value={upcoming.length} icon="chat" accent="#2563EB" />
            <StatCard label="No leidas" value={unread} icon="bell" accent="#D97706" />
            <StatCard label="Resenas" value={commentsInfo.count} icon="chat" accent="#2C6E49" />
          </div>

          <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <section className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 14, color: "var(--text)" }}>Perfil</h3>
              <p style={{ margin: "0 0 6px", color: "var(--text)", fontWeight: 700 }}>{profile.nombre} {profile.apellido}</p>
              <p style={{ margin: "0 0 6px", color: "var(--text2)", fontSize: 13 }}>{profile.correo}</p>
              <p style={{ margin: 0, color: "var(--text3)", fontSize: 13 }}>{profile.telefono || "Sin telefono registrado"}</p>
            </section>

            <section className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 14, color: "var(--text)" }}>Notificaciones recientes</h3>
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, color: "var(--text)", fontSize: 13, fontWeight: notification.leida ? 500 : 700 }}>{notification.mensaje}</p>
                  <span style={{ color: "var(--text3)", fontSize: 11 }}>{notification.fecha}</span>
                </div>
              ))}
              {notifications.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13, margin: 0 }}>No tienes notificaciones.</p>}
              <div style={{ marginTop: 12 }}><BtnGhost icon="bell" onClick={() => setTab("notificaciones")}>Ver notificaciones</BtnGhost></div>
            </section>
          </div>

          <section className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Asesorias programadas</h3>
              <BtnGhost icon="eye" onClick={() => setTab("asesorias")}>Ver todas</BtnGhost>
            </div>
            {upcoming.slice(0, 4).map(advisory => (
              <div key={advisory.id} style={{ display: "grid", gridTemplateColumns: "110px 80px 1fr auto", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                <span style={{ color: "var(--text2)", fontSize: 13 }}>{advisory.fecha}</span>
                <span style={{ color: "var(--text2)", fontSize: 13 }}>{advisory.hora}</span>
                <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 600 }}>{advisory.solicitante?.name || "Solicitante sin nombre"}</span>
                <Badge label={advisory.estado} />
              </div>
            ))}
            {upcoming.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13, margin: 0 }}>No tienes asesorias programadas.</p>}
          </section>

          <section className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginTop: 18 }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Resenas</h3>
            <p style={{ color: "var(--text3)", fontSize: 13, margin: 0 }}>
              {commentsInfo.relationAvailable ? `${commentsInfo.count} comentarios relacionados.` : commentsInfo.message || "No hay comentarios relacionados con tus asesorias."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
