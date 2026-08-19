export function authenticateWithSeed(users, credentials) {
  return users.find(
    (user) =>
      user.correo === credentials.correo &&
      user.password === credentials.password
  );
}

export function isEmailRegistered(users, correo) {
  return users.some((user) => user.correo === correo);
}

export function normalizeAuthUser(user) {
  const [nombre, ...apellidoParts] = String(user?.name || "").split(" ").filter(Boolean);

  return {
    id: user?.id,
    nombre: user?.nombre || nombre || "Usuario",
    apellido: user?.apellido || apellidoParts.join(" "),
    correo: user?.email || user?.correo || "",
    rol: user?.role || user?.rol || "usuario",
    activo: true,
  };
}
