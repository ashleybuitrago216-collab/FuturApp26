import { useEffect, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { Badge } from "../components/ui/Badge";
import { BtnGhost, BtnPrimary } from "../components/ui/Button";
import { Table } from "../components/tables/Table";
import { Modal } from "../components/modals/Modal";
import { inputSt } from "../components/ui/fieldStyles";
import { AdvisoryChat } from "../components/advisories/AdvisoryChat";
import { advisoriesApi } from "../domains/advisories/services/advisoriesApi";
import { normalizeAdvisoriesFromApi, normalizeAdvisoryCatalogsFromApi, normalizeAdvisoryFromApi } from "../domains/advisories/services/advisoryMappers";

const RESOLVED_STATUS = "Asesoria resuelta";

function isPending(advisory) {
  const status = String(advisory?.estado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return status === "pendiente" || status === "asignada" || status === "en proceso";
}

function getProfilePhone(advisory) {
  return String(advisory?.solicitante?.telefono || "").trim();
}

export function AsesoriasPage({ flash, session }) {
  const [advisories, setAdvisories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [contactAction, setContactAction] = useState(null);
  const [catalogs, setCatalogs] = useState({ tiposServicio: [] });
  const [resolveForm, setResolveForm] = useState({ tipoServicioId: "", descripcionServicioFinal: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const loadAdvisories = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const response = await advisoriesApi.listMyAdvisories();
      setAdvisories(normalizeAdvisoriesFromApi(response));
    } catch (loadError) {
      setError(loadError?.message || "No se pudieron cargar las asesorias.");
      flash?.(loadError?.message || "No se pudieron cargar las asesorias.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const [advisoriesResponse, catalogsResponse] = await Promise.all([
          advisoriesApi.listMyAdvisories(),
          advisoriesApi.getCatalogs(),
        ]);
        if (!active) return;
        setAdvisories(normalizeAdvisoriesFromApi(advisoriesResponse));
        setCatalogs(normalizeAdvisoryCatalogsFromApi(catalogsResponse));
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.message || "No se pudieron cargar las asesorias.");
        flash?.(loadError?.message || "No se pudieron cargar las asesorias.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      active = false;
    };
  }, [flash]);

  const openDetail = async advisory => {
    try {
      const response = await advisoriesApi.getAdvisoryById(advisory.id);
      setSelected(normalizeAdvisoryFromApi(response));
    } catch (detailError) {
      flash?.(detailError?.message || "No se pudo cargar la asesoria.", "error");
    }
  };

  const openResolve = async advisory => {
    try {
      const response = await advisoriesApi.getAdvisoryById(advisory.id);
      const mapped = normalizeAdvisoryFromApi(response);
      setResolveTarget(mapped);
      setResolveForm({
        tipoServicioId: mapped.tipoServicioId || "",
        descripcionServicioFinal: mapped.descripcionServicioFinal || "",
      });
      setFormError("");
    } catch (detailError) {
      flash?.(detailError?.message || "No se pudo cargar la asesoria.", "error");
    }
  };

  const openContact = async (advisory, type) => {
    try {
      const response = await advisoriesApi.getAdvisoryById(advisory.id);
      const mapped = normalizeAdvisoryFromApi(response);
      setContactAction({ type, advisory: mapped });
      if (type === "call" && !getProfilePhone(mapped)) {
        flash?.("El usuario no tiene un numero registrado en su perfil.", "error");
      }
    } catch (detailError) {
      flash?.(detailError?.message || "No se pudo cargar el contacto de la asesoria.", "error");
    }
  };

  const submitResolve = async event => {
    event.preventDefault();
    const description = resolveForm.descripcionServicioFinal.trim();
    if (!resolveForm.tipoServicioId) {
      setFormError("Selecciona un tipo de servicio.");
      return;
    }
    if (description.length < 10) {
      setFormError("La descripcion final debe tener al menos 10 caracteres.");
      return;
    }
    if (description.length > 255) {
      setFormError("La descripcion final no puede superar 255 caracteres para crear la solicitud de servicio.");
      return;
    }
    const confirmed = window.confirm("Al terminar la asesoria se creara una solicitud de servicio para el usuario. Esta accion no debe generar servicios duplicados.");
    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await advisoriesApi.resolveAdvisory(resolveTarget.id, {
        tipoServicioId: Number(resolveForm.tipoServicioId),
        descripcionServicioFinal: description,
      });
      flash?.(response?.message || "Asesoria resuelta.");
      setResolveTarget(null);
      setResolveForm({ tipoServicioId: "", descripcionServicioFinal: "" });
      await loadAdvisories({ silent: true });
    } catch (resolveError) {
      setFormError(resolveError?.message || "No se pudo resolver la asesoria.");
      flash?.(resolveError?.message || "No se pudo resolver la asesoria.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead title="Mis asesorias" sub="Asesorias asignadas a tu usuario" />
      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando asesorias...</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}
      {!loading && !error && (
        <Table
          headers={["Fecha", "Hora", "Solicitante", "Motivo", "Estado", "Servicio", "Acciones"]}
          rows={advisories.map(advisory => [
            advisory.fecha,
            advisory.hora,
            advisory.solicitante?.name || "Sin solicitante",
            advisory.motivo,
            <Badge label={advisory.estado} />,
            advisory.serviceId ? `#${advisory.serviceId}` : "Pendiente",
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <BtnGhost icon="eye" onClick={() => openDetail(advisory)}>Detalle</BtnGhost>
              {isPending(advisory) && !advisory.serviceId && (
                <>
                  <BtnGhost icon="chat" onClick={() => openContact(advisory, "chat")}>Chat</BtnGhost>
                  <BtnGhost icon="phone" onClick={() => openContact(advisory, "call")}>Llamar</BtnGhost>
                </>
              )}
              {isPending(advisory) && !advisory.serviceId ? (
                <BtnGhost icon="check" onClick={() => openResolve(advisory)}>Responder asesoria</BtnGhost>
              ) : (
                advisory.serviceId && <Badge label={RESOLVED_STATUS} />
              )}
            </div>,
          ])}
        />
      )}

      {selected && (
        <Modal title={`Asesoria #${selected.id}`} onClose={() => setSelected(null)}>
          <div style={{ display: "grid", gap: 10, color: "var(--text2)", fontSize: 14 }}>
            <div><strong style={{ color: "var(--text)" }}>Fecha:</strong> {selected.fecha} {selected.hora}</div>
            <div><strong style={{ color: "var(--text)" }}>Estado:</strong> {selected.estado}</div>
            <div><strong style={{ color: "var(--text)" }}>Solicitante:</strong> {selected.solicitante?.name || "Sin solicitante"}</div>
            <div><strong style={{ color: "var(--text)" }}>Correo:</strong> {selected.solicitante?.correo || "Sin correo"}</div>
            <div><strong style={{ color: "var(--text)" }}>Motivo:</strong> {selected.motivo}</div>
            <div><strong style={{ color: "var(--text)" }}>Dispositivo:</strong> {selected.tipoDispositivo || "Sin registrar"}</div>
            <div><strong style={{ color: "var(--text)" }}>Telefono de perfil:</strong> {getProfilePhone(selected) || "El usuario no tiene un numero registrado en su perfil."}</div>
            <div><strong style={{ color: "var(--text)" }}>Descripcion inicial:</strong> {selected.descripcion || "Sin descripcion"}</div>
            {isPending(selected) && !selected.serviceId && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <BtnGhost icon="chat" onClick={() => setContactAction({ type: "chat", advisory: selected })}>Chat</BtnGhost>
                <BtnGhost icon="phone" onClick={() => setContactAction({ type: "call", advisory: selected })}>Llamar</BtnGhost>
              </div>
            )}
            {selected.serviceId && (
              <>
                <div><strong style={{ color: "var(--text)" }}>Tipo de servicio:</strong> {selected.tipoServicio?.nombre || "Sin tipo"}</div>
                <div><strong style={{ color: "var(--text)" }}>Descripcion final:</strong> {selected.descripcionServicioFinal || "Sin descripcion final"}</div>
                <div><strong style={{ color: "var(--text)" }}>Solicitud de servicio generada:</strong> #{selected.serviceId}</div>
              </>
            )}
          </div>
        </Modal>
      )}

      {resolveTarget && (
        <Modal title={`Responder asesoria #${resolveTarget.id}`} onClose={() => saving ? null : setResolveTarget(null)} wide>
          <form onSubmit={submitResolve} style={{ display: "grid", gap: 12 }}>
            <section style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, display: "grid", gap: 7, color: "var(--text2)", fontSize: 14 }}>
              <div><strong style={{ color: "var(--text)" }}>Usuario:</strong> {resolveTarget.solicitante?.name || "Sin solicitante"}</div>
              <div><strong style={{ color: "var(--text)" }}>Dispositivo:</strong> {resolveTarget.tipoDispositivo || "Sin registrar"}</div>
              <div><strong style={{ color: "var(--text)" }}>Contacto:</strong> {resolveTarget.fechaContacto} {resolveTarget.horaContacto}</div>
              <div><strong style={{ color: "var(--text)" }}>Telefono de perfil:</strong> {getProfilePhone(resolveTarget) || "El usuario no tiene un numero registrado en su perfil."}</div>
              <div><strong style={{ color: "var(--text)" }}>Descripcion inicial:</strong> {resolveTarget.descripcionInicial || "Sin descripcion"}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <BtnGhost icon="chat" onClick={() => setContactAction({ type: "chat", advisory: resolveTarget })}>Chat</BtnGhost>
                <BtnGhost icon="phone" onClick={() => setContactAction({ type: "call", advisory: resolveTarget })}>Llamar</BtnGhost>
              </div>
            </section>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de servicio *</label>
            <select value={resolveForm.tipoServicioId} onChange={event => setResolveForm(current => ({ ...current, tipoServicioId: event.target.value }))} style={inputSt} disabled={saving}>
              <option value="">Seleccionar...</option>
              {catalogs.tiposServicio.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}
            </select>
            {catalogs.tiposServicio.length === 0 && <p style={{ margin: "-6px 0 0", color: "#DC2626", fontSize: 13 }}>No hay tipos de servicio tecnicos disponibles.</p>}

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripcion final del servicio *</label>
            <textarea
              value={resolveForm.descripcionServicioFinal}
              onChange={event => setResolveForm(current => ({ ...current, descripcionServicioFinal: event.target.value }))}
              rows={5}
              maxLength={255}
              disabled={saving}
              placeholder="Describe el servicio tecnico requerido"
              style={{ ...inputSt, minHeight: 120, resize: "vertical" }}
            />
            <p style={{ margin: 0, color: "var(--text3)", fontSize: 12 }}>{resolveForm.descripcionServicioFinal.length}/255 caracteres</p>
            {formError && <p style={{ margin: 0, color: "#DC2626", fontSize: 13 }}>{formError}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <BtnGhost icon="x" onClick={() => setResolveTarget(null)}>Cancelar</BtnGhost>
              <BtnPrimary icon="check" disabled={catalogs.tiposServicio.length === 0}>{saving ? "Terminando..." : "Terminar asesoria"}</BtnPrimary>
            </div>
          </form>
        </Modal>
      )}

      {contactAction && (
        <Modal
          title={contactAction.type === "chat" ? `Chat de asesoria #${contactAction.advisory.id}` : `Llamar al usuario de asesoria #${contactAction.advisory.id}`}
          onClose={() => setContactAction(null)}
          wide={contactAction.type === "chat"}
        >
          {contactAction.type === "chat" ? (
            <div style={{ display: "grid", gap: 12, color: "var(--text2)", fontSize: 14 }}>
              <div><strong style={{ color: "var(--text)" }}>Usuario:</strong> {contactAction.advisory.solicitante?.name || "Sin solicitante"}</div>
              <div><strong style={{ color: "var(--text)" }}>Correo:</strong> {contactAction.advisory.solicitante?.correo || "Sin correo"}</div>
              <div><strong style={{ color: "var(--text)" }}>Asesoria:</strong> {contactAction.advisory.descripcionInicial || contactAction.advisory.descripcion || "Sin descripcion"}</div>
              <AdvisoryChat advisory={contactAction.advisory} currentUserId={session?.id} flash={flash} />
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, color: "var(--text2)", fontSize: 14 }}>
              <div><strong style={{ color: "var(--text)" }}>Usuario:</strong> {contactAction.advisory.solicitante?.name || "Sin solicitante"}</div>
              <div><strong style={{ color: "var(--text)" }}>Telefono de perfil:</strong> {getProfilePhone(contactAction.advisory) || "El usuario no tiene un numero registrado en su perfil."}</div>
              {getProfilePhone(contactAction.advisory) ? (
                <a
                  href={`tel:${getProfilePhone(contactAction.advisory)}`}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 16px", borderRadius: 8, background: "var(--text)", color: "var(--bg)", textDecoration: "none", fontWeight: 700 }}
                >
                  Se iniciara llamada al usuario
                </a>
              ) : (
                <p style={{ margin: 0, color: "#DC2626" }}>No es posible iniciar llamada porque el perfil del usuario no tiene telefono registrado.</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
