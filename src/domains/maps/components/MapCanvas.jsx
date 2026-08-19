import { useEffect, useMemo } from "react";
import { CircleMarker, GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [4.711, -74.0721];

function createPinIcon(color) {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.28);"><span style="display:block;width:6px;height:6px;border-radius:50%;background:#fff;margin:6px auto 0;"></span></span>`,
  });
}

const serviceIcon = createPinIcon("#2C6E49");
const technicianIcon = createPinIcon("#2563EB");

function toPoint(location) {
  const latitude = Number(location?.latitude ?? location?.latitud);
  const longitude = Number(location?.longitude ?? location?.longitud);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return [latitude, longitude];
}

function formatDistance(value) {
  const meters = Number(value);
  if (!Number.isFinite(meters)) return "Pendiente";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDate(value) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function geometryToPoints(geometry) {
  if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) return [];

  return geometry.coordinates
    .map(([longitude, latitude]) => [Number(latitude), Number(longitude)])
    .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    const validPoints = points.filter(Boolean);
    if (validPoints.length === 0) return;

    if (validPoints.length === 1) {
      map.setView(validPoints[0], 14, { animate: false });
      return;
    }

    map.fitBounds(validPoints, {
      padding: [34, 34],
      maxZoom: 15,
      animate: false,
    });
  }, [map, points]);

  return null;
}

export function MapCanvas({
  serviceLocation,
  technicianLocation,
  technicianHistory = [],
  distanceMeters,
  etaMinutes,
  durationSeconds,
  routeGeometry,
  routeFallback = false,
  routeMessage = "",
  height = 360,
}) {
  const servicePoint = toPoint(serviceLocation);
  const technicianPoint = toPoint(technicianLocation);
  const historyPoints = useMemo(
    () => technicianHistory.map(toPoint).filter(Boolean),
    [technicianHistory],
  );
  const routeGeometryPoints = useMemo(() => geometryToPoints(routeGeometry), [routeGeometry]);
  const mapPoints = useMemo(
    () => [servicePoint, technicianPoint, ...historyPoints, ...routeGeometryPoints].filter(Boolean),
    [servicePoint, technicianPoint, historyPoints, routeGeometryPoints],
  );
  const center = mapPoints[0] || DEFAULT_CENTER;
  const routePoints = !routeGeometry && servicePoint && technicianPoint ? [technicianPoint, servicePoint] : [];
  const etaLabel = durationSeconds
    ? `${Math.max(1, Math.round(Number(durationSeconds) / 60))} min`
    : etaMinutes ? `${etaMinutes} min` : "Pendiente";

  if (mapPoints.length === 0) {
    return (
      <div style={{ minHeight: height, display: "grid", placeItems: "center", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface2)", color: "var(--text3)", fontSize: 14 }}>
        Sin coordenadas registradas para este servicio.
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--surface2)" }}>
      <MapContainer center={center} zoom={14} style={{ height, width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={mapPoints} />
        {routeGeometry && <GeoJSON data={{ type: "Feature", properties: {}, geometry: routeGeometry }} pathOptions={{ color: "#2563EB", weight: 5, opacity: 0.85 }} />}
        {routePoints.length > 0 && <Polyline positions={routePoints} pathOptions={{ color: "#2563EB", weight: 4, opacity: 0.75, dashArray: "8 8" }} />}
        {historyPoints.length > 1 && <Polyline positions={historyPoints} pathOptions={{ color: "#D97706", weight: 3, opacity: 0.6 }} />}
        {historyPoints.map((point, index) => (
          <CircleMarker key={`${point[0]}-${point[1]}-${index}`} center={point} radius={4} pathOptions={{ color: "#D97706", fillColor: "#D97706", fillOpacity: 0.55 }}>
            <Popup>Registro #{index + 1}</Popup>
          </CircleMarker>
        ))}
        {servicePoint && (
          <Marker position={servicePoint} icon={serviceIcon}>
            <Popup>
              <strong>Servicio</strong>
              <br />
              {serviceLocation?.addressReference || serviceLocation?.direccionReferencia || "Ubicacion registrada"}
            </Popup>
          </Marker>
        )}
        {technicianPoint && (
          <Marker position={technicianPoint} icon={technicianIcon}>
            <Popup>
              <strong>Tecnico</strong>
              <br />
              Ultimo registro: {formatDate(technicianLocation?.createdAt || technicianLocation?.fechaRegistro)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "10px 12px", borderTop: "1px solid var(--border)", color: "var(--text2)", fontSize: 13 }}>
        <span>Distancia: <strong style={{ color: "var(--text)" }}>{formatDistance(distanceMeters)}</strong></span>
        <span>ETA: <strong style={{ color: "var(--text)" }}>{etaLabel}</strong></span>
        <span>Historial: <strong style={{ color: "var(--text)" }}>{historyPoints.length}</strong></span>
        {routeFallback && <span style={{ color: "#D97706" }}>{routeMessage || "Mostrando distancia aproximada"}</span>}
      </div>
    </div>
  );
}
