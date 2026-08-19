import { prisma } from "../../config/prisma.js";
import { formatReview } from "./comments.mapper.js";

function isAdmin(user) {
  return user?.role === "admin";
}

function isTechnician(user) {
  return user?.role === "tecnico";
}

function isUser(user) {
  return user?.role === "usuario";
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertAllowed(condition, message = "No autorizado.") {
  if (!condition) throw createError(message, 403);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isCompletedStatus(value) {
  const normalized = normalizeText(value);
  return normalized === "finalizado" || normalized === "completado";
}

function getPayloadNumber(payload = {}, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      return value === null || value === "" ? null : Number(value);
    }
  }
  return undefined;
}

function getPayloadText(payload = {}, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      return value == null ? "" : String(value).trim();
    }
  }
  return "";
}

const includeRelations = {
  usuario: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
    },
  },
  asesoria: {
    select: {
      idAsesoria: true,
      idUsuarioAsesor: true,
      estado: true,
      motivo: true,
      descripcion: true,
      descripcionServicioFinal: true,
      asesor: {
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          correo: true,
        },
      },
    },
  },
  solicitudServicio: {
    include: {
      usuario: {
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
        },
      },
      tipoServicio: true,
      estado: true,
      citas: {
        include: {
          tecnico: {
            select: {
              idUsuario: true,
              nombre: true,
              apellido: true,
              correo: true,
              telefono: true,
            },
          },
        },
        orderBy: { idCita: "asc" },
      },
    },
  },
};

function getWhereByRole(authUser) {
  if (isAdmin(authUser)) return {};

  if (isTechnician(authUser)) {
    return {
      idSolicitudServicio: { not: null },
      solicitudServicio: {
        citas: {
          some: { idUsuarioTecnico: authUser.id },
        },
      },
    };
  }

  if (isUser(authUser)) {
    return { idUsuario: authUser.id };
  }

  if (authUser?.role === "asesor") {
    return {
      idAsesoria: { not: null },
      asesoria: {
        idUsuarioAsesor: authUser.id,
      },
    };
  }

  return { idResena: -1 };
}

async function findServiceForReview(serviceId) {
  return prisma.solicitudServicio.findUnique({
    where: { idSolicitudServicio: Number(serviceId) },
    include: {
      estado: true,
      citas: true,
      resenas: true,
    },
  });
}

function assertValidRating(rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw createError("La calificacion debe estar entre 1 y 5.", 400);
  }
}

export const commentsService = {
  async list(authUser) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const reviews = await prisma.resena.findMany({
      where: getWhereByRole(authUser),
      include: includeRelations,
      orderBy: { fechaResena: "desc" },
    });

    return reviews.map(formatReview);
  },

  async create(authUser, payload = {}) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);
    assertAllowed(isUser(authUser), "Solo el usuario puede crear resenas de sus servicios.");

    const serviceId = getPayloadNumber(payload, "serviceId", "solicitudServicioId", "idSolicitudServicio", "id_solicitud_servicio");
    const rating = getPayloadNumber(payload, "rating", "calificacion");
    const comment = getPayloadText(payload, "comment", "comentario");

    if (!serviceId) throw createError("El servicio es requerido.", 400);
    assertValidRating(rating);
    if (comment.length < 5) throw createError("La resena debe tener al menos 5 caracteres.", 400);
    if (comment.length > 500) throw createError("La resena no puede superar 500 caracteres.", 400);

    const service = await findServiceForReview(serviceId);
    if (!service) throw createError("Servicio no encontrado.", 404);
    assertAllowed(service.idUsuario === authUser.id, "Solo puedes resenar tus propios servicios.");
    if (!isCompletedStatus(service.estado?.nombreEstado)) {
      throw createError("Solo puedes resenar servicios completados.", 409);
    }

    const existing = await prisma.resena.findFirst({
      where: {
        idUsuario: authUser.id,
        idSolicitudServicio: service.idSolicitudServicio,
        estado: { not: "Eliminada" },
      },
    });
    if (existing) throw createError("Ya existe una resena para este servicio.", 409);

    const review = await prisma.resena.create({
      data: {
        idUsuario: authUser.id,
        idSolicitudServicio: service.idSolicitudServicio,
        calificacion: rating,
        comentario: comment,
        estado: "Activa",
      },
      include: includeRelations,
    });

    return formatReview(review);
  },

  async respond(authUser, reviewId, payload = {}) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);
    const isAdvisor = authUser.role === "asesor";
    assertAllowed(isTechnician(authUser) || isAdmin(authUser) || isAdvisor, "Solo tecnico asignado, asesor asignado o admin pueden responder resenas.");

    const response = getPayloadText(payload, "response", "respuesta", "technicianResponse", "respuestaTecnico");
    if (response.length < 2) throw createError("La respuesta debe tener al menos 2 caracteres.", 400);
    if (response.length > 500) throw createError("La respuesta no puede superar 500 caracteres.", 400);

    const review = await prisma.resena.findUnique({
      where: { idResena: Number(reviewId) },
      include: includeRelations,
    });
    if (!review) throw createError("Resena no encontrada.", 404);
    if (review.estado === "Eliminada") throw createError("No se puede responder una resena eliminada.", 409);

    if (isTechnician(authUser)) {
      const assigned = review.solicitudServicio?.citas?.some(cita => cita.idUsuarioTecnico === authUser.id);
      assertAllowed(assigned, "Solo el tecnico asignado puede responder esta resena.");
    }
    if (isAdvisor) {
      assertAllowed(review.asesoria?.idUsuarioAsesor === authUser.id, "Solo el asesor asignado puede responder esta resena.");
    }

    const updated = await prisma.resena.update({
      where: { idResena: review.idResena },
      data: { respuestaTecnico: response },
      include: includeRelations,
    });

    return formatReview(updated);
  },
};
