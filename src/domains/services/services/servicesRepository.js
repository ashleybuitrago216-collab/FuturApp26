export function listServicesForSession(servicios, session, isAdmin) {
  if (isAdmin) return servicios;
  if (session.rol === "tecnico") {
    return servicios.filter((service) => service.tecnicoId === session.id);
  }
  return servicios.filter((service) => service.usuarioId === session.id);
}

