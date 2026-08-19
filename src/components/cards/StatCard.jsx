import { Ic } from "../ui/Icon";

export const StatCard = ({ label, value, icon, accent }) => (
  <div className="stat-card card-hover" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--shadow)" }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 20 }}><Ic n={icon} size={20} /></div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
      <div className="stat-card-value" style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{value}</div>
    </div>
  </div>
);
