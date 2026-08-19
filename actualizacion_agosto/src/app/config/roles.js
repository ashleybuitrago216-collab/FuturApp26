export const ROLES = {
  admin: "admin",
  technician: "tecnico",
  user: "usuario",
  advisor: "asesor",
};

export const canAccessAdminArea = (session) => session?.rol === ROLES.admin;

export const canAccessAdvisorArea = (session) => session?.rol === ROLES.advisor;

export const canManageTechnicalWork = (session) =>
  session?.rol === ROLES.admin || session?.rol === ROLES.technician;
