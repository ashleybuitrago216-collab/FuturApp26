import { Badge } from "../components/ui/Badge";
import { StatCard } from "../components/cards/StatCard";
import { normalizeServiceStatus } from "../domains/services/model/servicesModel";
import { cop } from "../utils/helpers";
import { AsesorDashboardPage } from "./AsesorDashboardPage";

export function Dashboard(props) {
  const { data, session, isAdmin } = props;
  if (session?.rol === "asesor") return <AsesorDashboardPage {...props} />;

  const mySvcs  = isAdmin ? data.servicios : data.servicios.filter(s => s.usuarioId === session.id);
  const myCitas = isAdmin ? data.citas     : data.citas.filter(c => c.clienteId === session.id);
  const fecha   = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Hola, {session.nombre} 👋</h2>
        <p style={{ color: "var(--text3)", fontSize: 14, textTransform: "capitalize" }}>{fecha}</p>
      </div>

      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {isAdmin && <StatCard label="Usuarios"    value={data.users.length}         icon="users" accent="#7C3AED" />}
        <StatCard             label="Servicios"   value={mySvcs.length}             icon="tool"  accent="#C84B31" />
        <StatCard             label="Citas"       value={myCitas.length}            icon="cal"   accent="#2563EB" />
        <StatCard             label="Resenas"     value={data.comentarios.length}   icon="chat"  accent="#2C6E49" />
        {isAdmin && <StatCard label="Ingresos"    value={cop(data.pagos.reduce((a,p)=>a+p.valor,0))} icon="pay" accent="#D97706" />}
      </div>

      <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>Servicios recientes</h3>
          {mySvcs.slice(0, 5).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.tipo}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{s.fecha}</div>
              </div>
              <Badge label={normalizeServiceStatus(s.estado)} />
            </div>
          ))}
          {mySvcs.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>Sin servicios registrados.</p>}
        </div>

        <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>Próximas citas</h3>
          {myCitas.slice(0, 5).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.servicio}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{c.fecha} — {c.hora}</div>
              </div>
              <Badge label={c.estado} />
            </div>
          ))}
          {myCitas.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>Sin citas registradas.</p>}
        </div>
      </div>
    </div>
  );
}
