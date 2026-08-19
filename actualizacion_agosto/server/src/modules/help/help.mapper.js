function formatAuthor(author) {
  if (!author) return null;

  return {
    id: author.idUsuario,
    name: `${author.nombre || ""}${author.apellido ? ` ${author.apellido}` : ""}`.trim(),
    email: author.correo,
  };
}

function formatRelatedItem(relation, allowedIds = null) {
  const article = relation?.ayudaDestino;
  if (!article) return null;
  if (allowedIds && !allowedIds.has(article.idAyuda)) return null;

  return {
    id: article.idAyuda,
    slug: article.slug,
    title: article.titulo,
    titulo: article.titulo,
    category: article.categoria,
    categoria: article.categoria,
    type: article.tipoContenido,
    tipoContenido: article.tipoContenido,
    summary: article.resumen || article.descripcion || "",
    resumen: article.resumen || article.descripcion || "",
  };
}

export function formatHelpArticle(article, { detail = false, allowedRelatedIds = null } = {}) {
  const related = detail
    ? (article.relacionadasOrigen || [])
      .map(relation => formatRelatedItem(relation, allowedRelatedIds))
      .filter(Boolean)
    : undefined;

  return {
    id: article.idAyuda,
    helpId: article.idAyuda,
    slug: article.slug,
    title: article.titulo,
    titulo: article.titulo,
    summary: article.resumen || article.descripcion || "",
    resumen: article.resumen || article.descripcion || "",
    description: article.descripcion || "",
    descripcion: article.descripcion || "",
    content: detail ? article.contenido || article.descripcion || "" : undefined,
    contenido: detail ? article.contenido || article.descripcion || "" : undefined,
    category: article.categoria || "General",
    categoria: article.categoria || "General",
    type: article.tipoContenido || "guia",
    tipoContenido: article.tipoContenido || "guia",
    screen: article.pantallaContexto || null,
    pantallaContexto: article.pantallaContexto || null,
    action: article.accionContexto || null,
    accionContexto: article.accionContexto || null,
    fileUrl: article.archivoUrl || null,
    archivoUrl: article.archivoUrl || null,
    videoUrl: article.videoUrl || null,
    status: article.estado || "publicado",
    estado: article.estado || "publicado",
    order: article.orden || 0,
    orden: article.orden || 0,
    roles: (article.roles || []).map(item => item.rol),
    author: formatAuthor(article.autor),
    autor: formatAuthor(article.autor),
    publishedAt: article.fechaPublicacion,
    fechaPublicacion: article.fechaPublicacion,
    updatedAt: article.fechaActualizacion,
    fechaActualizacion: article.fechaActualizacion,
    related,
    relacionados: related,
  };
}
