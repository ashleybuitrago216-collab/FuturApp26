import { useEffect, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { advisoriesApi } from "../domains/advisories/services/advisoriesApi";
import { normalizeAdvisoriesFromApi, normalizeAdvisoryCommentsFromApi } from "../domains/advisories/services/advisoryMappers";

export function AsesorComentariosPage({ flash }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadComments() {
      try {
        setError("");
        const advisories = normalizeAdvisoriesFromApi(await advisoriesApi.listMyAdvisories());
        const comments = await Promise.all(advisories.map(async advisory => {
          const response = normalizeAdvisoryCommentsFromApi(await advisoriesApi.getAdvisoryComments(advisory.id));
          return { advisory, ...response };
        }));
        if (active) setItems(comments);
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.message || "No se pudieron cargar los comentarios.");
        flash?.(loadError?.message || "No se pudieron cargar los comentarios.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadComments();

    return () => {
      active = false;
    };
  }, [flash]);

  const total = items.reduce((sum, item) => sum + item.comments.length, 0);
  const relationAvailable = items.some(item => item.relationAvailable);
  const message = items.find(item => item.message)?.message;

  return (
    <div>
      <PageHead title="Comentarios de asesorias" sub="Comentarios asociados a tus asesorias" />
      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando comentarios...</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}
      {!loading && !error && total === 0 && (
        <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 }}>
          <p style={{ color: "var(--text3)", fontSize: 14, margin: 0 }}>
            {relationAvailable ? "No hay comentarios relacionados con tus asesorias." : message || "No hay comentarios relacionados con tus asesorias."}
          </p>
        </div>
      )}
      {!loading && !error && total > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {items.flatMap(item => item.comments.map(comment => (
            <div key={`${item.advisory.id}-${comment.id}`} className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <p style={{ color: "var(--text)", margin: "0 0 6px", fontWeight: 700 }}>Asesoria #{item.advisory.id}</p>
              <p style={{ color: "var(--text2)", margin: 0, fontSize: 14 }}>{comment.comentario || comment.mensaje || "Comentario sin texto"}</p>
            </div>
          )))}
        </div>
      )}
    </div>
  );
}
