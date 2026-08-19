import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { BtnPrimary, BtnGhost } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/modals/Modal";
import { inputSt } from "../components/ui/fieldStyles";
import { AdvisoryChat } from "../components/advisories/AdvisoryChat";
import { advisoriesApi } from "../domains/advisories/services/advisoriesApi";
import { normalizeAdvisoriesFromApi, normalizeAdvisoryFromApi } from "../domains/advisories/services/advisoryMappers";

const DEVICE_TYPES = ["Computador", "Celular", "Tablet", "Impresora", "Consola", "Otro"];

const emptyForm = {
  descripcionInicial: "",
  tipoDispositivo: "",
  fechaContacto: "",
  horaContacto: "",
};

function todayValue() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function validateForm(form) {
  const errors = {};
  const description = form.descripcionInicial.trim();

  if (description.length < 10) errors.descripcionInicial = "Describe el problema con al menos 10 caracteres.";
  if (description.length > 2000) errors.descripcionInicial = "La descripcion no puede superar 2000 caracteres.";
  if (!DEVICE_TYPES.includes(form.tipoDispositivo)) errors.tipoDispositivo = "Selecciona un tipo de dispositivo valido.";
  if (!form.fechaContacto) errors.fechaContacto = "Selecciona una fecha de contacto.";
  if (form.fechaContacto && form.fechaContacto < todayValue()) errors.fechaContacto = "La fecha no puede estar en el pasado.";
  if (!/^\d{2}:\d{2}$/.test(form.horaContacto)) errors.horaContacto = "Selecciona una hora valida.";
  if (form.fechaContacto === todayValue() && form.horaContacto) {
    const selected = new Date(`${form.fechaContacto}T${form.horaContacto}:00`);
    if (selected <= new Date()) errors.horaContacto = "La hora no puede estar en el pasado.";
  }

  return errors;
}

function FieldError({ children }) {
  if (!children) return null;
  return <p style={{ color: "#DC2626", fontSize: 12, margin: "-8px 0 10px" }}>{children}</p>;
}

export function UsuarioAsesoriaPage({ flash, session }) {
  const [form, setForm] = useState(emptyForm);
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  const loadAdvisories = async () => {
    const response = await advisoriesApi.listMyAdvisoryRequests();
    setAdvisories(normalizeAdvisoriesFromApi(response));
  };

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        setError("");
        const advisoriesResponse = await advisoriesApi.listMyAdvisoryRequests();
        if (!active) return;
        setAdvisories(normalizeAdvisoriesFromApi(advisoriesResponse));
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.message || "No se pudo cargar asesoria.");
        flash?.(loadError?.message || "No se pudo cargar asesoria.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [flash]);

  const sortedAdvisories = useMemo(
    () => [...advisories].sort((a, b) => String(b.fechaCreacionRaw || "").localeCompare(String(a.fechaCreacionRaw || ""))),
    [advisories],
  );

  const submit = async event => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      const created = normalizeAdvisoryFromApi(await advisoriesApi.createAdvisoryRequest({
        descripcionInicial: form.descripcionInicial.trim(),
        tipoDispositivo: form.tipoDispositivo,
        fechaContacto: form.fechaContacto,
        horaContacto: form.horaContacto,
      }));
      setForm(emptyForm);
      setErrors({});
      await loadAdvisories();
      flash?.(`Solicitud de asesoria #${created.id} creada.`);
    } catch (submitError) {
      flash?.(submitError?.message || "No se pudo crear la solicitud de asesoria.", "error");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async advisory => {
    try {
      setSelected(normalizeAdvisoryFromApi(await advisoriesApi.getAdvisoryRequestById(advisory.id)));
    } catch (detailError) {
      flash?.(detailError?.message || "No se pudo cargar el detalle.", "error");
    }
  };

  return (
    <div>
      <PageHead title="Asesoria" sub="Solicita orientacion antes de crear un servicio" />
      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando tus solicitudes...</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 0.9fr) minmax(320px, 1.1fr)", gap: 18, alignItems: "start" }}>
          <form onSubmit={submit} className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 14px" }}>Solicitar asesoria</h3>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripcion inicial *</label>
            <textarea value={form.descripcionInicial} onChange={event => set("descripcionInicial")(event.target.value)} rows={5} placeholder="Describe que ocurre con tu dispositivo" style={{ ...inputSt, resize: "vertical", minHeight: 110, marginBottom: 14 }} />
            <FieldError>{errors.descripcionInicial}</FieldError>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de dispositivo *</label>
            <select value={form.tipoDispositivo} onChange={event => set("tipoDispositivo")(event.target.value)} style={{ ...inputSt, marginBottom: 14 }}>
              <option value="">Seleccionar...</option>
              {DEVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <FieldError>{errors.tipoDispositivo}</FieldError>

            <div className="fields-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha *</label>
                <input type="date" min={todayValue()} value={form.fechaContacto} onChange={event => set("fechaContacto")(event.target.value)} style={{ ...inputSt, marginBottom: 14 }} />
                <FieldError>{errors.fechaContacto}</FieldError>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hora *</label>
                <input type="time" value={form.horaContacto} onChange={event => set("horaContacto")(event.target.value)} style={{ ...inputSt, marginBottom: 14 }} />
                <FieldError>{errors.horaContacto}</FieldError>
              </div>
            </div>

            <BtnPrimary icon="check">{saving ? "Enviando..." : "Solicitar asesoria"}</BtnPrimary>
          </form>

          <section className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 14px" }}>Mis solicitudes</h3>
            {sortedAdvisories.length === 0 && <p style={{ color: "var(--text3)", fontSize: 14, margin: 0 }}>Aun no has solicitado asesorias.</p>}
            <div style={{ display: "grid", gap: 10 }}>
              {sortedAdvisories.map(advisory => (
                <article key={advisory.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, background: "var(--bg)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ color: "var(--text)", fontSize: 14 }}>Asesoria #{advisory.id}</strong>
                    <Badge label={advisory.estado} />
                  </div>
                  <p style={{ margin: "0 0 8px", color: "var(--text2)", fontSize: 13 }}>{advisory.tipoDispositivo || "Dispositivo sin registrar"} · {advisory.fechaContacto} · {advisory.horaContacto}</p>
                  <p style={{ margin: "0 0 8px", color: "var(--text)", fontSize: 13, lineHeight: 1.5 }}>{advisory.descripcionInicial}</p>
                  {advisory.serviceId && (
                    <div style={{ display: "grid", gap: 4, margin: "8px 0", color: "var(--text2)", fontSize: 12 }}>
                      <span><strong style={{ color: "var(--text)" }}>Tipo de servicio:</strong> {advisory.tipoServicio?.nombre || "Sin tipo"}</span>
                      <span><strong style={{ color: "var(--text)" }}>Descripcion final:</strong> {advisory.descripcionServicioFinal || "Sin descripcion final"}</span>
                      <span><strong style={{ color: "var(--text)" }}>Solicitud de servicio generada:</strong> #{advisory.serviceId}</span>
                    </div>
                  )}
                  <p style={{ margin: 0, color: "var(--text3)", fontSize: 12 }}>{advisory.asesor ? `Asesor: ${advisory.asesor.name}` : "Pendiente de asignacion"}</p>
                  <div style={{ marginTop: 10 }}><BtnGhost icon="eye" onClick={() => openDetail(advisory)}>Ver detalle</BtnGhost></div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {selected && (
        <Modal title={`Solicitud de asesoria #${selected.id}`} onClose={() => setSelected(null)} wide>
          <div style={{ display: "grid", gap: 14, color: "var(--text2)", fontSize: 14 }}>
            <section style={{ display: "grid", gap: 9 }}>
            <div><strong style={{ color: "var(--text)" }}>Estado:</strong> {selected.estado}</div>
            <div><strong style={{ color: "var(--text)" }}>Dispositivo:</strong> {selected.tipoDispositivo}</div>
            <div><strong style={{ color: "var(--text)" }}>Contacto:</strong> {selected.fechaContacto} {selected.horaContacto}</div>
            <div><strong style={{ color: "var(--text)" }}>Asesor:</strong> {selected.asesor?.name || "Pendiente de asignacion"}</div>
            <div><strong style={{ color: "var(--text)" }}>Descripcion inicial:</strong> {selected.descripcionInicial}</div>
            {selected.serviceId && (
              <>
                <div><strong style={{ color: "var(--text)" }}>Tipo de servicio:</strong> {selected.tipoServicio?.nombre || "Sin tipo"}</div>
                <div><strong style={{ color: "var(--text)" }}>Descripcion final:</strong> {selected.descripcionServicioFinal || "Sin descripcion final"}</div>
                <div><strong style={{ color: "var(--text)" }}>Solicitud de servicio generada:</strong> #{selected.serviceId}</div>
              </>
            )}
            </section>
            <AdvisoryChat advisory={selected} currentUserId={session?.id} flash={flash} />
          </div>
        </Modal>
      )}
    </div>
  );
}
