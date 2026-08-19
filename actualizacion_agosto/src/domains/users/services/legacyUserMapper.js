const roleByLegacyId = {
  1: "admin",
  2: "tecnico",
  3: "usuario",
};

export function mapLegacyUser(row) {
  if (!row) return null;

  return {
    id: row.id_usrs,
    nombre: row.nombre || "",
    apellido: row.apellido || "",
    correo: row.correo || "",
    password: row.clave || "",
    telefono: row.telefono || "",
    rol: roleByLegacyId[row.id_rol] || "usuario",
    area: row.id_area || "",
    activo: Boolean(row.activo),
  };
}

export function toLegacyUserPayload(user) {
  return {
    nombre: user.nombre,
    apellido: user.apellido,
    correo: user.correo,
    clave: user.password,
    telefono: user.telefono,
    id_area: user.area || null,
    activo: user.activo ? 1 : 0,
  };
}
