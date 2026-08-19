import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { BtnPrimary, BtnGhost } from "../components/ui/Button";
import { inputSt } from "../components/ui/fieldStyles";
import { commentsApi } from "../domains/comments/services/commentsApi";
import { servicesApi } from "../domains/services/services/servicesApi";
import { normalizeServiceFromApi } from "../domains/services/services/serviceMappers";

const emptyForm = {
  serviceId: "",
  rating: 5,
  comment: "",
};

const emptyFilters = {
  status: "all",
  rating: "all",
  serviceType: "all",
  order: "recent",
};

function formatDate(value) {
  if (!value) return "Fecha pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha pendiente";
  return date.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
}

function getReviewId(review) {
  return review.id || review.reviewId || review.resenaId;
}

function getReviewService(review) {
  return review.service || review.servicio || null;
}

function getReviewAdvisory(review) {
  return review.advisory || review.asesoria || null;
}

function getReviewerName(review) {
  return review.user?.name || review.usuario?.name || "Usuario";
}

function getReviewRating(review) {
  return Number(review.rating ?? review.calificacion ?? 0);
}

function getReviewResponse(review) {
  return review.technicianResponse || review.respuestaTecnico || "";
}

function isReviewResponded(review) {
  return Boolean(getReviewResponse(review));
}

function getServiceType(review) {
  const service = getReviewService(review);
  const advisory = getReviewAdvisory(review);
  return service?.serviceType || service?.tipo || advisory?.description || advisory?.descripcion || "Sin clasificar";
}

function getTechnician(review) {
  const service = getReviewService(review);
  return service?.technician || service?.tecnico || null;
}

function getAdvisor(review) {
  const advisory = getReviewAdvisory(review);
  return advisory?.advisor || advisory?.asesor || null;
}

function getPersonKey(person, fallback) {
  return person?.id ? String(person.id) : fallback;
}

function getPersonName(person, fallback) {
  return person?.name || person?.nombre || fallback;
}

function getRelatedTitle(review) {
  const service = getReviewService(review);
  const advisory = getReviewAdvisory(review);
  if (service) return `Servicio #${service.id} - ${service.serviceType || service.tipo || "Servicio"}`;
  if (advisory) return `Asesoria #${advisory.id} - ${advisory.description || advisory.descripcion || "Asesoria"}`;
  return "Relacion no asociada";
}

function getServiceDate(service) {
  return service?.completedAt || service?.updatedAt || service?.fecha || service?.createdAt || null;
}

function RatingControl({ value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {[1, 2, 3, 4, 5].map(item => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          disabled={disabled}
          style={{
            width: 38,
            height: 34,
            borderRadius: 8,
            border: item === value ? "1.5px solid var(--text)" : "1px solid var(--border)",
            background: item === value ? "var(--text)" : "var(--surface2)",
            color: item === value ? "var(--bg)" : "var(--text)",
            cursor: disabled ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
          aria-label={`Calificacion ${item}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <div style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "var(--text)", fontSize: 26, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function InfoCard({ label, text }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <div style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "var(--text2)", fontSize: 13, fontWeight: 700, marginTop: 8, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

function buildPersonStats(reviews, getPerson, fallbackPrefix) {
  const byPerson = new Map();

  reviews.forEach(review => {
    const person = getPerson(review);
    if (!person) return;
    const key = getPersonKey(person, `${fallbackPrefix}-${byPerson.size + 1}`);
    const current = byPerson.get(key) || {
      id: key,
      name: getPersonName(person, `${fallbackPrefix} sin nombre`),
      total: 0,
      ratingSum: 0,
      pending: 0,
      responded: 0,
    };
    current.total += 1;
    current.ratingSum += getReviewRating(review);
    if (isReviewResponded(review)) current.responded += 1;
    else current.pending += 1;
    byPerson.set(key, current);
  });

  return [...byPerson.values()]
    .map(item => ({
      ...item,
      average: item.total ? (item.ratingSum / item.total).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.total - a.total || Number(b.average) - Number(a.average));
}

function PersonStatsTable({ title, rows, emptyText }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>{title}</h3>
      {rows.length === 0 && <p style={{ color: "var(--text3)", fontSize: 14, margin: 0 }}>{emptyText}</p>}
      {rows.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.slice(0, 8).map(row => (
            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
              <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</span>
              <span style={{ color: "var(--text2)", fontSize: 13 }}>{row.average}/5</span>
              <span style={{ color: "var(--text3)", fontSize: 12 }}>{row.total} resenas</span>
              <span style={{ color: "var(--text3)", fontSize: 12 }}>{row.pending} pendientes</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RatingDistribution({ distribution, total }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>Distribucion de calificaciones</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {[5, 4, 3, 2, 1].map(stars => {
          const count = distribution[stars] || 0;
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={stars} style={{ display: "grid", gridTemplateColumns: "82px 1fr 42px", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--text2)", fontSize: 13 }}>{stars} estrellas</span>
              <div style={{ height: 8, background: "var(--surface2)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${percent}%`, height: "100%", background: "var(--text)" }} />
              </div>
              <span style={{ color: "var(--text3)", fontSize: 12, textAlign: "right" }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review, canRespond, responseValue, onResponseChange, onRespond, responding }) {
  const rating = getReviewRating(review);
  const response = getReviewResponse(review);
  const reviewId = getReviewId(review);

  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800, color: "var(--text)", fontSize: 15 }}>{getReviewerName(review)}</div>
          <div style={{ color: "var(--text3)", fontSize: 12 }}>{getRelatedTitle(review)}</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>{getServiceType(review)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, color: "var(--text)" }}>{rating}/5</span>
          <span style={{ color: response ? "#2C6E49" : "#B45309", fontSize: 12, fontWeight: 800 }}>
            {response ? "Respondida" : "Pendiente de respuesta"}
          </span>
          <span style={{ color: "var(--text3)", fontSize: 12 }}>{formatDate(review.createdAt || review.fechaResena)}</span>
        </div>
      </div>

      <p style={{ margin: "0 0 12px", color: "var(--text)", fontSize: 14, lineHeight: 1.55 }}>
        {review.comment || review.comentario || "Resena sin comentario."}
      </p>

      {response && (
        <div style={{ background: "var(--surface2)", borderLeft: "3px solid var(--accent3)", borderRadius: "0 8px 8px 0", padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent3)", textTransform: "uppercase", marginBottom: 4 }}>Respuesta</div>
          <p style={{ margin: 0, color: "var(--text)", fontSize: 13, lineHeight: 1.55 }}>{response}</p>
        </div>
      )}

      {canRespond && !response && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={responseValue || ""}
            onChange={event => onResponseChange(reviewId, event.target.value)}
            style={{ ...inputSt, flex: "1 1 260px" }}
            placeholder="Respuesta al usuario"
          />
          <BtnPrimary small icon="reply" disabled={responding} onClick={() => onRespond(reviewId)}>
            Responder
          </BtnPrimary>
        </div>
      )}
    </div>
  );
}

function PendingReviewCard({ service, selected, form, saving, onStart, onCancel, onFormChange, onSubmit }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 800, color: "var(--text)", fontSize: 15 }}>Servicio #{service.id}</div>
          <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 3 }}>{service.tipo || "Servicio tecnico"}</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>
            Completado {formatDate(getServiceDate(service))}
            {service.technician?.name ? ` - ${service.technician.name}` : ""}
          </div>
        </div>
        {!selected && (
          <BtnPrimary small icon="chat" disabled={saving} onClick={() => onStart(service.id)}>
            Escribir resena
          </BtnPrimary>
        )}
      </div>

      {selected && (
        <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
          <label style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase" }}>Calificacion</span>
            <RatingControl value={Number(form.rating)} onChange={rating => onFormChange({ rating })} disabled={saving} />
          </label>
          <textarea
            value={form.comment}
            onChange={event => onFormChange({ comment: event.target.value })}
            rows={3}
            maxLength={500}
            style={{ ...inputSt, resize: "vertical", marginBottom: 12 }}
            placeholder="Comparte tu experiencia con el servicio"
            disabled={saving}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <BtnPrimary type="submit" icon="chat" disabled={saving}>Publicar resena</BtnPrimary>
            <BtnGhost onClick={onCancel}>Cancelar</BtnGhost>
          </div>
        </form>
      )}
    </div>
  );
}

function ReviewFilters({ filters, setFilters, serviceTypes }) {
  const set = key => event => setFilters(current => ({ ...current, [key]: event.target.value }));

  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 12 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Estado</span>
        <select value={filters.status} onChange={set("status")} style={inputSt}>
          <option value="all">Todas</option>
          <option value="pending">Pendiente de respuesta</option>
          <option value="responded">Respondida</option>
        </select>
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Calificacion</span>
        <select value={filters.rating} onChange={set("rating")} style={inputSt}>
          <option value="all">Todas</option>
          {[5, 4, 3, 2, 1].map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Tipo de servicio</span>
        <select value={filters.serviceType} onChange={set("serviceType")} style={inputSt}>
          <option value="all">Todos</option>
          {serviceTypes.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Orden</span>
        <select value={filters.order} onChange={set("order")} style={inputSt}>
          <option value="recent">Mas recientes</option>
          <option value="best">Mejor calificacion</option>
          <option value="worst">Menor calificacion</option>
          <option value="pending">Pendientes primero</option>
          <option value="responded">Respondidas primero</option>
        </select>
      </label>
    </div>
  );
}

export function ComentariosModule({ session, setTab, flash }) {
  const [reviews, setReviews] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState(emptyFilters);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const role = session?.rol;
  const isUser = role === "usuario";
  const isAdvisor = role === "asesor";
  const isAdmin = role === "admin";
  const canRespond = role === "tecnico" || role === "admin" || role === "asesor";

  const loadData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const requests = [commentsApi.listReviews()];
      if (isUser) requests.push(servicesApi.getServices());
      const [reviewsResponse, servicesResponse = []] = await Promise.all(requests);
      setReviews(Array.isArray(reviewsResponse) ? reviewsResponse : []);
      setServices((Array.isArray(servicesResponse) ? servicesResponse : []).map(normalizeServiceFromApi));
    } catch (loadError) {
      const message = loadError.message || "No se pudieron cargar las resenas.";
      setError(message);
      flash?.(message, "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const requests = [commentsApi.listReviews()];
        if (isUser) requests.push(servicesApi.getServices());
        const [reviewsResponse, servicesResponse = []] = await Promise.all(requests);
        if (!active) return;
        setReviews(Array.isArray(reviewsResponse) ? reviewsResponse : []);
        setServices((Array.isArray(servicesResponse) ? servicesResponse : []).map(normalizeServiceFromApi));
      } catch (loadError) {
        if (!active) return;
        const message = loadError.message || "No se pudieron cargar las resenas.";
        setError(message);
        flash?.(message, "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [flash, isUser]);

  const reviewedServiceIds = useMemo(
    () => new Set(reviews.map(review => Number(review.serviceId || review.solicitudServicioId)).filter(Boolean)),
    [reviews],
  );

  const pendingServices = useMemo(
    () => services.filter(service => service.isCompleted && !reviewedServiceIds.has(Number(service.id))),
    [services, reviewedServiceIds],
  );

  const visibleReviews = useMemo(
    () => isUser ? reviews.filter(review => reviewedServiceIds.has(Number(review.serviceId || review.solicitudServicioId))) : reviews,
    [isUser, reviewedServiceIds, reviews],
  );

  const stats = useMemo(() => {
    const total = visibleReviews.length;
    const sum = visibleReviews.reduce((acc, review) => acc + getReviewRating(review), 0);
    const responded = visibleReviews.filter(isReviewResponded).length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    visibleReviews.forEach(review => {
      const rating = getReviewRating(review);
      if (distribution[rating] !== undefined) distribution[rating] += 1;
    });

    return {
      total,
      average: total ? (sum / total).toFixed(1) : "0.0",
      pending: total - responded,
      responded,
      distribution,
    };
  }, [visibleReviews]);

  const technicianStats = useMemo(
    () => buildPersonStats(visibleReviews, getTechnician, "Tecnico"),
    [visibleReviews],
  );

  const advisorStats = useMemo(
    () => buildPersonStats(visibleReviews, getAdvisor, "Asesor"),
    [visibleReviews],
  );

  const serviceTypes = useMemo(
    () => [...new Set(visibleReviews.map(getServiceType).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [visibleReviews],
  );

  const filteredReviews = useMemo(() => {
    const filtered = visibleReviews.filter(review => {
      if (filters.status === "pending" && isReviewResponded(review)) return false;
      if (filters.status === "responded" && !isReviewResponded(review)) return false;
      if (filters.rating !== "all" && getReviewRating(review) !== Number(filters.rating)) return false;
      if (filters.serviceType !== "all" && getServiceType(review) !== filters.serviceType) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (filters.order === "best") return getReviewRating(b) - getReviewRating(a);
      if (filters.order === "worst") return getReviewRating(a) - getReviewRating(b);
      if (filters.order === "pending") return Number(isReviewResponded(a)) - Number(isReviewResponded(b));
      if (filters.order === "responded") return Number(isReviewResponded(b)) - Number(isReviewResponded(a));
      return new Date(b.createdAt || b.fechaResena || 0).getTime() - new Date(a.createdAt || a.fechaResena || 0).getTime();
    });
  }, [filters, visibleReviews]);

  const startReview = serviceId => {
    setForm({ serviceId: String(serviceId), rating: 5, comment: "" });
  };

  const updateForm = patch => {
    setForm(current => ({ ...current, ...patch }));
  };

  const submitReview = async event => {
    event.preventDefault();
    if (!form.serviceId) return flash?.("Selecciona un servicio completado.", "error");
    if (!form.comment.trim()) return flash?.("Escribe tu resena.", "error");

    try {
      setSaving(true);
      const created = await commentsApi.createReview({
        serviceId: Number(form.serviceId),
        rating: Number(form.rating),
        comment: form.comment.trim(),
      });
      setReviews(current => [created, ...current]);
      setForm(emptyForm);
      flash?.("Resena publicada.");
    } catch (saveError) {
      flash?.(saveError.message || "No se pudo publicar la resena.", "error");
    } finally {
      setSaving(false);
    }
  };

  const respondReview = async reviewId => {
    const response = responses[reviewId]?.trim();
    if (!response) return flash?.("Escribe una respuesta.", "error");

    try {
      setSaving(true);
      const updated = await commentsApi.respondReview(reviewId, { response });
      setReviews(current => current.map(review => getReviewId(review) === reviewId ? updated : review));
      setResponses(current => ({ ...current, [reviewId]: "" }));
      flash?.("Respuesta enviada.");
    } catch (responseError) {
      flash?.(responseError.message || "No se pudo responder la resena.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Resenas"
        sub={isUser ? "Servicios pendientes por valorar y servicios ya valorados" : "Resumen, filtros y respuestas de resenas recibidas"}
      />
      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <BtnGhost icon="home" onClick={() => setTab?.("dashboard")}>Volver al inicio</BtnGhost>
        <BtnGhost icon="down" onClick={() => loadData()}>Actualizar</BtnGhost>
      </div>

      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando resenas...</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && isUser && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>Pendientes por resenar</h3>
            <span style={{ color: "var(--text3)", fontSize: 13 }}>{pendingServices.length} pendiente{pendingServices.length === 1 ? "" : "s"}</span>
          </div>

          {pendingServices.length === 0 && (
            <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "var(--text3)", fontSize: 14, margin: 0 }}>No tienes servicios completados pendientes por resenar.</p>
            </div>
          )}

          {pendingServices.length > 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              {pendingServices.map(service => (
                <PendingReviewCard
                  key={service.id}
                  service={service}
                  selected={Number(form.serviceId) === Number(service.id)}
                  form={form}
                  saving={saving}
                  onStart={startReview}
                  onCancel={() => setForm(emptyForm)}
                  onFormChange={updateForm}
                  onSubmit={submitReview}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && !error && isAdvisor && visibleReviews.length === 0 && (
        <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 22 }}>
          <p style={{ color: "var(--text3)", fontSize: 14, margin: 0 }}>
            Aun no hay resenas asociadas directamente a tus asesorias.
          </p>
        </div>
      )}

      {!loading && !error && (!isAdvisor || visibleReviews.length > 0) && (
        <section>
          {!isUser && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 14 }}>
                <StatCard label={isAdmin ? "Promedio global" : "Promedio"} value={stats.average} />
                <StatCard label={isAdmin ? "Total global" : "Total"} value={stats.total} />
                <StatCard label="Pendientes" value={stats.pending} />
                <StatCard label="Respondidas" value={stats.responded} />
                {isAdmin && <InfoCard label="Reportadas" text="No disponible en el modelo actual." />}
              </div>
              <div style={{ marginBottom: 14 }}>
                <RatingDistribution distribution={stats.distribution} total={stats.total} />
              </div>
              {isAdmin && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 14, marginBottom: 14 }}>
                  <PersonStatsTable
                    title="Estadisticas por tecnico"
                    rows={technicianStats}
                    emptyText="No hay resenas vinculadas a tecnicos."
                  />
                  <PersonStatsTable
                    title="Estadisticas por asesor"
                    rows={advisorStats}
                    emptyText="No hay resenas con relacion real a asesorias."
                  />
                </div>
              )}
              <div style={{ marginBottom: 18 }}>
                <ReviewFilters filters={filters} setFilters={setFilters} serviceTypes={serviceTypes} />
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              {isUser ? "Servicios ya resenados" : "Resenas recibidas"}
            </h3>
            <span style={{ color: "var(--text3)", fontSize: 13 }}>
              {isUser ? visibleReviews.length : filteredReviews.length} resena{(isUser ? visibleReviews.length : filteredReviews.length) === 1 ? "" : "s"}
            </span>
          </div>

          {(isUser ? visibleReviews : filteredReviews).length === 0 && (
            <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "var(--text3)", fontSize: 14, margin: 0 }}>No hay resenas para los filtros seleccionados.</p>
            </div>
          )}

          {(isUser ? visibleReviews : filteredReviews).length > 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              {(isUser ? visibleReviews : filteredReviews).map(review => {
                const reviewId = getReviewId(review);
                return (
                  <ReviewCard
                    key={reviewId}
                    review={review}
                    canRespond={canRespond}
                    responseValue={responses[reviewId]}
                    onResponseChange={(id, value) => setResponses(current => ({ ...current, [id]: value }))}
                    onRespond={respondReview}
                    responding={saving}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
