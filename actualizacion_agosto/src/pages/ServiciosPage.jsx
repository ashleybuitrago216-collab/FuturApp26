import { useCallback, useEffect, useRef, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { Table } from "../components/tables/Table";
import { Modal } from "../components/modals/Modal";
import { BtnPrimary, BtnGhost, IconBtn } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Field, Grid2 } from "../components/ui/Field";
import { inputSt } from "../components/ui/fieldStyles";
import { normalizeServiceStatus, SERVICE_STATUS, VALID_SERVICE_STATUSES } from "../domains/services/model/servicesModel";
import { mapServiceToApiPayload, normalizeServiceFromApi } from "../domains/services/services/serviceMappers";
import { servicesApi } from "../domains/services/services/servicesApi";
import { quotesApi } from "../domains/quotes/services/quotesApi";
import { usersApi } from "../domains/users/services/usersApi";
import { MapCanvas } from "../domains/maps/components/MapCanvas";
import { useServiceLocationSocket } from "../domains/locations/services/locationSocket";
import { cop, hoy, timestamp } from "../utils/helpers";

const emptyLocation = {
  latitude: "",
  longitude: "",
  addressReference: "",
  source: "manual",
};

function serviceLocationToForm(location) {
  return {
    latitude: location?.latitude ?? location?.latitud ?? "",
    longitude: location?.longitude ?? location?.longitud ?? "",
    addressReference: location?.addressReference ?? location?.direccionReferencia ?? "",
    source: location?.source ?? location?.fuente ?? "manual",
  };
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Tu navegador no permite obtener ubicacion."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000,
    });
  });
}

function formatRealtimeStatus(socketState) {
  if (socketState.status === "connected") return "Conectado en tiempo real";
  if (socketState.status === "connecting") return "Conectando...";
  if (socketState.status === "reconnecting") return "Reconectando...";
  if (socketState.status === "error") return socketState.error || "Sin conexion en tiempo real";
  return "Sin conexion en tiempo real";
}

function isSameLocationPoint(a, b) {
  if (!a || !b) return false;
  const aId = a.id ?? a.idUbicacionTecnico;
  const bId = b.id ?? b.idUbicacionTecnico;
  if (aId && bId) return Number(aId) === Number(bId);

  return String(a.createdAt || a.fechaRegistro || "") === String(b.createdAt || b.fechaRegistro || "")
    && Number(a.latitude ?? a.latitud) === Number(b.latitude ?? b.latitud)
    && Number(a.longitude ?? a.longitud) === Number(b.longitude ?? b.longitud);
}

function hasBothLocationPoints(status) {
  return Boolean((status?.serviceLocation || status?.ubicacionServicio)
    && (status?.technicianLocation || status?.ubicacionTecnico));
}

export function ServiciosModule({ data, session, isAdmin, flash }) {
  const [modal, setModal] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ tipo: "", descripcion: "", fecha: hoy(), prioridad: "Media", location: emptyLocation });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [assignmentForms, setAssignmentForms] = useState({});
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ monto: "", descripcion: "" });
  const [technicians, setTechnicians] = useState([]);
  const [mapState, setMapState] = useState({ loading: false, status: null, history: [], route: null, routeLoading: false, routeMessage: "", trackingAlert: null });
  const lastRouteFetchRef = useRef(0);
  const refreshServiceRoute = useCallback(async (serviceId, { force = false } = {}) => {
    if (!serviceId) return;

    const now = Date.now();
    if (!force && now - lastRouteFetchRef.current < 30000) return;
    lastRouteFetchRef.current = now;

    setMapState(current => ({ ...current, routeLoading: true, routeMessage: "" }));

    try {
      const routeResponse = await servicesApi.getServiceRoute(serviceId);
      setMapState(current => ({
        ...current,
        route: routeResponse?.route || null,
        routeLoading: false,
        routeMessage: routeResponse?.message || "",
        status: routeResponse?.route?.distanceMeters
          ? {
            ...(current.status || {}),
            distanceMeters: routeResponse.route.distanceMeters,
            distanciaMetros: routeResponse.route.distanceMeters,
            etaMinutes: routeResponse.route.durationSeconds ? Math.max(1, Math.round(routeResponse.route.durationSeconds / 60)) : current.status?.etaMinutes,
            tiempoEstimadoMinutos: routeResponse.route.durationSeconds ? Math.max(1, Math.round(routeResponse.route.durationSeconds / 60)) : current.status?.tiempoEstimadoMinutos,
          }
          : current.status,
        routeFallback: Boolean(routeResponse?.fallback),
      }));
    } catch (error) {
      setMapState(current => ({
        ...current,
        route: null,
        routeLoading: false,
        routeMessage: error.message || "No se pudo calcular la ruta real. Mostrando distancia aproximada.",
        routeFallback: true,
      }));
    }
  }, []);
  const handleRealtimeLocationUpdated = useCallback(payload => {
    const historyPoint = payload?.historyPoint || payload?.technicianLocation || payload?.ubicacionTecnico;

    setMapState(current => ({
      ...current,
      status: {
        ...(current.status || {}),
        serviceId: payload?.serviceId ?? current.status?.serviceId,
        solicitudServicioId: payload?.solicitudServicioId ?? current.status?.solicitudServicioId,
        technicianLocation: payload?.technicianLocation || payload?.ubicacionTecnico || current.status?.technicianLocation,
        ubicacionTecnico: payload?.ubicacionTecnico || payload?.technicianLocation || current.status?.ubicacionTecnico,
        distanceMeters: payload?.tracking?.distanceMeters ?? payload?.tracking?.distanciaMetros ?? current.status?.distanceMeters,
        distanciaMetros: payload?.tracking?.distanciaMetros ?? payload?.tracking?.distanceMeters ?? current.status?.distanciaMetros,
        etaMinutes: payload?.tracking?.etaMinutes ?? payload?.tracking?.tiempoEstimadoMinutos ?? current.status?.etaMinutes,
        tiempoEstimadoMinutos: payload?.tracking?.tiempoEstimadoMinutos ?? payload?.tracking?.etaMinutes ?? current.status?.tiempoEstimadoMinutos,
      },
      history: historyPoint && !current.history.some(item => isSameLocationPoint(item, historyPoint))
        ? [...current.history, historyPoint]
        : current.history,
    }));

    refreshServiceRoute(payload?.serviceId || payload?.solicitudServicioId);
  }, [refreshServiceRoute]);
  const handleTrackingAlert = useCallback(payload => {
    setMapState(current => ({
      ...current,
      trackingAlert: {
        type: payload?.type || "near",
        message: payload?.message || "Actualizacion de seguimiento recibida.",
        distanceMeters: payload?.distanceMeters ?? null,
        createdAt: payload?.createdAt || new Date().toISOString(),
      },
    }));
  }, []);
  const locationSocket = useServiceLocationSocket({
    serviceId: selectedService?.id,
    enabled: modal === "location" && Boolean(selectedService?.id),
    onLocationUpdated: handleRealtimeLocationUpdated,
    onTrackingAlert: handleTrackingAlert,
  });
  const set = key => value => setForm(current => ({ ...current, [key]: value }));
  const setLocation = (key, value) => setForm(current => ({
    ...current,
    location: {
      ...emptyLocation,
      ...(current.location || {}),
      [key]: value,
    },
  }));
  const setAssignment = (serviceId, key, value) => {
    setAssignmentForms(current => ({
      ...current,
      [serviceId]: {
        tecnicoId: current[serviceId]?.tecnicoId ?? services.find(service => service.id === serviceId)?.tecnicoId ?? "",
        ...current[serviceId],
        [key]: value,
      },
    }));
  };

  const isTechnicianOnly = session.rol === "tecnico" && !isAdmin;
  const isUserOnly = session.rol === "usuario" && !isAdmin;
  const canCreateService = isUserOnly;
  const showServiceType = isAdmin || isTechnicianOnly;
  const canManageServicePriority = isAdmin;
  const canManageServiceStatus = isAdmin;
  const adminStatusOptions = VALID_SERVICE_STATUSES.filter(status => status !== SERVICE_STATUS.completed);
  const TIPOS = ["Mantenimiento de Software", "Mantenimiento de Hardware", "Soporte tecnico personalizado", "Mantenimiento preventivo"];

  const users = Array.isArray(data.users) ? data.users : [];
  const tecnicos = technicians;
  const getUser = id => {
    const localUser = users.find(user => user.id === id);
    const service = services.find(item => item.usuarioId === id || item.tecnicoId === id);
    const apiUser = service?.client?.id === id ? service.client : service?.technician?.id === id ? service.technician : null;
    if (localUser) return `${localUser.nombre} ${localUser.apellido || ""}`.trim();
    if (apiUser) return apiUser.name;
    return "Sin asignar";
  };
  const splitFechaHora = value => {
    const [fecha, ...horaParts] = String(value || "").split("T");
    return { fecha: fecha || "Pendiente", hora: horaParts.join("T").slice(0, 5) || "Pendiente" };
  };
  const hasUserEditWindow = service => Boolean(service?.editableUntil);
  const isWithinUserEditWindow = service => Boolean(service?.editableUntil && timestamp() <= service.editableUntil);

  const loadServices = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await servicesApi.getServices();
      setServices(response.map(normalizeServiceFromApi));
    } catch (error) {
      setLoadError(error.message || "No se pudieron cargar los servicios.");
      flash(error.message || "No se pudieron cargar los servicios.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    if (!isAdmin) return;

    try {
      setTechniciansLoading(true);
      const response = await usersApi.getTechnicians();
      setTechnicians(Array.isArray(response) ? response : []);
    } catch (error) {
      setTechnicians([]);
      flash(error.message || "No se pudieron cargar los tecnicos activos.", "error");
    } finally {
      setTechniciansLoading(false);
    }
  };

  useEffect(() => {
    // Servicios migro a API: la carga inicial depende del JWT ya restaurado.
    loadServices();
    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = service => {
    if (!isAdmin && !isTechnicianOnly && !isWithinUserEditWindow(service)) return flash("La descripcion solo se puede editar durante los primeros 5 minutos.", "error");
    setSelectedService(service);
    setForm({ tipo: service.tipo || "", descripcion: service.descripcion || "", fecha: service.fecha || hoy(), prioridad: service.prioridad || "Media", estado: normalizeServiceStatus(service.estado), tecnicoId: service.tecnicoId || "", location: serviceLocationToForm(service.serviceLocation) });
    setEditId(service.id);
    setModal("form");
  };

  const openDescription = service => {
    setSelectedService(service);
    setModal("description");
  };

  const openLocationMap = async service => {
    setSelectedService(service);
    setModal("location");
    setMapState({ loading: true, status: null, history: [], route: null, routeLoading: false, routeMessage: "", routeFallback: false, trackingAlert: null });

    try {
      const [status, history] = await Promise.all([
        servicesApi.getLocationStatus(service.id),
        servicesApi.getTechnicianLocationHistory(service.id),
      ]);
      setMapState({
        loading: false,
        status,
        history: Array.isArray(history) ? history : [],
        route: null,
        routeLoading: false,
        routeMessage: "",
        routeFallback: false,
        trackingAlert: null,
      });
      if (hasBothLocationPoints(status)) {
        await refreshServiceRoute(service.id, { force: true });
      } else if (!status?.serviceLocation && !status?.ubicacionServicio) {
        setMapState(current => ({ ...current, routeMessage: "Este servicio aun no tiene ubicacion registrada." }));
      } else if (!status?.technicianLocation && !status?.ubicacionTecnico) {
        setMapState(current => ({ ...current, routeMessage: "El tecnico aun no ha compartido su ubicacion." }));
      }
    } catch (error) {
      setMapState({ loading: false, status: null, history: [], route: null, routeLoading: false, routeMessage: "", routeFallback: false, trackingAlert: null });
      flash(error.message || "No se pudo cargar el mapa del servicio.", "error");
    }
  };

  const save = async () => {
    if (!editId && !canCreateService) return flash("El administrador no puede crear servicios. Solo puede gestionar servicios existentes.", "error");
    if (!form.descripcion && !isTechnicianOnly) return flash("Complete la descripcion.", "error");
    if (isAdmin && !form.tipo && !selectedService?.advisoryOriginId) return flash("Complete tipo y descripcion.", "error");

    try {
      setSaving(true);
      if (editId) {
        const payload = isTechnicianOnly
          ? { serviceType: form.tipo }
          : isAdmin && selectedService?.advisoryOriginId
            ? {
              description: form.descripcion,
              priority: form.prioridad,
              ...(form.estado !== SERVICE_STATUS.completed ? { status: form.estado } : {}),
              technicianId: form.tecnicoId,
            }
          : isAdmin
            ? {
              ...mapServiceToApiPayload(form),
              ...(form.estado === SERVICE_STATUS.completed ? { status: undefined } : {}),
            }
            : { description: form.descripcion, location: form.location };
        await servicesApi.updateService(editId, payload);
        flash("Servicio actualizado.");
      } else {
        await servicesApi.createService({ description: form.descripcion, location: form.location });
        flash("Servicio registrado.");
      }
      setModal(null);
      setEditId(null);
      setSelectedService(null);
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo guardar el servicio.", "error");
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      const position = await getBrowserPosition();
      setForm(current => ({
        ...current,
        location: {
          ...emptyLocation,
          ...(current.location || {}),
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8),
          source: "gps",
        },
      }));
      flash("Ubicacion obtenida desde el navegador.");
    } catch (error) {
      flash(error.message || "No se pudo obtener la ubicacion.", "error");
    }
  };

  const shareTechnicianLocation = async service => {
    try {
      const position = await getBrowserPosition();
      await servicesApi.shareTechnicianLocation(service.id, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
        source: "gps",
      });
      flash("Ubicacion del tecnico compartida.");
      if (modal === "location") {
        await openLocationMap(service);
      } else {
        await loadServices();
      }
    } catch (error) {
      flash(error.message || "No se pudo compartir la ubicacion.", "error");
    }
  };

  const assignTec = async (id) => {
    const assignment = assignmentForms[id] || {};
    const technicianId = assignment.tecnicoId ?? services.find(service => service.id === id)?.tecnicoId ?? "";
    if (!technicianId) return flash("Seleccione un tecnico activo.", "error");

    try {
      const response = await servicesApi.updateService(id, {
        technicianId: Number(technicianId) || null,
      });
      flash(response?.tecnicoId ? "Tecnico asignado. Pago no generado; valor pendiente por definir." : "Tecnico actualizado. Pago no generado; valor pendiente por definir.");
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo asignar tecnico.", "error");
    }
  };

  const setEstado = async (id, estado) => {
    if (!VALID_SERVICE_STATUSES.includes(estado)) return;
    try {
      await servicesApi.updateService(id, { status: estado });
      flash("Estado actualizado.");
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo actualizar el estado.", "error");
    }
  };

  const cancelarServicio = async id => {
    try {
      await servicesApi.cancelService(id);
      flash("Servicio cancelado.");
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo cancelar el servicio.", "error");
    }
  };

  const getQuote = service => service.quote || service.cotizacion || null;
  const getQuoteStatus = service => String(getQuote(service)?.estado || getQuote(service)?.status || "").trim();
  const canTechnicianQuote = service => {
    const quoteStatus = getQuoteStatus(service);
    const estado = normalizeServiceStatus(service.estado);
    return isTechnicianOnly
      && service.tecnicoId === session.id
      && estado !== SERVICE_STATUS.completed
      && estado !== SERVICE_STATUS.canceled
      && !service.paymentId
      && (!quoteStatus || quoteStatus === "Rechazada");
  };
  const canUserAnswerQuote = service => isUserOnly && getQuoteStatus(service) === "Enviada";
  const canTechnicianComplete = service => {
    const estado = normalizeServiceStatus(service.estado);
    return isTechnicianOnly
      && service.tecnicoId === session.id
      && estado !== SERVICE_STATUS.completed
      && estado !== SERVICE_STATUS.canceled;
  };

  const openQuoteModal = service => {
    setQuoteTarget(service);
    setQuoteForm({ monto: "", descripcion: "" });
    setModal("quote");
  };

  const submitQuote = async event => {
    event.preventDefault();
    if (!quoteForm.monto) return flash("Ingrese el monto propuesto.", "error");

    try {
      setSaving(true);
      await quotesApi.createQuote({
        serviceId: quoteTarget.id,
        monto: quoteForm.monto,
        descripcion: quoteForm.descripcion,
      });
      flash("Cotizacion enviada al usuario.");
      setModal(null);
      setQuoteTarget(null);
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo enviar la cotizacion.", "error");
    } finally {
      setSaving(false);
    }
  };

  const approveQuote = async service => {
    const quote = getQuote(service);
    try {
      await quotesApi.approveQuote(quote.id || quote.quoteId);
      flash("Cotizacion aprobada. Pago pendiente generado.");
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo aprobar la cotizacion.", "error");
    }
  };

  const rejectQuote = async service => {
    const quote = getQuote(service);
    try {
      await quotesApi.rejectQuote(quote.id || quote.quoteId);
      flash("Cotizacion rechazada.");
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo rechazar la cotizacion.", "error");
    }
  };

  const completeService = async service => {
    const confirmed = window.confirm("Confirmas que este servicio fue completado? Despues de esto el usuario podra realizar el pago si tiene una cotizacion aprobada.");
    if (!confirmed) return;

    try {
      await servicesApi.completeService(service.id);
      flash("Servicio marcado como completado.");
      await loadServices();
    } catch (error) {
      flash(error.message || "No se pudo completar el servicio.", "error");
    }
  };

  const tableHeaders = showServiceType
    ? ["#", "Tipo", "Descripcion", "Fecha", "Prioridad", "Usuario", "Tecnico asignado", "Estado", "Acciones"]
    : ["#", "Descripcion", "Fecha", "Hora", "Estado", "Acciones"];

  return (
    <div>
      <PageHead title="Gestion de Servicios" sub="RF006 - RF008 - Registro, seguimiento y cierre de solicitudes" action={canCreateService ? <BtnPrimary icon="plus" onClick={() => { setForm({ tipo: "", descripcion: "", fecha: hoy(), prioridad: "Media", location: emptyLocation }); setSelectedService(null); setEditId(null); setModal("form"); }}>Nuevo servicio</BtnPrimary> : null} />
      {loading && <p style={{ color: "var(--text3)", marginBottom: 12 }}>Cargando servicios...</p>}
      {loadError && <p style={{ color: "#DC2626", marginBottom: 12 }}>{loadError}</p>}
      <Table
        headers={tableHeaders}
        rows={services.map(service => {
          const fechaHora = splitFechaHora(service.fecha);
          const estado = normalizeServiceStatus(service.estado);
          const typeCell = (
            <span>
              {service.tipo}
              {service.advisoryOriginId && (
                <span style={{ display: "block", color: "var(--text3)", fontSize: 11, marginTop: 3 }}>Origen: Asesoria #{service.advisoryOriginId}</span>
              )}
              <span style={{ display: "block", color: "var(--text3)", fontSize: 11, marginTop: 3 }}>
                {getQuote(service) ? `${getQuoteStatus(service)}: ${cop(getQuote(service).monto || getQuote(service).amount || 0)}` : "Sin cotizacion"} · {service.paymentStatus || "Sin pago"}
              </span>
            </span>
          );
          const userActions = (
            <div style={{ display: "flex", gap: 6 }}>
              <IconBtn icon="location" title="Ver mapa" onClick={() => openLocationMap(service)} color="#2563EB" />
              {hasUserEditWindow(service) && isWithinUserEditWindow(service) && <IconBtn icon="edit" title="Editar" onClick={() => openEdit(service)} />}
              {estado === SERVICE_STATUS.pending && <IconBtn icon="x" title="Cancelar" onClick={() => cancelarServicio(service.id)} color="#C84B31" />}
            </div>
          );
          const adminOrTechnicianActions = isAdmin
            ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <IconBtn icon="location" title="Ver mapa" onClick={() => openLocationMap(service)} color="#2563EB" />
                <IconBtn icon="edit" title="Editar" onClick={() => openEdit(service)} />
              </div>
            )
            : (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <IconBtn icon="eye" title="Ver descripcion" onClick={() => openDescription(service)} />
                <IconBtn icon="location" title="Ver mapa" onClick={() => openLocationMap(service)} color="#2563EB" />
                {canTechnicianQuote(service) && <IconBtn icon="pay" title="Proponer valor" onClick={() => openQuoteModal(service)} color="#D97706" />}
                {service.tecnicoId === session.id && <IconBtn icon="target" title="Compartir ubicacion" onClick={() => shareTechnicianLocation(service)} color="#0F766E" />}
                {canTechnicianComplete(service) && <IconBtn icon="check" title="Marcar como completado" onClick={() => completeService(service)} color="#2C6E49" />}
              </div>
            );
          const userRowActions = (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {canUserAnswerQuote(service) && <IconBtn icon="check" title="Aprobar cotizacion" onClick={() => approveQuote(service)} color="#2C6E49" />}
              {canUserAnswerQuote(service) && <IconBtn icon="x" title="Rechazar cotizacion" onClick={() => rejectQuote(service)} color="#C84B31" />}
              {!canUserAnswerQuote(service) && userActions}
            </div>
          );
          const baseRow = [
            <span style={{ color: "var(--text3)", fontSize: 12 }}>#{service.id}</span>,
            <span style={{ maxWidth: 180, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={service.descripcion}>
              {service.descripcion}
              <span style={{ display: "block", color: service.serviceLocation ? "#2C6E49" : "var(--text3)", fontSize: 11, marginTop: 3 }}>
                {service.serviceLocation ? "Ubicacion registrada" : "Sin ubicacion"}
              </span>
            </span>,
            fechaHora.fecha,
            service.client?.name || getUser(service.usuarioId),
            isAdmin ? (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1fr) auto", gap: 6, alignItems: "center" }}>
                <select value={assignmentForms[service.id]?.tecnicoId ?? service.tecnicoId ?? ""} onChange={event => setAssignment(service.id, "tecnicoId", event.target.value)} style={{ ...inputSt, width: "100%", padding: "5px 8px", fontSize: 12, marginBottom: 0 }}>
                  <option value="">{techniciansLoading ? "Cargando tecnicos..." : "Seleccione tecnico"}</option>
                  {tecnicos.map(technician => <option key={technician.id} value={technician.id}>{technician.label || `${technician.nombre || ""} ${technician.apellido || ""}`.trim() || technician.correo}</option>)}
                </select>
                <IconBtn icon="check" title="Asignar tecnico sin monto" onClick={() => assignTec(service.id)} color="#2C6E49" />
              </div>
            ) : service.technician?.name || getUser(service.tecnicoId),
            canManageServiceStatus && estado !== SERVICE_STATUS.completed ? (
              <select value={estado} onChange={event => setEstado(service.id, event.target.value)} style={{ ...inputSt, width: "auto", padding: "5px 8px", fontSize: 12 }}>
                {adminStatusOptions.map(validState => <option key={validState} value={validState}>{validState}</option>)}
              </select>
            ) : <Badge label={estado} />,
            adminOrTechnicianActions,
          ];

          return showServiceType
            ? [baseRow[0], typeCell, baseRow[1], baseRow[2], <Badge label={service.prioridad || "Pendiente"} />, ...baseRow.slice(3)]
            : [baseRow[0], baseRow[1], fechaHora.fecha, fechaHora.hora, <Badge label={getQuote(service) ? getQuoteStatus(service) : estado} />, userRowActions];
        })}
      />
      {modal === "form" && (
        <Modal title={editId ? "Editar servicio" : "Registrar servicio (RF008)"} onClose={() => { setModal(null); setSelectedService(null); }}>
          {isAdmin && selectedService?.advisoryOriginId && (
            <div style={{ marginBottom: 14, color: "var(--text2)", fontSize: 14 }}>
              <strong style={{ color: "var(--text)" }}>Tipo de servicio:</strong> {form.tipo || "Pendiente por clasificar"}
              <span style={{ display: "block", color: "var(--text3)", fontSize: 12, marginTop: 4 }}>Origen: Asesoria #{selectedService.advisoryOriginId}. El tipo fue definido por el asesor y no se edita en este flujo.</span>
            </div>
          )}
          {isAdmin && !selectedService?.advisoryOriginId && <Field label="Tipo de servicio" value={form.tipo} onChange={set("tipo")} opts={TIPOS} req />}
          {!isTechnicianOnly && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripcion del problema *</label>
              <textarea value={form.descripcion} onChange={event => set("descripcion")(event.target.value)} rows={3} style={{ ...inputSt, resize: "vertical", marginBottom: 14 }} placeholder="Describe el problema o la solicitud..." />
            </div>
          )}
          {isUserOnly && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 14, background: "var(--surface2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <strong style={{ color: "var(--text)", fontSize: 14 }}>Ubicacion del servicio</strong>
                <BtnGhost icon="location" onClick={useCurrentLocation}>Usar mi ubicacion</BtnGhost>
              </div>
              <Grid2>
                <Field label="Latitud" type="number" value={form.location?.latitude || ""} onChange={value => setLocation("latitude", value)} />
                <Field label="Longitud" type="number" value={form.location?.longitude || ""} onChange={value => setLocation("longitude", value)} />
              </Grid2>
              <Field label="Referencia de direccion" value={form.location?.addressReference || ""} onChange={value => setLocation("addressReference", value)} />
            </div>
          )}
          {isTechnicianOnly && (
            <div style={{ marginBottom: 14, color: "var(--text2)", fontSize: 14 }}>
              <strong style={{ color: "var(--text)" }}>Tipo de servicio:</strong> {form.tipo || "Pendiente por clasificar"}
            </div>
          )}
          {canManageServicePriority && (
            <Grid2>
              <Field label="Prioridad" value={form.prioridad} onChange={set("prioridad")} opts={["Alta", "Media", "Baja", "Pendiente por clasificar"]} />
              <Field label="Estado" value={form.estado} onChange={set("estado")} opts={selectedService && normalizeServiceStatus(selectedService.estado) === SERVICE_STATUS.completed ? [SERVICE_STATUS.completed] : adminStatusOptions} />
            </Grid2>
          )}
          <div className="form-actions" style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={save} icon="check">{saving ? "Guardando..." : editId ? "Guardar" : "Registrar"}</BtnPrimary>
            <BtnGhost onClick={() => { setModal(null); setSelectedService(null); }}>Cancelar</BtnGhost>
          </div>
        </Modal>
      )}
      {modal === "description" && selectedService && (
        <Modal title="Descripcion del problema" onClose={() => { setModal(null); setSelectedService(null); }}>
          <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 14 }}>{selectedService.descripcion}</p>
          {getQuote(selectedService) && (
            <div style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
              <strong style={{ color: "var(--text)" }}>Cotizacion:</strong> {getQuoteStatus(selectedService)} · {cop(getQuote(selectedService).monto || getQuote(selectedService).amount || 0)}
              {getQuote(selectedService).descripcion && <span style={{ display: "block" }}>{getQuote(selectedService).descripcion}</span>}
            </div>
          )}
          <BtnGhost onClick={() => { setModal(null); setSelectedService(null); }}>Cerrar</BtnGhost>
        </Modal>
      )}
      {modal === "location" && selectedService && (
        <Modal title={`Mapa del servicio #${selectedService.id}`} onClose={() => { setModal(null); setSelectedService(null); setMapState({ loading: false, status: null, history: [], route: null, routeLoading: false, routeMessage: "", routeFallback: false, trackingAlert: null }); }}>
          {mapState.loading && <p style={{ color: "var(--text3)", marginTop: 0 }}>Cargando mapa...</p>}
          {!mapState.loading && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", color: "var(--text2)", fontSize: 13 }}>
                <span style={{ color: locationSocket.connected ? "#2C6E49" : "var(--text3)", fontWeight: 700 }}>
                  {formatRealtimeStatus(locationSocket)}
                </span>
                {locationSocket.lastUpdatedAt && <span>Actualizado hace unos segundos</span>}
              </div>
              {mapState.trackingAlert && (
                <div style={{ border: "1px solid var(--border)", borderLeft: `4px solid ${mapState.trackingAlert.type === "arrived" ? "#2C6E49" : "#D97706"}`, borderRadius: 8, padding: "9px 11px", background: "var(--surface2)", color: "var(--text)", fontSize: 13 }}>
                  {mapState.trackingAlert.message}
                </div>
              )}
              <MapCanvas
                serviceLocation={mapState.status?.serviceLocation || selectedService.serviceLocation}
                technicianLocation={mapState.status?.technicianLocation || selectedService.technicianLocation}
                technicianHistory={mapState.history}
                distanceMeters={mapState.route?.distanceMeters ?? mapState.status?.distanceMeters ?? mapState.status?.distanciaMetros}
                etaMinutes={mapState.status?.etaMinutes ?? mapState.status?.tiempoEstimadoMinutos}
                durationSeconds={mapState.route?.durationSeconds}
                routeGeometry={mapState.route?.geometry}
                routeFallback={mapState.routeFallback}
                routeMessage={mapState.routeMessage}
                height={380}
              />
              {mapState.routeLoading && <p style={{ color: "var(--text3)", fontSize: 13, margin: 0 }}>Calculando ruta real...</p>}
              {mapState.routeMessage && !mapState.routeLoading && <p style={{ color: mapState.routeFallback ? "#D97706" : "var(--text3)", fontSize: 13, margin: 0 }}>{mapState.routeMessage}</p>}
              {mapState.route && !mapState.routeFallback && !mapState.routeLoading && <p style={{ color: "#2C6E49", fontSize: 13, margin: 0 }}>Ruta actualizada hace unos segundos.</p>}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <BtnGhost icon="reply" onClick={() => openLocationMap(selectedService)}>Actualizar</BtnGhost>
                {isTechnicianOnly && selectedService.tecnicoId === session.id && <BtnPrimary icon="target" onClick={() => shareTechnicianLocation(selectedService)}>Compartir ubicacion</BtnPrimary>}
              </div>
            </div>
          )}
        </Modal>
      )}
      {modal === "quote" && quoteTarget && (
        <Modal title={`Proponer valor - Servicio #${quoteTarget.id}`} onClose={() => { setModal(null); setQuoteTarget(null); }}>
          <form onSubmit={submitQuote}>
            <Field label="Monto propuesto" type="number" value={quoteForm.monto} onChange={value => setQuoteForm(current => ({ ...current, monto: value }))} req />
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Detalle u observacion</label>
              <textarea value={quoteForm.descripcion} onChange={event => setQuoteForm(current => ({ ...current, descripcion: event.target.value }))} rows={4} style={{ ...inputSt, resize: "vertical", marginBottom: 14 }} placeholder="Describe que incluye la cotizacion..." />
            </div>
            <div className="form-actions" style={{ display: "flex", gap: 10 }}>
              <BtnPrimary icon="pay" type="submit" disabled={saving}>{saving ? "Enviando..." : "Enviar cotizacion"}</BtnPrimary>
              <BtnGhost onClick={() => { setModal(null); setQuoteTarget(null); }}>Cancelar</BtnGhost>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
