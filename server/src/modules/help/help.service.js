import { prisma } from "../../config/prisma.js";
import { formatHelpArticle } from "./help.mapper.js";
import {
  canManageHelp,
  getAllowedHelpRoles,
  isPublishedHelpStatus,
  normalizeRole,
} from "./help.permissions.js";

const VALID_ROLES = new Set(["todos", "admin", "tecnico", "usuario", "asesor"]);
const VALID_STATUSES = new Set(["borrador", "publicado", "archivado", "Activo", "activo"]);

const includeListRelations = {
  roles: true,
  autor: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      correo: true,
    },
  },
};

const includeDetailRelations = {
  ...includeListRelations,
  relacionadasOrigen: {
    include: {
      ayudaDestino: {
        include: includeListRelations,
      },
    },
  },
};

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertAdmin(authUser) {
  if (!canManageHelp(authUser)) {
    throw createError("Solo el administrador puede gestionar contenidos de ayuda.", 403);
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function stripHtml(value) {
  return normalizeText(value).replace(/<[^>]*>/g, "");
}

function slugify(value) {
  return normalizeSearch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getReadableWhere(authUser, { includeDrafts = false } = {}) {
  if (canManageHelp(authUser) && includeDrafts) return {};

  const statuses = canManageHelp(authUser) && includeDrafts
    ? undefined
    : ["publicado", "Publicado", "Activo", "activo"];

  return {
    ...(statuses ? { estado: { in: statuses } } : {}),
    roles: {
      some: {
        rol: { in: getAllowedHelpRoles(authUser) },
      },
    },
  };
}

function buildListWhere(authUser, query = {}) {
  const where = getReadableWhere(authUser, { includeDrafts: canManageHelp(authUser) && query.includeAll === "true" });

  if (query.category) {
    where.categoria = String(query.category);
  }

  if (query.type) {
    where.tipoContenido = String(query.type);
  }

  if (query.screen) {
    where.pantallaContexto = String(query.screen);
  }

  if (query.action) {
    where.accionContexto = String(query.action);
  }

  if (query.q) {
    const q = String(query.q).trim();
    where.OR = [
      { titulo: { contains: q } },
      { resumen: { contains: q } },
      { descripcion: { contains: q } },
      { contenido: { contains: q } },
      { categoria: { contains: q } },
      { pantallaContexto: { contains: q } },
      { accionContexto: { contains: q } },
    ];
  }

  return where;
}

function assertReadable(authUser, article) {
  if (!article) throw createError("Articulo de ayuda no encontrado.", 404);
  if (canManageHelp(authUser)) return;

  if (!isPublishedHelpStatus(article.estado)) {
    throw createError("Articulo de ayuda no disponible.", 404);
  }

  const allowedRoles = new Set(getAllowedHelpRoles(authUser));
  const readable = article.roles?.some(item => allowedRoles.has(normalizeRole(item.rol)));
  if (!readable) throw createError("No tienes permisos para consultar este articulo.", 403);
}

function getPayloadRoles(payload = {}) {
  const roles = Array.isArray(payload.roles) ? payload.roles : [];
  const cleaned = roles.map(normalizeRole).filter(role => VALID_ROLES.has(role));
  return cleaned.length ? Array.from(new Set(cleaned)) : ["todos"];
}

function getPayloadRelated(payload = {}) {
  const related = Array.isArray(payload.relatedIds)
    ? payload.relatedIds
    : Array.isArray(payload.relacionadosIds)
      ? payload.relacionadosIds
      : [];

  return Array.from(new Set(related.map(Number).filter(Number.isInteger)));
}

function buildDataFromPayload(payload = {}, authUser, existing = null) {
  const title = normalizeText(payload.title || payload.titulo || existing?.titulo);
  if (!title || title.length < 3) throw createError("El titulo debe tener al menos 3 caracteres.", 400);
  if (title.length > 100) throw createError("El titulo no puede superar 100 caracteres.", 400);

  const status = normalizeText(payload.status || payload.estado || existing?.estado || "borrador");
  if (!VALID_STATUSES.has(status)) throw createError("Estado de articulo no valido.", 400);

  const content = stripHtml(payload.content || payload.contenido || payload.description || payload.descripcion || existing?.contenido || "");
  const summary = stripHtml(payload.summary || payload.resumen || existing?.resumen || content.slice(0, 180));

  return {
    slug: slugify(payload.slug || existing?.slug || title),
    titulo: title,
    resumen: summary.slice(0, 255) || null,
    categoria: normalizeText(payload.category || payload.categoria || existing?.categoria || "General").slice(0, 50),
    tipoContenido: normalizeText(payload.type || payload.tipoContenido || existing?.tipoContenido || "guia").slice(0, 30),
    pantallaContexto: normalizeText(payload.screen || payload.pantallaContexto || existing?.pantallaContexto).slice(0, 80) || null,
    accionContexto: normalizeText(payload.action || payload.accionContexto || existing?.accionContexto).slice(0, 80) || null,
    descripcion: summary || null,
    contenido: content || null,
    archivoUrl: normalizeText(payload.fileUrl || payload.archivoUrl || existing?.archivoUrl).slice(0, 255) || null,
    videoUrl: normalizeText(payload.videoUrl || existing?.videoUrl).slice(0, 255) || null,
    estado: status,
    orden: Number.isInteger(Number(payload.order ?? payload.orden)) ? Number(payload.order ?? payload.orden) : existing?.orden || 0,
    idUsuarioAutor: existing?.idUsuarioAutor || authUser.id,
  };
}

async function replaceRoles(tx, articleId, roles) {
  await tx.ayudaRol.deleteMany({ where: { idAyuda: articleId } });
  await tx.ayudaRol.createMany({
    data: roles.map(rol => ({ idAyuda: articleId, rol })),
    skipDuplicates: true,
  });
}

async function replaceRelated(tx, articleId, relatedIds) {
  await tx.ayudaRelacionada.deleteMany({ where: { idAyuda: articleId } });
  if (!relatedIds.length) return;

  await tx.ayudaRelacionada.createMany({
    data: relatedIds
      .filter(id => id !== articleId)
      .map(id => ({ idAyuda: articleId, idAyudaDestino: id })),
    skipDuplicates: true,
  });
}

export const helpService = {
  async list(authUser, query = {}) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const articles = await prisma.ayuda.findMany({
      where: buildListWhere(authUser, query),
      include: includeListRelations,
      orderBy: [{ orden: "asc" }, { fechaPublicacion: "desc" }, { idAyuda: "desc" }],
    });

    return articles.map(article => formatHelpArticle(article));
  },

  async categories(authUser) {
    const articles = await this.list(authUser, {});
    return Array.from(new Set(articles.map(article => article.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  },

  async context(authUser, query = {}) {
    if (!query.screen) throw createError("La pantalla de contexto es requerida.", 400);
    return this.list(authUser, {
      screen: query.screen,
      ...(query.action ? { action: query.action } : {}),
    });
  },

  async detail(authUser, slugOrId) {
    if (!authUser) throw createError("Usuario autenticado requerido.", 401);

    const numericId = Number(slugOrId);
    const article = await prisma.ayuda.findFirst({
      where: Number.isInteger(numericId) && String(slugOrId).match(/^\d+$/)
        ? { idAyuda: numericId }
        : { slug: String(slugOrId) },
      include: includeDetailRelations,
    });

    assertReadable(authUser, article);

    const readableIds = new Set((await this.list(authUser, {})).map(item => item.id));
    return formatHelpArticle(article, { detail: true, allowedRelatedIds: readableIds });
  },

  async create(authUser, payload = {}) {
    assertAdmin(authUser);
    const data = buildDataFromPayload(payload, authUser);
    const roles = getPayloadRoles(payload);
    const relatedIds = getPayloadRelated(payload);

    const article = await prisma.$transaction(async tx => {
      const created = await tx.ayuda.create({ data });
      await replaceRoles(tx, created.idAyuda, roles);
      await replaceRelated(tx, created.idAyuda, relatedIds);
      return tx.ayuda.findUnique({ where: { idAyuda: created.idAyuda }, include: includeDetailRelations });
    });

    return formatHelpArticle(article, { detail: true });
  },

  async update(authUser, id, payload = {}) {
    assertAdmin(authUser);
    const articleId = Number(id);
    if (!Number.isInteger(articleId)) throw createError("Id de articulo invalido.", 400);

    const existing = await prisma.ayuda.findUnique({ where: { idAyuda: articleId } });
    if (!existing) throw createError("Articulo de ayuda no encontrado.", 404);

    const data = buildDataFromPayload(payload, authUser, existing);
    const roles = Object.prototype.hasOwnProperty.call(payload, "roles") ? getPayloadRoles(payload) : null;
    const relatedIds = Object.prototype.hasOwnProperty.call(payload, "relatedIds") || Object.prototype.hasOwnProperty.call(payload, "relacionadosIds")
      ? getPayloadRelated(payload)
      : null;

    const updated = await prisma.$transaction(async tx => {
      await tx.ayuda.update({ where: { idAyuda: articleId }, data });
      if (roles) await replaceRoles(tx, articleId, roles);
      if (relatedIds) await replaceRelated(tx, articleId, relatedIds);
      return tx.ayuda.findUnique({ where: { idAyuda: articleId }, include: includeDetailRelations });
    });

    return formatHelpArticle(updated, { detail: true });
  },

  async publish(authUser, id) {
    assertAdmin(authUser);
    const updated = await prisma.ayuda.update({
      where: { idAyuda: Number(id) },
      data: { estado: "publicado", fechaPublicacion: new Date() },
      include: includeDetailRelations,
    });
    return formatHelpArticle(updated, { detail: true });
  },

  async archive(authUser, id) {
    assertAdmin(authUser);
    const updated = await prisma.ayuda.update({
      where: { idAyuda: Number(id) },
      data: { estado: "archivado" },
      include: includeDetailRelations,
    });
    return formatHelpArticle(updated, { detail: true });
  },
};
