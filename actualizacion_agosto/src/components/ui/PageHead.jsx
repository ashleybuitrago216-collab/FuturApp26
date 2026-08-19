export const PageHead = ({ title, sub, action }) => (
  <div className="page-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: "var(--text3)" }}>{sub}</p>}
    </div>
    {action && <div className="page-head-action">{action}</div>}
  </div>
);
