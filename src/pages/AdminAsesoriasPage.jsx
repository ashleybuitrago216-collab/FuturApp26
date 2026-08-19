import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { Badge } from "../components/ui/Badge";
import { BtnGhost, BtnPrimary } from "../components/ui/Button";
import { Modal } from "../components/modals/Modal";
import { Table } from "../components/tables/Table";
import { inputSt } from "../components/ui/fieldStyles";
import { advisoriesApi } from "../domains/advisories/services/advisoriesApi";
import { normalizeAdvisoriesFromApi, normalizeAdvisoryCatalogsFromApi, normalizeAdvisoryFromApi } from "../domains/advisories/services/advisoryMappers";

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isClosed(advisory) {
  const status = normalizeText(advisory?.estado);
  return status === "asesoria resuelta" || status === "cancelada" || Boolean(advisory?.serviceId);
}

function canAssign(advisory) {
  return advisory && !isClosed(advisory);
}

function getProfilePhone(advisory) {
  return String(advisory?.solicitante?.telefono || "").trim();
}

export function AdminAsesoriasPage({ flash }) {
  const [advisories, setAdvisories] = useState([]);
  const [catalogs, setCatalogs] = useState({ asesores: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", estado: "", asesorId: "" });
  const [selected, setSelected] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignForm, setAssignForm] = useState({ asesorId: "" });
  const [assignError, setAssignError] = useState("");

  const setFilter = key => value => setFilters(current => ({ ...current, [key]: value }));

  const loadData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const [advisoriesResponse, catalogsResponse] = await Promise.all([
        advisoriesApi.listMyAdvisories(),
        advisoriesApi.getCatalogs(),
      ]);
      setAdvisories(normalizeAdvisoriesFromApi(advisoriesResponse));
      setCatalogs(normalizeAdvisoryCatalogsFromApi(catalogsResponse));
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
        setError("");
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

  const statuses = useMemo(
    () => Array.from(new Set(advisories.map(advisory => advisory.estado).filter(Boolean))).sort(),
    [advisories],
  );

  const filteredAdvisories = useMemo(() => {
    const search = normalizeText(filters.search);
    return advisories.filter(advisory => {
      const advisorId = filters.asesorId ? Number(filters.asesorId) : null;
      const matchesSearch = !search || normalizeText(`${advisory.id} ${advisory.solicitante?.name || ""} ${advisory.solicitante?.correo || ""} ${advisory.descripcionInicial || ""}`).includes(search);
      const matchesStatus = !filters.estado || advisory.estado === filters.estado;
      const matchesAdvisor = !advisorId || advisory.asesorId === advisorId;
      return matchesSearch && matchesStatus && matchesAdvisor;
    });
  }, [advisories, filters]);

  const openDetail = async advisory => {
    try {
      setSelected(normalizeAdvisoryFromApi(await advisoriesApi.getAdvisoryById(advisory.id)));
    } catch (detailError) {
      flash?.(detailError?.message || "No se pudo cargar la asesoria.", "error");
    }
  };

  const openAssign = async advisory => {
    try {
      const fresh = normalizeAdvisoryFromApi(await advisoriesApi.getAdvisoryById(advisory.id));
      setAssignTarget(fresh);
      setAssignForm({ asesorId: fresh.asesorId ? String(fresh.asesorId) : "" });
      setAssignError("");
    } catch (detailError) {
      flash?.(detailError?.message || "No se pudo cargar la asesoria.", "error");
    }
  };

  const submitAssign = async event => {
    event.preventDefault();
    if (!assignForm.asesorId) {
      setAssignError("Selecciona un asesor activo.");
      return;
    }

    try {
      setSaving(true);
      const response = await advisoriesApi.assignAdvisory(assignTarget.id, {
        asesorId: Number(assignForm.asesorId),
      });
      flash?.(response?.message || "Asesoria asignada.");
      setAssignTarget(null);
      setAssignForm({ asesorId: "" });
      await loadData({ silent: true });
    } catch (assignErrorResponse) {
      setAssignError(assignErrorResponse?.message || "No se pudo asignar la asesoria.");
      flash?.(assignErrorResponse?.message || "No se pudo asignar la asesoria.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead title="Asesorias" sub="Gestion administrativa de solicitudes, asignacion y seguimiento" />

      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando asesorias...</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.4fr) minmax(150px, 0.8fr) minmax(180px, 1fr)", gap: 10, marginBottom: 14 }}>
            <input value={filters.search} onChange={event => setFilter("search")(event.target.value)} placeholder="Buscar por usuario, correo o descripcion" style={{ ...inputSt, marginBottom: 0 }} />
            <select value={filters.estado} onChange={event => setFilter("estado")(event.target.value)} style={{ ...inputSt, marginBottom: 0 }}>
              <option value="">Todos los estados</option>
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={filters.asesorId} onChange={event => setFilter("asesorId")(event.target.value)} style={{ ...inputSt, marginBottom: 0 }}>
              <option value="">Todos los asesores</option>
              {catalogs.asesores.map(advisor => <option key={advisor.id} value={advisor.id}>{advisor.name} ({advisor.carga})</option>)}
            </select>
          </div>

          <Table
            headers={["ID", "Contacto", "Solicitante", "Estado", "Asesor", "Carga", "Servicio", "Acciones"]}
            rows={filteredAdvisories.map(advisory => {
              const advisor = catalogs.asesores.find(item => item.id === advisory.asesorId);
              return [
                `#${advisory.id}`,
                <span>{advisory.fecha}<br /><span style={{ color: "var(--text3)", fontSize: 12 }}>{advisory.hora}</span></span>,
                <span>{advisory.solicitante?.name || "Sin solicitante"}<br /><span style={{ color: "var(--text3)", fontSize: 12 }}>{advisory.solicitante?.correo || "Sin correo"}</span></span>,
                <Badge label={advisory.estado} />,
                advisory.asesor?.name || "Sin asignar",
                advisor ? advisor.carga : "-",
                advisory.serviceId ? `#${advisory.serviceId}` : "Pendiente",
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <BtnGhost icon="eye" onClick={() => openDetail(advisory)}>Detalle</BtnGhost>
                  {canAssign(advisory) && <BtnGhost icon="users" onClick={() => openAssign(advisory)}>{advisory.asesorId ? "Reasignar" : "Asignar"}</BtnGhost>}
                </div>,
              ];
            })}
          />
        </>
      )}

      {selected && (
        <Modal title={`Asesoria #${selected.id}`} onClose={() => setSelected(null)} wide>
          <div style={{ display: "grid", gap: 9, color: "var(--text2)", fontSize: 14 }}>
            <div><strong style={{ color: "var(--text)" }}>Estado:</strong> {selected.estado}</div>
            <div><strong style={{ color: "var(--text)" }}>Solicitante:</strong> {selected.solicitante?.name || "Sin solicitante"}</div>
            <div><strong style={{ color: "var(--text)" }}>Correo:</strong> {selected.solicitante?.correo || "Sin correo"}</div>
            <div><strong style={{ color: "var(--text)" }}>Dispositivo:</strong> {selected.tipoDispositivo || "Sin registrar"}</div>
            <div><strong style={{ color: "var(--text)" }}>Contacto:</strong> {selected.fechaContacto} {selected.horaContacto}</div>
            <div><strong style={{ color: "var(--text)" }}>Telefono de perfil:</strong> {getProfilePhone(selected) || "El usuario no tiene un numero registrado en su perfil."}</div>
            <div><strong style={{ color: "var(--text)" }}>Asesor:</strong> {selected.asesor?.name || "Sin asignar"}</div>
            <div><strong style={{ color: "var(--text)" }}>Descripcion inicial:</strong> {selected.descripcionInicial || "Sin descripcion"}</div>
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

      {assignTarget && (
        <Modal title={`${assignTarget.asesorId ? "Reasignar" : "Asignar"} asesoria #${assignTarget.id}`} onClose={() => saving ? null : setAssignTarget(null)} wide>
          <form onSubmit={submitAssign} style={{ display: "grid", gap: 12 }}>
            <section style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, display: "grid", gap: 7, color: "var(--text2)", fontSize: 14 }}>
              <div><strong style={{ color: "var(--text)" }}>Usuario:</strong> {assignTarget.solicitante?.name || "Sin solicitante"}</div>
              <div><strong style={{ color: "var(--text)" }}>Contacto:</strong> {assignTarget.fechaContacto} {assignTarget.horaContacto}</div>
              <div><strong style={{ color: "var(--text)" }}>Telefono de perfil:</strong> {getProfilePhone(assignTarget) || "El usuario no tiene un numero registrado en su perfil."}</div>
              <div><strong style={{ color: "var(--text)" }}>Descripcion:</strong> {assignTarget.descripcionInicial || "Sin descripcion"}</div>
            </section>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Asesor activo *</label>
            <select value={assignForm.asesorId} onChange={event => setAssignForm({ asesorId: event.target.value })} style={inputSt} disabled={saving}>
              <option value="">Seleccionar asesor</option>
              {catalogs.asesores.map(advisor => <option key={advisor.id} value={advisor.id}>{advisor.name} - carga {advisor.carga}</option>)}
            </select>

            {assignError && <p style={{ margin: 0, color: "#DC2626", fontSize: 13 }}>{assignError}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <BtnGhost icon="x" onClick={() => setAssignTarget(null)}>Cancelar</BtnGhost>
              <BtnPrimary icon="check">{saving ? "Guardando..." : "Guardar asignacion"}</BtnPrimary>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
