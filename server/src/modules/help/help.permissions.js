const VALID_ROLES = new Set(["admin", "tecnico", "usuario", "asesor"]);
const COMMON_ROLE = "todos";

export function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

export function canManageHelp(authUser) {
  return normalizeRole(authUser?.role) === "admin";
}

export function getAllowedHelpRoles(authUser) {
  const role = normalizeRole(authUser?.role);
  if (!VALID_ROLES.has(role)) return [COMMON_ROLE];
  return [COMMON_ROLE, role];
}

export function normalizeHelpStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export function isPublishedHelpStatus(value) {
  const status = normalizeHelpStatus(value);
  return status === "publicado" || status === "activo";
}

export function canReadHelpArticle(authUser, article) {
  if (!article) return false;
  if (canManageHelp(authUser)) return true;
  if (!isPublishedHelpStatus(article.estado)) return false;

  const allowedRoles = new Set(getAllowedHelpRoles(authUser));
  return article.roles?.some(item => allowedRoles.has(normalizeRole(item.rol))) ?? false;
}
