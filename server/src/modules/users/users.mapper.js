import { mapDatabaseRoleToSystemRole } from "../auth/auth.service.js";

function formatArea(area) {
  if (!area) return null;

  return {
    id: area.idAreaEspecialidad,
    idAreaEspecialidad: area.idAreaEspecialidad,
    nombre: area.nombreAreaEspecialidad,
    name: area.nombreAreaEspecialidad,
  };
}

export function formatUser(user) {
  if (!user) return null;

  const rol = mapDatabaseRoleToSystemRole(user.rol?.nombreRol);
  const name = `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim();
  const areaEspecialidad = formatArea(user.areaEspecialidad);

  return {
    id: user.idUsuario,
    idUsuario: user.idUsuario,
    name,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.correo,
    correo: user.correo,
    phone: user.telefono,
    telefono: user.telefono,
    documentTypeId: user.idTipoDocumento,
    idTipoDocumento: user.idTipoDocumento,
    address: user.direccion,
    direccion: user.direccion,
    idRol: user.idRol,
    roleId: user.idRol,
    rol,
    role: rol,
    rolNombre: user.rol?.nombreRol || null,
    roleName: user.rol?.nombreRol || null,
    idAreaEspecialidad: user.idAreaEspecialidad,
    areaEspecialidadId: user.idAreaEspecialidad,
    areaEspecialidad,
    area: areaEspecialidad?.nombre || null,
    active: user.activo,
    activo: user.activo,
    fechaRegistro: user.fechaRegistro,
  };
}

export function formatTechnician(user) {
  const formatted = formatUser(user);

  return {
    id: formatted.id,
    idUsuario: formatted.idUsuario,
    nombre: formatted.nombre,
    apellido: formatted.apellido,
    correo: formatted.correo,
    email: formatted.email,
    rol: "tecnico",
    role: "tecnico",
    idAreaEspecialidad: formatted.idAreaEspecialidad,
    areaEspecialidad: formatted.areaEspecialidad,
    area: formatted.area,
    activo: formatted.activo,
    active: formatted.active,
    label: formatted.name || formatted.correo || `Tecnico #${formatted.id}`,
  };
}

export function formatCatalogs({ roles = [], areas = [] }) {
  return {
    roles: roles.map(role => ({
      id: role.idRol,
      idRol: role.idRol,
      nombre: role.nombreRol,
      name: role.nombreRol,
      rolNormalizado: mapDatabaseRoleToSystemRole(role.nombreRol),
      normalizedRole: mapDatabaseRoleToSystemRole(role.nombreRol),
    })),
    areas: areas.map(area => formatArea(area)),
  };
}
