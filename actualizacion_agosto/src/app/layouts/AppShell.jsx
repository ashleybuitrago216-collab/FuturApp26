import { Badge } from "../../components/ui/Badge";
import { Ic } from "../../components/ui/Icon";
import { BRAND } from "../../shared/constants/brand";
import { getVisibleRoutes } from "../router/appRoutes";

export function AppShell({ session, unread, tab, setTab, doLogout, children }) {
  const navItems = getVisibleRoutes(session);

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <aside className="app-sidebar" style={{ width: 230, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
        <div className="app-brand" style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img className="app-brand-logo brand-logo-sidebar" src={BRAND.logo} alt={BRAND.name} style={{ width: 48, height: 48, borderRadius: 9, objectFit: "contain", flexShrink: 0, background: "#040A15" }} />
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: "var(--text)", letterSpacing: "0" }}>{BRAND.name}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Panel operativo</div>
            </div>
          </div>
        </div>

        <nav className="app-nav" style={{ flex: 1, padding: "12px 10px" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn${tab === item.id ? " active" : ""}`}
              onClick={() => setTab(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500, marginBottom: 2, position: "relative", color: "var(--text2)", background: "transparent", fontFamily: "var(--font-body)" }}
            >
              <Ic n={item.icon} />
              {item.label}
              {item.id === "notificaciones" && unread > 0 && (
                <span style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{unread}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="app-account" style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
          <div className="app-user-card" style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 50, background: "var(--text)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{session.nombre[0]}{session.apellido[0]}</div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.nombre} {session.apellido}</div>
                <Badge label={session.rol} />
              </div>
            </div>
          </div>
          <button
            className="app-logout btn-ghost"
            onClick={doLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "var(--text3)", fontSize: 13, fontFamily: "var(--font-body)" }}
          >
            <Ic n="logout" /> <span className="app-logout-label">Cerrar sesion</span>
          </button>
        </div>
      </aside>

      <main className="app-main" style={{ flex: 1, overflowY: "auto", padding: "30px 34px", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
