import { ROLES } from "../../app/config/roles";

export function hasRole(session, role) {
  return session?.rol === role;
}

export function isAdmin(session) {
  return hasRole(session, ROLES.admin);
}

export function isTechnician(session) {
  return hasRole(session, ROLES.technician);
}

