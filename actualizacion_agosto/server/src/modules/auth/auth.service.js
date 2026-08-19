import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { isMailEnabled, sendPasswordResetEmail } from "../../config/mail.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_ROLES = new Set(["usuario"]);
const PASSWORD_RECOVERY_MESSAGE = "Si el correo esta registrado, enviaremos instrucciones para recuperar la contrasena.";
const PASSWORD_RESET_EXPIRATION_MINUTES = 30;

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeRoleName(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function mapDatabaseRoleToSystemRole(roleName) {
  const normalized = normalizeRoleName(roleName);

  if (normalized === "administrador" || normalized === "admin") return "admin";
  if (normalized === "tecnico" || normalized === "tã©cnico") return "tecnico";
  if (normalized === "usuario") return "usuario";
  if (normalized === "asesor") return "asesor";

  return null;
}

export function sanitizeUser(user) {
  const roleName = user.rol?.nombreRol;
  const role = mapDatabaseRoleToSystemRole(roleName);
  const name = `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim();

  return {
    id: user.idUsuario,
    name,
    email: user.correo,
    role,
  };
}

function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const nombre = parts.shift() || "";

  return {
    nombre,
    apellido: parts.join(" ") || null,
  };
}

function signToken(user) {
  const sanitizedUser = sanitizeUser(user);

  return jwt.sign(
    {
      userId: user.idUsuario,
      role: sanitizedUser.role,
    },
    env.jwtSecret,
    { expiresIn: "1d" },
  );
}

function assertRegisterPayload({ name, email, password, role }) {
  if (!name || !email || !password) {
    throw createError("Nombre, email y contrasena son requeridos.");
  }

  if (!EMAIL_PATTERN.test(String(email).trim())) {
    throw createError("Formato de email invalido.");
  }

  if (String(password).length < 6) {
    throw createError("La contrasena debe tener al menos 6 caracteres.");
  }

  if (role && !PUBLIC_ROLES.has(role)) {
    throw createError("No puedes registrarte con este rol.");
  }
}

function assertLoginPayload({ email, password }) {
  if (!email || !password) {
    throw createError("Email y contrasena son requeridos.");
  }
}

function assertEmailPayload(email) {
  if (!email || !EMAIL_PATTERN.test(String(email).trim())) {
    throw createError("Formato de email invalido.");
  }
}

function assertPasswordStrength(password, confirmPassword) {
  if (!password || !confirmPassword) {
    throw createError("La nueva contrasena y su confirmacion son requeridas.");
  }
  if (password !== confirmPassword) {
    throw createError("Las contrasenas no coinciden.");
  }
  if (String(password).length < 8) {
    throw createError("La contrasena debe tener al menos 8 caracteres.");
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw createError("La contrasena debe incluir al menos una letra y un numero.");
  }
}

function assertCanonicalUserRole(user) {
  if (!mapDatabaseRoleToSystemRole(user?.rol?.nombreRol)) {
    throw createError("El usuario no tiene un rol oficial valido.", 401);
  }
}

function generateRecoveryToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashRecoveryToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function buildResetLink(rawToken) {
  const clientUrl = String(env.clientUrl || "http://localhost:5173").replace(/\/$/, "");
  return `${clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

function logPasswordRecoveryMailError(error) {
  const safeError = {
    name: error?.name,
    code: error?.code,
    message: error?.message,
  };
  console.error("[AUTH] Password recovery email could not be sent:", safeError);
}

export const authService = {
  getStatus() {
    return { message: "auth module ready" };
  },

  async register(payload) {
    const email = String(payload.email || "").trim().toLowerCase();
    const role = payload.role || "usuario";

    assertRegisterPayload({ ...payload, email, role });

    const existingUser = await prisma.usuario.findUnique({ where: { correo: email } });
    if (existingUser) {
      throw createError("El correo ya esta registrado.", 409);
    }

    const userRole = await prisma.rol.upsert({
      where: { nombreRol: "Usuario" },
      update: {},
      create: { nombreRol: "Usuario" },
    });
    const contrasenaHash = await bcrypt.hash(payload.password, 10);
    const { nombre, apellido } = splitName(payload.name);

    const user = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        correo: email,
        contrasenaHash,
        idRol: userRole.idRol,
        activo: true,
      },
      include: { rol: true },
    });

    return {
      token: signToken(user),
      user: sanitizeUser(user),
    };
  },

  async login({ email, password }) {
    assertLoginPayload({ email, password });

    const user = await prisma.usuario.findUnique({
      where: { correo: String(email).trim().toLowerCase() },
      include: { rol: true },
    });

    const passwordMatches = user?.contrasenaHash
      ? await bcrypt.compare(password, user.contrasenaHash)
      : false;

    if (!user || !passwordMatches || !user.activo) {
      throw createError("Credenciales invalidas.", 401);
    }
    assertCanonicalUserRole(user);

    return {
      token: signToken(user),
      user: sanitizeUser(user),
    };
  },

  async forgotPassword(payload) {
    const email = String(payload.email || payload.correo || "").trim().toLowerCase();
    assertEmailPayload(email);

    const user = await prisma.usuario.findUnique({
      where: { correo: email },
    });

    const response = {
      message: PASSWORD_RECOVERY_MESSAGE,
    };

    if (!user || !user.activo) {
      return response;
    }

    const rawToken = generateRecoveryToken();
    const tokenHash = hashRecoveryToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000);

    await prisma.$transaction(async tx => {
      await tx.recuperacionContrasena.updateMany({
        where: {
          idUsuario: user.idUsuario,
          usado: false,
          fechaExpiracion: { gt: new Date() },
        },
        data: {
          usado: true,
          fechaUso: new Date(),
        },
      });

      await tx.recuperacionContrasena.create({
        data: {
          idUsuario: user.idUsuario,
          tokenHash,
          fechaExpiracion: expiresAt,
        },
      });
    });

    const resetLink = buildResetLink(rawToken);

    if (isMailEnabled()) {
      try {
        await sendPasswordResetEmail({
          to: user.correo,
          resetLink,
          userName: `${user.nombre || ""}${user.apellido ? ` ${user.apellido}` : ""}`.trim(),
        });
      } catch (error) {
        logPasswordRecoveryMailError(error);
      }
    } else {
      console.log("[AUTH] Password recovery development link:", resetLink);
    }

    if (env.nodeEnv !== "production" && !isMailEnabled()) {
      response.devResetLink = resetLink;
    }

    return response;
  },

  async resetPassword(payload) {
    const token = String(payload.token || "").trim();
    const password = String(payload.password || "");
    const confirmPassword = String(payload.confirmPassword || payload.confirm || "");

    if (!token) throw createError("El enlace de recuperacion no es valido o expiro.", 400);
    assertPasswordStrength(password, confirmPassword);

    const tokenHash = hashRecoveryToken(token);
    const recovery = await prisma.recuperacionContrasena.findFirst({
      where: { tokenHash },
      include: { usuario: { include: { rol: true } } },
      orderBy: { idRecuperacion: "desc" },
    });

    if (!recovery || recovery.usado || recovery.fechaExpiracion <= new Date() || !recovery.usuario?.activo) {
      throw createError("El enlace de recuperacion no es valido o expiro.", 400);
    }

    assertCanonicalUserRole(recovery.usuario);
    const contrasenaHash = await bcrypt.hash(password, 10);
    const now = new Date();

    await prisma.$transaction(async tx => {
      await tx.usuario.update({
        where: { idUsuario: recovery.idUsuario },
        data: { contrasenaHash },
      });

      await tx.recuperacionContrasena.update({
        where: { idRecuperacion: recovery.idRecuperacion },
        data: {
          usado: true,
          fechaUso: now,
        },
      });

      await tx.recuperacionContrasena.updateMany({
        where: {
          idUsuario: recovery.idUsuario,
          usado: false,
        },
        data: {
          usado: true,
          fechaUso: now,
        },
      });
    });

    return {
      message: "Contrasena actualizada correctamente. Ya puedes iniciar sesion.",
    };
  },

  async findMe(userId) {
    const user = await prisma.usuario.findUnique({
      where: { idUsuario: Number(userId) },
      include: { rol: true },
    });

    if (!user || !user.activo) {
      throw createError("Usuario no autorizado.", 401);
    }
    assertCanonicalUserRole(user);

    return sanitizeUser(user);
  },
};
