export function normalizeProfileFromApi(profile) {
  const [nombreFromName, ...apellidoParts] = String(profile?.name || "").split(" ").filter(Boolean);

  return {
    id: profile?.id,
    nombre: profile?.nombre || nombreFromName || "",
    apellido: profile?.apellido || apellidoParts.join(" "),
    correo: profile?.correo || profile?.email || "",
    telefono: profile?.telefono || profile?.phone || "",
    tipoDocumento: profile?.tipoDocumento || profile?.documentType || "",
    numeroDocumento: profile?.numeroDocumento || profile?.documentNumber || "",
    direccion: profile?.direccion || profile?.address || "",
    area: profile?.area || "",
    rol: profile?.rol || profile?.role || "usuario",
    activo: profile?.activo ?? profile?.active ?? true,
  };
}

export function toProfileUpdatePayload(form) {
  return {
    nombre: form.nombre,
    apellido: form.apellido,
    phone: form.telefono,
    documentType: form.tipoDocumento,
    documentNumber: form.numeroDocumento,
    address: form.direccion,
    ...(form.password ? { password: form.password } : {}),
  };
}
