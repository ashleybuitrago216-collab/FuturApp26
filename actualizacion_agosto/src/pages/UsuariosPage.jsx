import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { Table } from "../components/tables/Table";
import { Modal } from "../components/modals/Modal";
import { BtnGhost, BtnPrimary, IconBtn } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { inputSt } from "../components/ui/fieldStyles";
import { usersApi } from "../domains/users/services/usersApi";

const ROLE_LABELS = {
  admin: "Administrador",
  tecnico: "Tecnico",
  usuario: "Usuario",
  asesor: "Asesor",
};

function userName(user) {
  return user.name || `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Sin nombre";
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role || "Sin rol";
}

function areaLabel(user) {
  return user.areaEspecialidad?.nombre || user.area || "Sin area";
}

function normalizeForSearch(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function UsuariosModule({ session, flash }) {
  const [users, setUsers] = useState([]);
  const [catalogs, setCatalogs] = useState({ roles: [], areas: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ search: "", role: "", active: "", areaId: "" });
  const [form, setForm] = useState({ rol: "usuario", idAreaEspecialidad: "", activo: true });

  const setFilter = key => value => setFilters(current => ({ ...current, [key]: value }));
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  const loadUsersData = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [usersResponse, catalogsResponse] = await Promise.all([
        usersApi.listUsers(),
        usersApi.getUserCatalogs(),
      ]);
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      setCatalogs({
        roles: Array.isArray(catalogsResponse?.roles) ? catalogsResponse.roles : [],
        areas: Array.isArray(catalogsResponse?.areas) ? catalogsResponse.areas : [],
      });
    } catch (error) {
      setLoadError(error.message || "No se pudieron cargar los usuarios.");
      flash(error.message || "No se pudieron cargar los usuarios.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fuente oficial: API/MySQL. No se usa data.users ni localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const manageableRoles = useMemo(() => {
    const byRole = new Map();
    for (const role of catalogs.roles) {
      if (["admin", "tecnico", "usuario", "asesor"].includes(role.rolNormalizado) && !byRole.has(role.rolNormalizado)) {
        byRole.set(role.rolNormalizado, role);
      }
    }
    return Array.from(byRole.values());
  }, [catalogs.roles]);

  const filteredUsers = useMemo(() => {
    const search = normalizeForSearch(filters.search);
    const areaId = filters.areaId ? Number(filters.areaId) : null;

    return users.filter(user => {
      const matchesSearch = !search || normalizeForSearch(`${userName(user)} ${user.correo || ""}`).includes(search);
      const matchesRole = !filters.role || user.rol === filters.role;
      const matchesActive = !filters.active || String(Boolean(user.activo)) === filters.active;
      const matchesArea = !areaId || user.idAreaEspecialidad === areaId;
      return matchesSearch && matchesRole && matchesActive && matchesArea;
    });
  }, [filters, users]);

  const openEdit = user => {
    setSelectedUser(user);
    setForm({
      rol: user.rol || "usuario",
      idAreaEspecialidad: user.idAreaEspecialidad ? String(user.idAreaEspecialidad) : "",
      activo: Boolean(user.activo),
    });
    setModal("form");
  };

  const save = async () => {
    if (!selectedUser) return;
    if (form.rol === "tecnico" && !form.idAreaEspecialidad) {
      return flash("Debes asignar un area de especialidad al tecnico.", "error");
    }

    try {
      setSaving(true);
      await usersApi.updateUserFromAdmin(selectedUser.id, {
        rol: form.rol,
        idAreaEspecialidad: form.rol === "tecnico" ? Number(form.idAreaEspecialidad) : null,
        activo: form.activo,
      });
      flash("Usuario actualizado correctamente.");
      setModal(null);
      setSelectedUser(null);
      await loadUsersData();
    } catch (error) {
      flash(error.message || "No se pudo actualizar el usuario.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead title="Gestion de Usuarios" sub="Administracion real de roles, areas y estado desde MySQL" />
      {loading && <p style={{ color: "var(--text3)", marginBottom: 12 }}>Cargando usuarios...</p>}
      {loadError && <p style={{ color: "#DC2626", marginBottom: 12 }}>{loadError}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1.4fr) repeat(3, minmax(140px, 0.8fr))", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <input value={filters.search} onChange={event => setFilter("search")(event.target.value)} placeholder="Buscar por nombre o correo" style={{ ...inputSt, marginBottom: 0 }} />
        <select value={filters.role} onChange={event => setFilter("role")(event.target.value)} style={{ ...inputSt, marginBottom: 0 }}>
          <option value="">Todos los roles</option>
          {manageableRoles.map(role => <option key={role.rolNormalizado} value={role.rolNormalizado}>{role.nombre}</option>)}
        </select>
        <select value={filters.active} onChange={event => setFilter("active")(event.target.value)} style={{ ...inputSt, marginBottom: 0 }}>
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <select value={filters.areaId} onChange={event => setFilter("areaId")(event.target.value)} style={{ ...inputSt, marginBottom: 0 }}>
          <option value="">Todas las areas</option>
          {catalogs.areas.map(area => <option key={area.id} value={area.id}>{area.nombre}</option>)}
        </select>
      </div>

      <Table
        headers={["Nombre", "Correo", "Rol", "Area", "Estado", "Acciones"]}
        rows={filteredUsers.map(user => [
          <span style={{ fontWeight: 600 }}>{userName(user)}</span>,
          user.correo || "Sin correo",
          roleLabel(user.rol),
          areaLabel(user),
          <Badge label={user.activo ? "Activo" : "Inactivo"} />,
          <IconBtn icon="edit" title="Editar usuario" onClick={() => openEdit(user)} />,
        ])}
      />

      {modal === "form" && selectedUser && (
        <Modal title="Editar usuario" onClose={() => { setModal(null); setSelectedUser(null); }}>
          <div style={{ marginBottom: 16, color: "var(--text2)", fontSize: 14, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "var(--text)" }}>{userName(selectedUser)}</div>
            <div>{selectedUser.correo}</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rol *</label>
            <select value={form.rol} onChange={event => set("rol")(event.target.value)} style={inputSt}>
              {manageableRoles.map(role => <option key={role.rolNormalizado} value={role.rolNormalizado}>{role.nombre}</option>)}
            </select>
          </div>

          {form.rol === "tecnico" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Area de especialidad *</label>
              <select value={form.idAreaEspecialidad} onChange={event => set("idAreaEspecialidad")(event.target.value)} style={inputSt}>
                <option value="">Seleccionar area</option>
                {catalogs.areas.map(area => <option key={area.id} value={area.id}>{area.nombre}</option>)}
              </select>
            </div>
          )}

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18, color: "var(--text2)", fontSize: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={form.activo} onChange={event => set("activo")(event.target.checked)} />
            Usuario activo
          </label>

          {selectedUser.id === session.id && (
            <p style={{ color: "#C84B31", fontSize: 13, marginBottom: 14 }}>Tu propio rol y estado estan protegidos para evitar cambios accidentales.</p>
          )}

          <div className="form-actions" style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={save} icon="check">{saving ? "Guardando..." : "Guardar cambios"}</BtnPrimary>
            <BtnGhost onClick={() => { setModal(null); setSelectedUser(null); }}>Cancelar</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  );
}
