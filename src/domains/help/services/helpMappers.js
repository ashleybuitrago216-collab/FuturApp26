function splitContentIntoSteps(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(Boolean);

  return lines.length ? lines : ["Consulta el detalle del articulo para continuar."];
}

export function normalizeHelpArticle(article = {}) {
  const id = article.slug || article.id || article.helpId || article.idAyuda;
  const related = Array.isArray(article.related)
    ? article.related
    : Array.isArray(article.relacionados)
      ? article.relacionados
      : [];

  return {
    id,
    backendId: article.id || article.helpId || article.idAyuda,
    slug: article.slug || String(id || ""),
    title: article.title || article.titulo || "Articulo de ayuda",
    summary: article.summary || article.resumen || article.description || article.descripcion || "",
    category: article.category || article.categoria || "General",
    type: normalizeType(article.type || article.tipoContenido || "Guia"),
    screen: article.screen || article.pantallaContexto || "",
    action: article.action || article.accionContexto || "",
    steps: Array.isArray(article.steps) && article.steps.length
      ? article.steps
      : splitContentIntoSteps(article.content || article.contenido || article.description || article.descripcion),
    related: related.map(item => (
      typeof item === "object"
        ? normalizeHelpArticle(item)
        : item
    )),
    status: article.status || article.estado || "publicado",
    roles: article.roles || [],
    source: "api",
  };
}

function normalizeType(value) {
  const text = String(value || "Guia").trim().toLowerCase();
  if (text === "faq") return "FAQ";
  if (text === "procedimiento") return "Procedimiento";
  if (text === "tutorial") return "Tutorial";
  if (text === "contextual") return "Contextual";
  return "Guia";
}

export function normalizeHelpArticles(response) {
  return Array.isArray(response) ? response.map(normalizeHelpArticle) : [];
}
