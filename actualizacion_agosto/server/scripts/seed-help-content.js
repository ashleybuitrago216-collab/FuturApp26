import { prisma } from "../src/config/prisma.js";
import { helpArticles } from "../../src/domains/help/data/helpContent.js";

function toContent(article) {
  return (article.steps || []).map((step, index) => `${index + 1}. ${step}`).join("\n");
}

async function upsertArticle(article) {
  const existing = await prisma.ayuda.findFirst({
    where: { slug: article.id },
  });

  const data = {
    slug: article.id,
    titulo: article.title,
    resumen: article.summary,
    categoria: article.category,
    tipoContenido: String(article.type || "Guia").toLowerCase(),
    pantallaContexto: article.screen || null,
    accionContexto: article.action || null,
    descripcion: article.summary,
    contenido: toContent(article),
    estado: "publicado",
  };

  const saved = existing
    ? await prisma.ayuda.update({ where: { idAyuda: existing.idAyuda }, data })
    : await prisma.ayuda.create({ data });

  await prisma.ayudaRol.deleteMany({ where: { idAyuda: saved.idAyuda } });
  await prisma.ayudaRol.createMany({
    data: article.roles.map(rol => ({ idAyuda: saved.idAyuda, rol })),
    skipDuplicates: true,
  });

  return saved;
}

async function main() {
  const bySlug = new Map();

  for (const article of helpArticles) {
    const saved = await upsertArticle(article);
    bySlug.set(article.id, saved.idAyuda);
  }

  for (const article of helpArticles) {
    const sourceId = bySlug.get(article.id);
    const relatedIds = (article.related || [])
      .map(slug => bySlug.get(slug))
      .filter(Boolean)
      .filter(id => id !== sourceId);

    await prisma.ayudaRelacionada.deleteMany({ where: { idAyuda: sourceId } });
    if (relatedIds.length) {
      await prisma.ayudaRelacionada.createMany({
        data: relatedIds.map(id => ({ idAyuda: sourceId, idAyudaDestino: id })),
        skipDuplicates: true,
      });
    }
  }

  console.log(`Seed de ayuda completado: ${helpArticles.length} articulos.`);
}

main()
  .catch(error => {
    console.error("Error ejecutando seed de ayuda:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
