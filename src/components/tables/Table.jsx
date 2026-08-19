export const Table = ({ headers, rows }) => (
  <div className="table-frame" style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
    <div className="table-scroll" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
            {headers.map((h, i) => <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }}>Sin registros aún.</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="row-hover" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", fontSize: 14, color: "var(--text)", verticalAlign: "middle" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
