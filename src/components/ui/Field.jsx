import { inputSt } from "./fieldStyles";

export const Field = ({ label, type = "text", value, onChange, opts, req, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}{req && " *"}</label>
    {opts ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={inputSt}>
        <option value="">Seleccionar…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={req} placeholder={placeholder} style={inputSt} />
    )}
  </div>
);

export const Grid2 = ({ children }) => <div className="fields-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
