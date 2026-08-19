import { useEffect, useMemo, useState } from "react";
import { BtnGhost } from "../../../components/ui/Button";
import { getVisibleHelpArticles } from "../data/helpContent";
import { helpApi } from "../services/helpApi";
import { normalizeHelpArticles } from "../services/helpMappers";

export function ContextualHelpButton({ session, screen, action, label = "Ayuda" }) {
  const [open, setOpen] = useState(false);
  const [apiArticles, setApiArticles] = useState([]);
  const [apiFailed, setApiFailed] = useState(false);
  const localArticles = useMemo(() => (
    getVisibleHelpArticles(session?.rol).filter(article => (
      article.screen === screen && (!action || article.action === action)
    ))
  ), [action, screen, session?.rol]);
  const articles = apiArticles.length && !apiFailed ? apiArticles : localArticles;

  useEffect(() => {
    let active = true;

    async function loadContextualHelp() {
      try {
        const response = await helpApi.getContextualHelp({ screen, action });
        if (!active) return;
        setApiArticles(normalizeHelpArticles(response));
        setApiFailed(false);
      } catch {
        if (!active) return;
        setApiArticles([]);
        setApiFailed(true);
      }
    }

    if (screen) loadContextualHelp();

    return () => {
      active = false;
    };
  }, [action, screen]);

  if (articles.length === 0) return null;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <BtnGhost icon="help" onClick={() => setOpen(value => !value)}>{label}</BtnGhost>
      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 8px)",
          width: "min(340px, calc(100vw - 32px))",
          zIndex: 20,
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--surface)",
          boxShadow: "0 18px 38px rgba(15, 23, 42, 0.18)",
          padding: 14,
          display: "grid",
          gap: 10,
        }}>
          {articles.slice(0, 3).map(article => (
            <div key={article.id} style={{ display: "grid", gap: 4 }}>
              <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 14 }}>{article.title}</div>
              <div style={{ color: "var(--text3)", fontSize: 13, lineHeight: 1.45 }}>{article.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
