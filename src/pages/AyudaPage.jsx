import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { BtnGhost, BtnPrimary } from "../components/ui/Button";
import { inputSt } from "../components/ui/fieldStyles";
import { getHelpCategories, getVisibleHelpArticles } from "../domains/help/data/helpContent";
import { helpApi } from "../domains/help/services/helpApi";
import { normalizeHelpArticle, normalizeHelpArticles } from "../domains/help/services/helpMappers";

const typeColors = {
  FAQ: "#DBEAFE",
  Guia: "#DCFCE7",
  Procedimiento: "#FDE68A",
  Tutorial: "#EDE9FE",
  Contextual: "#FCE7F3",
};

const ROLE_OPTIONS = ["todos", "admin", "tecnico", "usuario", "asesor"];
const TYPE_OPTIONS = ["Guia", "FAQ", "Procedimiento", "Tutorial", "Contextual"];
const STATUS_OPTIONS = ["borrador", "publicado", "archivado"];

const emptyAdminForm = {
  id: null,
  title: "",
  summary: "",
  content: "",
  category: "General",
  type: "Guia",
  screen: "",
  action: "",
  status: "borrador",
  roles: ["todos"],
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ArticleBadge({ children, tone = "#DBEAFE" }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      minHeight: 24,
      borderRadius: 999,
      background: tone,
      color: "#0F172A",
      padding: "3px 9px",
      fontSize: 12,
      fontWeight: 850,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function ArticleCard({ article, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: 8,
        background: active ? "rgba(37, 99, 235, 0.10)" : "var(--surface)",
        padding: 16,
        cursor: "pointer",
        display: "grid",
        gap: 10,
        boxShadow: active ? "0 12px 28px rgba(37, 99, 235, 0.14)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <h3 style={{ color: "var(--text)", fontSize: 16, lineHeight: 1.25, margin: 0, fontWeight: 900 }}>{article.title}</h3>
        <ArticleBadge tone={typeColors[article.type]}>{article.type}</ArticleBadge>
      </div>
      <p style={{ color: "var(--text3)", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{article.summary}</p>
      <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850 }}>{article.category}</div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="panel-card" style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", padding: 18 }}>
      <h3 style={{ color: "var(--text)", margin: "0 0 6px", fontSize: 17 }}>Sin resultados</h3>
      <p style={{ color: "var(--text3)", margin: 0, fontSize: 14 }}>No hay articulos disponibles para esos filtros.</p>
    </div>
  );
}

function AdminField({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}

function getArticleAdminId(article) {
  return article.backendId || article.helpId || article.idAyuda || article.id;
}

function buildAdminPayload(form) {
  return {
    title: form.title,
    summary: form.summary,
    content: form.content,
    category: form.category,
    type: form.type,
    screen: form.screen,
    action: form.action,
    status: form.status,
    roles: form.roles,
  };
}

function HelpAdminPanel({ articles, onSaved, flash }) {
  const [form, setForm] = useState(emptyAdminForm);
  const [saving, setSaving] = useState(false);

  const adminArticles = articles;
  const isEditing = Boolean(form.id);

  const setValue = key => value => setForm(current => ({ ...current, [key]: value }));
  const toggleRole = role => {
    setForm(current => {
      const hasRole = current.roles.includes(role);
      const nextRoles = hasRole ? current.roles.filter(item => item !== role) : [...current.roles, role];
      return { ...current, roles: nextRoles.length ? nextRoles : ["todos"] };
    });
  };

  const fillFormFromArticle = article => {
    const normalized = normalizeHelpArticle(article);
    setForm({
      id: getArticleAdminId(normalized),
      title: normalized.title || "",
      summary: normalized.summary || "",
      content: normalized.steps?.join("\n") || normalized.summary || "",
      category: normalized.category || "General",
      type: normalized.type || "Guia",
      screen: normalized.screen || "",
      action: normalized.action || "",
      status: normalized.status || "borrador",
      roles: normalized.roles?.length ? normalized.roles : ["todos"],
    });
  };

  const editArticle = async article => {
    try {
      const detail = article.slug ? await helpApi.getArticle(article.slug) : article;
      fillFormFromArticle({ ...article, ...detail });
    } catch {
      fillFormFromArticle(article);
      flash?.("No se pudo cargar el detalle completo; se usaran los datos visibles.", "error");
    }
  };

  const submit = async event => {
    event.preventDefault();
    if (!form.title.trim()) return flash?.("El titulo es obligatorio.", "error");
    if (!form.content.trim() && !form.summary.trim()) return flash?.("Agrega resumen o contenido.", "error");

    try {
      setSaving(true);
      if (isEditing) {
        await helpApi.updateArticle(form.id, buildAdminPayload(form));
        flash?.("Articulo actualizado.");
      } else {
        await helpApi.createArticle(buildAdminPayload(form));
        flash?.("Articulo creado.");
      }
      setForm(emptyAdminForm);
      await onSaved();
    } catch (error) {
      flash?.(error.message || "No se pudo guardar el articulo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (article, nextStatus) => {
    try {
      const id = getArticleAdminId(article);
      if (nextStatus === "publicado") {
        await helpApi.publishArticle(id);
      } else if (nextStatus === "archivado") {
        await helpApi.archiveArticle(id);
      } else {
        await helpApi.updateArticle(id, { status: nextStatus });
      }
      flash?.("Estado actualizado.");
      await onSaved();
    } catch (error) {
      flash?.(error.message || "No se pudo cambiar el estado.", "error");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: 18, marginBottom: 20 }}>
      <form onSubmit={submit} className="panel-card" style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", padding: 18, display: "grid", gap: 12 }}>
        <h3 style={{ color: "var(--text)", margin: 0, fontSize: 18, fontWeight: 900 }}>{isEditing ? "Editar articulo" : "Nuevo articulo"}</h3>
        <AdminField label="Titulo">
          <input value={form.title} onChange={event => setValue("title")(event.target.value)} style={inputSt} maxLength={100} />
        </AdminField>
        <AdminField label="Resumen">
          <textarea value={form.summary} onChange={event => setValue("summary")(event.target.value)} style={{ ...inputSt, minHeight: 70, resize: "vertical" }} maxLength={255} />
        </AdminField>
        <AdminField label="Contenido">
          <textarea value={form.content} onChange={event => setValue("content")(event.target.value)} style={{ ...inputSt, minHeight: 120, resize: "vertical" }} />
        </AdminField>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 10 }}>
          <AdminField label="Categoria">
            <input value={form.category} onChange={event => setValue("category")(event.target.value)} style={inputSt} maxLength={50} />
          </AdminField>
          <AdminField label="Tipo">
            <select value={form.type} onChange={event => setValue("type")(event.target.value)} style={inputSt}>
              {TYPE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </AdminField>
          <AdminField label="Estado">
            <select value={form.status} onChange={event => setValue("status")(event.target.value)} style={inputSt}>
              {STATUS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </AdminField>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 10 }}>
          <AdminField label="Pantalla">
            <input value={form.screen} onChange={event => setValue("screen")(event.target.value)} style={inputSt} maxLength={80} />
          </AdminField>
          <AdminField label="Accion">
            <input value={form.action} onChange={event => setValue("action")(event.target.value)} style={inputSt} maxLength={80} />
          </AdminField>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Roles</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ROLE_OPTIONS.map(role => (
              <label key={role} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text2)", fontSize: 13, border: "1px solid var(--border)", borderRadius: 999, padding: "7px 10px", background: form.roles.includes(role) ? "rgba(37, 99, 235, 0.12)" : "var(--surface2)" }}>
                <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                {role}
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <BtnPrimary type="submit" icon="check" disabled={saving}>{saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}</BtnPrimary>
          <BtnGhost type="button" icon="x" onClick={() => setForm(emptyAdminForm)}>Limpiar</BtnGhost>
        </div>
      </form>

      <div className="panel-card" style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", padding: 18, display: "grid", gap: 12 }}>
        <h3 style={{ color: "var(--text)", margin: 0, fontSize: 18, fontWeight: 900 }}>Gestion editorial</h3>
        <div style={{ display: "grid", gap: 10, maxHeight: 620, overflowY: "auto", paddingRight: 4 }}>
          {adminArticles.map(article => (
            <div key={article.slug || article.id} style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface2)", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 900 }}>{article.title}</div>
                  <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>{article.category} - {article.status}</div>
                </div>
                <ArticleBadge tone={typeColors[article.type]}>{article.type}</ArticleBadge>
              </div>
              <div style={{ color: "var(--text3)", fontSize: 12 }}>{article.roles?.join(", ") || "todos"}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <BtnGhost icon="edit" onClick={() => editArticle(article)}>Editar</BtnGhost>
                {article.status !== "publicado" && <BtnGhost icon="check" onClick={() => changeStatus(article, "publicado")}>Publicar</BtnGhost>}
                {article.status !== "archivado" && <BtnGhost icon="x" onClick={() => changeStatus(article, "archivado")}>Archivar</BtnGhost>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArticleDetail({ article, articles, onSelectRelated }) {
  const related = article.related
    .map(item => (typeof item === "object" ? item : articles.find(articleItem => articleItem.id === item || articleItem.slug === item)))
    .filter(Boolean);

  return (
    <div className="panel-card" style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", padding: 20, display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ArticleBadge tone={typeColors[article.type]}>{article.type}</ArticleBadge>
          <ArticleBadge tone="#E0F2FE">{article.category}</ArticleBadge>
        </div>
        <h2 style={{ color: "var(--text)", margin: 0, fontFamily: "var(--font-head)", fontSize: 24, lineHeight: 1.1 }}>{article.title}</h2>
        <p style={{ color: "var(--text3)", margin: 0, fontSize: 15, lineHeight: 1.55 }}>{article.summary}</p>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {article.steps.map((step, index) => (
          <div key={step} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, alignItems: "start" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 13 }}>
              {index + 1}
            </div>
            <div style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.5, paddingTop: 5 }}>{step}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
        <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 14, marginBottom: 10 }}>Relacionados</div>
        {related.length === 0 && <p style={{ color: "var(--text3)", margin: 0, fontSize: 14 }}>No hay articulos relacionados.</p>}
        {related.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {related.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectRelated(item.slug || item.id)}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  background: "var(--surface2)",
                  color: "var(--text2)",
                  padding: "8px 11px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AyudaPage({ session, setTab, flash }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selectedId, setSelectedId] = useState("");
  const [articles, setArticles] = useState([]);
  const [categoriesFromApi, setCategoriesFromApi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const role = session?.rol || "";
  const fallbackArticles = useMemo(() => getVisibleHelpArticles(role), [role]);

  const loadHelpData = useCallback(async (active = true) => {
    try {
      setLoading(true);
      setError("");
      const [articlesResponse, categoriesResponse] = await Promise.all([
        helpApi.listArticles(role === "admin" ? { includeAll: "true" } : undefined),
        helpApi.listCategories(),
      ]);

      if (!active) return;
      const normalized = normalizeHelpArticles(articlesResponse);
      setArticles(normalized.length ? normalized : fallbackArticles);
      setCategoriesFromApi(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      setUsingFallback(normalized.length === 0);
    } catch (loadError) {
      if (!active) return;
      setArticles(fallbackArticles);
      setCategoriesFromApi([]);
      setUsingFallback(true);
      setError(loadError.message || "No se pudo cargar la ayuda desde el servidor.");
    } finally {
      if (active) setLoading(false);
    }
  }, [fallbackArticles, role]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      loadHelpData(active);
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadHelpData]);

  const visibleArticles = articles;
  const categories = useMemo(() => {
    const source = categoriesFromApi.length ? ["Todas", ...categoriesFromApi] : getHelpCategories(visibleArticles);
    return Array.from(new Set(source));
  }, [categoriesFromApi, visibleArticles]);

  const filteredArticles = useMemo(() => {
    const needle = normalizeText(query);
    return visibleArticles.filter(article => {
      const matchesCategory = category === "Todas" || article.category === category;
      const haystack = normalizeText([
        article.title,
        article.summary,
        article.category,
        article.type,
        article.screen,
        article.action,
        ...article.steps,
      ].join(" "));
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [category, query, visibleArticles]);

  const selectedArticle = useMemo(() => (
    filteredArticles.find(article => article.id === selectedId || article.slug === selectedId) || filteredArticles[0] || null
  ), [filteredArticles, selectedId]);

  useEffect(() => {
    let active = true;
    const slug = selectedArticle?.slug;
    if (!slug || usingFallback) return undefined;

    async function loadDetail() {
      try {
        const detail = normalizeHelpArticle(await helpApi.getArticle(slug));
        if (!active) return;
        setArticles(current => current.map(article => (
          article.slug === detail.slug || article.id === detail.id ? { ...article, ...detail } : article
        )));
      } catch {
        // The list view remains usable if detail loading fails.
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [selectedArticle?.slug, usingFallback]);

  const roleLabel = {
    admin: "Administrador",
    tecnico: "Tecnico",
    usuario: "Usuario",
    asesor: "Asesor",
  }[role] || "Cuenta";

  return (
    <div>
      <PageHead title="Ayuda" sub={`Base de conocimiento para ${roleLabel}`} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <BtnGhost icon="home" onClick={() => setTab?.("dashboard")}>Volver al inicio</BtnGhost>
        {role === "admin" && <BtnPrimary icon="shield" onClick={() => setAdminMode(current => !current)}>{adminMode ? "Ver articulos" : "Gestion de contenidos"}</BtnPrimary>}
      </div>

      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando ayuda...</p>}
      {!loading && usingFallback && error && (
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: -8 }}>Contenido local disponible mientras se restablece la conexion.</p>
      )}

      <div className="panel-card" style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", padding: 16, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Buscar</span>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Buscar por tema, pantalla o proceso"
              style={inputSt}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Categoria</span>
            <select value={category} onChange={event => setCategory(event.target.value)} style={inputSt}>
              {categories.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      {role === "admin" && adminMode && (
        <HelpAdminPanel articles={visibleArticles} onSaved={() => loadHelpData(true)} flash={flash} />
      )}

      {!adminMode && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 18, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ color: "var(--text3)", fontSize: 13, fontWeight: 850 }}>{filteredArticles.length} articulos disponibles</div>
          {filteredArticles.length === 0 && <EmptyState />}
          {filteredArticles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              active={selectedArticle?.id === article.id}
              onClick={() => setSelectedId(article.slug || article.id)}
            />
          ))}
        </div>

        <div style={{ position: "sticky", top: 18 }}>
          {selectedArticle ? (
            <ArticleDetail article={selectedArticle} articles={visibleArticles} onSelectRelated={setSelectedId} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>}
    </div>
  );
}
