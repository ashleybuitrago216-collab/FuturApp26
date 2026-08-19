import { prisma } from "../../config/prisma.js";
import { mapDatabaseRoleToSystemRole } from "../auth/auth.service.js";
import { formatCatalogs, formatTechnician, formatUser } from "./users.mapper.js";

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const nombre = parts.shift() || "";

  return {
    nombre,
    apellido: parts.join(" ") || null,
  };
}

function getAllowedProfileData(payload) {
  const data = {};

  if (Object.hasOwn(payload, "name")) {
    const { nombre, apellido } = splitName(payload.name);
    if (!nombre) throw createError("El nombre es obligatorio.");
    data.nombre = nombre;
    data.apellido = apellido;
  }

  if (Object.hasOwn(payload, "nombre")) {
    const nombre = String(payload.nombre || "").trim();
    if (!nombre) throw createError("El nombre es obligatorio.");
    data.nombre = nombre;
  }

  if (Object.hasOwn(payload, "apellido")) {
    data.apellido = String(payload.apellido || "").trim() || null;
  }

  if (Object.hasOwn(payload, "phone") || Object.hasOwn(payload, "telefono")) {
    data.telefono = String(payload.phone ?? payload.telefono ?? "").trim() || null;
  }

  if (Object.hasOwn(payload, "address") || Object.hasOwn(payload, "direccion")) {
    data.direccion = String(payload.address ?? payload.direccion ?? "").trim() || null;
  }

  if (Object.hasOwn(payload, "idTipoDocumento") || Object.hasOwn(payload, "id_tipo_documento")) {
    const value = payload.idTipoDocumento ?? payload.id_tipo_documento;
    data.idTipoDocumento = value === null || value === "" ? null : Number(value);
  }

  if (Object.hasOwn(payload, "idAreaEspecialidad") || Object.hasOwn(payload, "id_area_especialidad")) {
    const value = payload.idAreaEspecialidad ?? payload.id_area_especialidad;
    data.idAreaEspecialidad = value === null || value === "" ? null : Number(value);
  }

  return data;
}

function hasAny(payload, ...keys) {
  return keys.some(key => Object.hasOwn(payload, key));
}

function normalizeRoleInput(value) {
  const normalized = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "administrador" || normalized === "admin") return "admin";
  if (normalized === "tecnico") return "tecnico";
  if (normalized === "usuario") return "usuario";
  if (normalized === "asesor") return "asesor";
  return "";
}

function isCanonicalRoleFor(normalizedRole, roleName) {
  const normalizedName = String(roleName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedRole === "admin") return normalizedName === "administrador" || normalizedName === "admin";
  if (normalizedRole === "tecnico") return normalizedName === "tecnico";
  if (normalizedRole === "usuario") return normalizedName === "usuario";
  if (normalizedRole === "asesor") return normalizedName === "asesor";
  return false;
}

function toNullableNumber(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : NaN;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "activo", "active", "si", "sí"].includes(normalized)) return true;
  if (["false", "0", "inactivo", "inactive", "no"].includes(normalized)) return false;
  return null;
}

function isActiveAppointmentStatus(statusName) {
  const normalized = String(statusName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return !["cancelado", "cancelada", "finalizado", "finalizada", "completado", "completada"].includes(normalized);
}

async function resolveRoleFromPayload(payload, currentRole, db = prisma) {
  const hasRoleId = hasAny(payload, "idRol", "roleId", "id_rol");
  const hasRoleName = hasAny(payload, "rol", "role");

  if (!hasRoleId && !hasRoleName) return currentRole;

  if (hasRoleId) {
    const idRol = toNullableNumber(payload.idRol ?? payload.roleId ?? payload.id_rol);
    if (!idRol || Number.isNaN(idRol)) throw createError("Rol invalido.", 400);

    const role = await db.rol.findUnique({ where: { idRol } });
    if (!role) throw createError("Rol invalido.", 400);
    if (!mapDatabaseRoleToSystemRole(role.nombreRol)) throw createError("Rol invalido.", 400);
    return role;
  }

  const normalizedRole = normalizeRoleInput(payload.rol ?? payload.role);
  if (!normalizedRole) throw createError("Rol invalido.", 400);

  const roles = await db.rol.findMany({ orderBy: { idRol: "asc" } });
  const role = roles.find(item => isCanonicalRoleFor(normalizedRole, item.nombreRol))
    || roles.find(item => mapDatabaseRoleToSystemRole(item.nombreRol) === normalizedRole);
  if (!role) throw createError("Rol invalido.", 400);
  return role;
}

async function resolveAreaForRole(payload, finalRole, currentUser, db = prisma) {
  const finalNormalizedRole = mapDatabaseRoleToSystemRole(finalRole?.nombreRol);
  const hasArea = hasAny(payload, "idAreaEspecialidad", "areaId", "idArea", "id_area_especialidad");

  if (finalNormalizedRole !== "tecnico") return null;

  const rawArea = hasArea
    ? payload.idAreaEspecialidad ?? payload.areaId ?? payload.idArea ?? payload.id_area_especialidad
    : currentUser.idAreaEspecialidad;
  const idAreaEspecialidad = toNullableNumber(rawArea);

  if (!idAreaEspecialidad || Number.isNaN(idAreaEspecialidad)) {
    throw createError("Debes asignar un area de especialidad al tecnico.", 400);
  }

  const area = await db.areaEspecialidad.findUnique({ where: { idAreaEspecialidad } });
  if (!area) throw createError("Area de especialidad invalida.", 400);

  return area.idAreaEspecialidad;
}

async function countActiveAdmins(db = prisma) {
  const users = await db.usuario.findMany({
    where: { activo: true },
    include: { rol: true },
  });

  return users.filter(user => mapDatabaseRoleToSystemRole(user.rol?.nombreRol) === "admin").length;
}

async function ensureNoActiveAppointmentsForTechnician(userId, db = prisma) {
  const citas = await db.cita.findMany({
    where: { idUsuarioTecnico: Number(userId) },
    include: { estado: true },
  });
  const activeAppointment = citas.find(cita => isActiveAppointmentStatus(cita.estado?.nombreEstado));

  if (activeAppointment) {
    throw createError("El tecnico tiene citas activas asignadas. Reasigna las citas antes de cambiar su rol o desactivarlo.", 409);
  }
}

const userRelations = {
  rol: true,
  areaEspecialidad: true,
};

export const usersService = {
  async list(authUser) {
    if (authUser.role !== "admin") {
      throw createError("Solo admin puede listar usuarios.", 403);
    }

    const users = await prisma.usuario.findMany({
      include: userRelations,
      orderBy: { idUsuario: "asc" },
    });

    return users.map(formatUser);
  },

  async getCatalogs(authUser) {
    if (authUser.role !== "admin") {
      throw createError("Solo admin puede consultar catalogos de usuarios.", 403);
    }

    const [roles, areas] = await Promise.all([
      prisma.rol.findMany({ orderBy: { idRol: "asc" } }),
      prisma.areaEspecialidad.findMany({ orderBy: { idAreaEspecialidad: "asc" } }),
    ]);

    const officialRoles = ["admin", "tecnico", "usuario", "asesor"]
      .map(role => roles.find(item => mapDatabaseRoleToSystemRole(item.nombreRol) === role))
      .filter(Boolean);

    return formatCatalogs({ roles: officialRoles, areas });
  },

  async listTechnicians(authUser) {
    if (authUser.role !== "admin") {
      throw createError("Solo admin puede listar tecnicos.", 403);
    }

    const users = await prisma.usuario.findMany({
      where: { activo: true },
      include: userRelations,
      orderBy: [
        { nombre: "asc" },
        { apellido: "asc" },
        { idUsuario: "asc" },
      ],
    });

    return users
      .filter(user => mapDatabaseRoleToSystemRole(user.rol?.nombreRol) === "tecnico" && Boolean(user.idAreaEspecialidad && user.areaEspecialidad))
      .map(formatTechnician);
  },

  async getMe(authUser) {
    const user = await prisma.usuario.findUnique({
      where: { idUsuario: authUser.id },
      include: userRelations,
    });

    if (!user) throw createError("Usuario no encontrado.", 404);
    return formatUser(user);
  },

  async updateFromAdmin(authUser, userId, payload = {}) {
    if (authUser.role !== "admin") {
      throw createError("Solo admin puede administrar usuarios.", 403);
    }

    return prisma.$transaction(async tx => {
      const target = await tx.usuario.findUnique({
        where: { idUsuario: Number(userId) },
        include: userRelations,
      });
      if (!target) throw createError("Usuario no encontrado.", 404);

      const finalRole = await resolveRoleFromPayload(payload, target.rol, tx);
      const currentNormalizedRole = mapDatabaseRoleToSystemRole(target.rol?.nombreRol);
      const finalNormalizedRole = mapDatabaseRoleToSystemRole(finalRole?.nombreRol);
      const activeWasProvided = hasAny(payload, "activo", "active");
      const finalActive = activeWasProvided ? toBoolean(payload.activo ?? payload.active) : target.activo;

      if (finalActive === null) throw createError("Estado activo invalido.", 400);

      if (target.idUsuario === authUser.id && currentNormalizedRole === "admin") {
        if (finalNormalizedRole !== "admin") {
          throw createError("No puedes degradar tu propio rol de administrador desde esta pantalla.", 400);
        }
        if (!finalActive) {
          throw createError("No puedes desactivar tu propia cuenta desde esta pantalla.", 400);
        }
      }

      const activeAdminCount = await countActiveAdmins(tx);
      const adminWouldStopBeingActive = currentNormalizedRole === "admin" && (finalNormalizedRole !== "admin" || !finalActive);
      if (adminWouldStopBeingActive && activeAdminCount <= 1) {
        throw createError("No puedes modificar al ultimo administrador activo.", 400);
      }

      const technicianWouldStopBeingAssignable = currentNormalizedRole === "tecnico" && (finalNormalizedRole !== "tecnico" || !finalActive);
      if (technicianWouldStopBeingAssignable) {
        await ensureNoActiveAppointmentsForTechnician(target.idUsuario, tx);
      }

      const idAreaEspecialidad = await resolveAreaForRole(payload, finalRole, target, tx);
      const updated = await tx.usuario.update({
        where: { idUsuario: target.idUsuario },
        data: {
          idRol: finalRole.idRol,
          activo: finalActive,
          idAreaEspecialidad,
        },
        include: userRelations,
      });

      return formatUser(updated);
    });
  },

  async updateMe(authUser, payload = {}) {
    const forbiddenFields = [
      "id",
      "idUsuario",
      "id_usuario",
      "role",
      "rol",
      "roleId",
      "idRol",
      "id_rol",
      "active",
      "activo",
      "correo",
      "email",
      "contrasenaHash",
      "contrasena_hash",
      "password",
      "passwordHash",
      "fechaRegistro",
      "fecha_registro",
    ];
    const hasForbiddenField = forbiddenFields.some(field => Object.hasOwn(payload, field));

    if (hasForbiddenField) {
      throw createError("El perfil no permite modificar rol, estado, correo, id ni campos internos.", 403);
    }

    const data = getAllowedProfileData(payload);

    if (Object.keys(data).length === 0) {
      return this.getMe(authUser);
    }

    const user = await prisma.usuario.update({
      where: { idUsuario: authUser.id },
      data,
      include: userRelations,
    });

    return formatUser(user);
  },
};
